import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { ApproveAllScenesButton } from "./ApproveAllScenesButton";
import { Clapperboard, MapPin, Users, Sun, CheckCircle2, Navigation } from "lucide-react";

export default async function ScenesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { 
      ProductionStoryboard: { 
        include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } }
      }
    }
  });

  if (!project) redirect(`/projects`);

  const scenes = await prisma.productionScene.findMany({
    where: { storyboard_id: project.ProductionStoryboard?.id || "" },
    include: {
      Versions: {
        orderBy: { version_number: 'desc' },
        take: 1
      }
    },
    orderBy: { scene_number: 'asc' }
  });

  async function triggerSceneGen() {
    "use server";
    const res = await fetch(`http://localhost:${process.env.PORT || 3003}/api/v1/projects/${resolvedParams.id}/workflows/scene-gen`, {
      method: "POST"
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
        throw new Error(await res.text());
    }
    if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
    }
    revalidatePath(`/projects/${resolvedParams.id}/scenes`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StageHeader 
        title="Scene Workspace"
        status={scenes.length > 0 ? "IN_PROGRESS" : "NOT_STARTED"}
        progress={0}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      {scenes.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <Navigation className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Scenes Generated</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Scene Workspace converts your Storyboard into independent production objects containing blocking, schedule, and assignments.
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

          <div className="grid grid-cols-1 gap-6">
            {scenes.map((scene) => {
              const version = scene.Versions?.[0];
              return (
                <div key={scene.id} className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                  <div className="md:w-1/4 bg-slate-50 p-6 border-r flex flex-col justify-center">
                    <div className="text-sm font-bold text-slate-400 mb-1">SCENE {scene.scene_number}</div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{scene.title}</h3>
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded">{version?.scene_type || "N/A"}</span>
                      <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded">{version?.time_of_day || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <p className="text-slate-600 text-sm">{scene.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-1">{version?.location_ref}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Characters</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-1">{version?.characters_ref}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Clapperboard className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Props</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-1">{version?.props_ref || 'None'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Sun className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Mood / Notes</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-1">{scene.mood}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-32 bg-slate-50 flex items-center justify-center border-l p-4">
                     <button className="w-full bg-white border hover:bg-slate-50 text-slate-700 text-sm font-bold py-2 rounded-lg transition">Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
