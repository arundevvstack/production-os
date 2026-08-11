import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApproveAllScenesButton } from "./ApproveAllScenesButton";
import { SceneCard } from "./SceneCard";
import { Navigation } from "lucide-react";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";

export default async function ScenesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      ProductionStoryboard: {
        include: { Versions: { orderBy: { version_number: "desc" }, take: 1 } }
      }
    }
  });

  if (!project) redirect(`/projects`);

  const scenes = await prisma.productionScene.findMany({
    where: { storyboard_id: project.ProductionStoryboard?.id || "" },
    include: {
      Versions: { orderBy: { version_number: "desc" }, take: 1 }
    },
    orderBy: { scene_number: "asc" }
  });

  const workflowState = await WorkflowEngine.getWorkflowState(resolvedParams.id);
  const statusInfo = workflowState.stages.find(s => s.id === "scenes");

  // Build scene_number → storyboard image_url lookup from the storyboard version content.
  // This is the source of truth for thumbnails — no duplicate storage.
  const storyboardContent: any[] =
    (project.ProductionStoryboard?.Versions?.[0]?.content as any[]) || [];
  const storyboardImageMap: Record<number, string | null> = {};
  storyboardContent.forEach((s: any, idx: number) => {
    const key = s.scene_number != null ? Number(s.scene_number) : idx + 1;
    storyboardImageMap[key] = s.image_url || null;
  });

  async function triggerSceneGen() {
    "use server";
    const res = await fetch(
      `http://localhost:${process.env.PORT || 3003}/api/v1/projects/${resolvedParams.id}/workflows/scene-gen`,
      { method: "POST" }
    );
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) throw new Error(await res.text());
    if (!contentType.includes("application/json"))
      throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
    revalidatePath(`/projects/${resolvedParams.id}/scenes`);
  }

  return (
    // Layout padding is provided by the project layout (p-6 md:p-8).
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">
      
      {scenes.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <Navigation className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Scenes Generated</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Scene Workspace converts your Storyboard into independent production objects
            containing blocking, schedule, and assignments.
          </p>
          <form action={triggerSceneGen}>
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow hover:bg-slate-800 transition">
              Generate Scenes from Storyboard
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Production Scenes</h2>
            <div className="flex gap-2">
              <ApproveAllScenesButton projectId={project.id} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {scenes.map((scene) => (
              <SceneCard 
              key={scene.id} 
              scene={scene} 
              projectId={resolvedParams.id} 
              storyboardImageUrl={storyboardImageMap[scene.scene_number] || null} 
              aspectRatio={(project as any).aspect_ratio}
            />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
