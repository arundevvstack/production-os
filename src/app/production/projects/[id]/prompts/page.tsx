import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { CreateJobDialog } from "@/components/production/CreateJobDialog";

export default async function PromptsPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { 
      production_script: true,
      production_storyboard: { 
        include: { 
          scenes: { 
            include: { 
              shots: { 
                include: { prompt_sets: true },
                orderBy: { shot_number: 'asc' } 
              } 
            },
            orderBy: { scene_number: 'asc' }
          } 
        } 
      }
    }
  });

  if (!project) redirect(`/production/projects`);

  const statusInfo = WorkflowEngine.evaluateStageStatus('prompts', project);
  if (statusInfo.isLocked) redirect(`/production/projects/${params.id}`);

  const scenes = project.production_storyboard?.scenes || [];
  const providers = await prisma.productionAIProvider.findMany({ where: { is_enabled: true } });

  const mappedProviders = providers.map(p => ({
    id: p.id,
    name: p.name,
    models: p.supported_models,
    types: p.supported_asset_types
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader 
        title="Prompt Studio"
        status={statusInfo.status}
        progress={0}
      />

      <div className="space-y-10 mt-8">
        {scenes.map((scene) => (
          <div key={scene.id} className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2">Scene {scene.scene_number}: {scene.title}</h2>
            
            <div className="space-y-6">
              {scene.shots.map((shot) => {
                const promptSet = shot.prompt_sets[0];
                return (
                  <div key={shot.id} className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition">
                    <div className="bg-slate-900 text-white w-full md:w-16 flex flex-row md:flex-col items-center justify-center font-bold text-lg p-2 md:p-0 relative">
                      <span className="text-[10px] text-slate-400 mr-2 md:mr-0 md:mb-1 uppercase tracking-widest">Shot</span>
                      {shot.shot_number}
                    </div>
                    <div className="p-6 flex-1 space-y-4 relative">
                      <div className="absolute top-4 right-4">
                        <CreateJobDialog 
                          projectId={project.id}
                          sceneId={scene.id}
                          shotId={shot.id}
                          promptSetId={promptSet?.id || ''}
                          providers={mappedProviders}
                        />
                      </div>
                      {promptSet ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" /> Image Prompt
                            </span>
                            <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                              {promptSet.status}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 font-medium border border-slate-100 leading-relaxed">
                            {promptSet.image_prompt || "No image prompt defined."}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Video Prompt
                              </span>
                              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
                                {promptSet.video_prompt || "No video prompt defined."}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Character Prompt</span>
                              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
                                {promptSet.character_prompt || "No character prompt defined."}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500 py-4 italic">No prompt set created for this shot yet.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed rounded-2xl text-slate-500 bg-white">
            No scenes available.
          </div>
        )}
      </div>
    </div>
  );
}
