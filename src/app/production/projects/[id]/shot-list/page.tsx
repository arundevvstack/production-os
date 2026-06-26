import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { Camera, Video } from "lucide-react";

export default async function ShotListPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { 
      production_script: true,
      production_storyboard: { 
        include: { 
          scenes: { 
            include: { shots: { orderBy: { shot_number: 'asc' } } },
            orderBy: { scene_number: 'asc' }
          } 
        } 
      }
    }
  });

  if (!project) redirect(`/production/projects`);

  const statusInfo = WorkflowEngine.evaluateStageStatus('shot_list', project);
  if (statusInfo.isLocked) redirect(`/production/projects/${params.id}`);

  const scenes = project.production_storyboard?.scenes || [];

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader 
        title="Shot List"
        status={statusInfo.status}
        progress={0}
      />

      <div className="space-y-10 mt-8">
        {scenes.map((scene) => (
          <div key={scene.id} className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <h2 className="text-lg font-bold">Scene {scene.scene_number}: {scene.title}</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {scene.shots.map((shot) => (
                <div key={shot.id} className="border rounded-xl bg-white shadow-sm overflow-hidden flex hover:shadow-md transition">
                  <div className="bg-slate-900 text-white w-16 flex flex-col items-center justify-center font-bold text-lg">
                    {shot.shot_number}
                  </div>
                  <div className="p-4 flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400 text-xs font-semibold uppercase mb-1 flex items-center gap-1"><Camera className="h-3 w-3"/> Camera</div>
                      <div className="font-medium">{shot.camera || "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs font-semibold uppercase mb-1 flex items-center gap-1"><Video className="h-3 w-3"/> Movement</div>
                      <div className="font-medium">{shot.movement || "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Lens</div>
                      <div className="font-medium">{shot.lens || "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Duration</div>
                      <div className="font-medium">{shot.duration || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Environment</div>
                      <div className="font-medium">{shot.environment || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Character</div>
                      <div className="font-medium">{shot.character || "—"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed rounded-2xl text-slate-500 bg-white">
            No scenes available for shots.
          </div>
        )}
      </div>
    </div>
  );
}
