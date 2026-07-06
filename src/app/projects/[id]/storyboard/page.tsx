import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { ImageIcon, Clapperboard, MapPin, Users, Sun, Camera, FileText, RefreshCw } from "lucide-react";
import { SceneImage } from "./SceneImage";
import ApproveSceneButton from "./ApproveSceneButton";
import { EditSceneButton } from "./EditSceneButton";

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { 
      ProductionStoryboard: { 
        include: {
          Versions: {
            orderBy: { version_number: 'desc' },
            take: 1
          }
        } 
      }
    }
  });

  if (!project) redirect(`/projects`);

  const storyboard = (project as any).ProductionStoryboard;
  const latestVersion = storyboard?.Versions?.[0] || null;
  const scenes = latestVersion?.content ? (latestVersion.content as any[]) : [];

  async function triggerStoryboardGen() {
    "use server";
    // Normally this would be a queued background job, here we simulate triggering the API directly for demo.
    // In production we use bullmq or trigger.dev
    const res = await fetch(`http://localhost:${process.env.PORT || 3003}/api/v1/projects/${resolvedParams.id}/workflows/storyboard-gen`, {
      method: "POST"
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
        throw new Error(await res.text());
    }
    if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
    }
    revalidatePath(`/projects/${resolvedParams.id}/storyboard`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StageHeader 
        title="AI Storyboard Editor"
        status={latestVersion ? "DRAFT" : "NOT_STARTED"}
        progress={0}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      {!latestVersion ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <Clapperboard className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Storyboard Generated</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Visual Planning Engine has not yet generated a storyboard. Approve your script breakdown to auto-generate, or trigger manually.
          </p>
          <form action={triggerStoryboardGen}>
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow hover:bg-slate-800 transition">
              Generate Storyboard from Breakdown
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <form action={triggerStoryboardGen}>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-all shadow-sm">
                <RefreshCw className="w-4 h-4" /> Regenerate All Storyboards
              </button>
            </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenes.map((scene: any, i: number) => (
            <div key={i} className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              <SceneImage scene={scene} projectId={resolvedParams.id} sceneIndex={i} />
              
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{scene.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">{scene.scene_summary || scene.visual_description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Location</span>
                      <span className="text-slate-700 font-medium line-clamp-1">{scene.environment_description || 'Auto'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Characters</span>
                      <span className="text-slate-700 font-medium line-clamp-1">{scene.character_placement || 'Auto'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Camera className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Camera</span>
                      <span className="text-slate-700 font-medium line-clamp-1">{scene.camera_angle || 'Auto'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sun className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Lighting</span>
                      <span className="text-slate-700 font-medium line-clamp-1">{scene.lighting_plan || 'Auto'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <EditSceneButton scene={scene} sceneIndex={i} projectId={project.id} />
                  <ApproveSceneButton projectId={project.id} sceneIndex={i} initialApproved={!!scene.is_approved} />
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
