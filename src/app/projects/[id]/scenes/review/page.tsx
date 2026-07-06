import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { Clapperboard, MapPin, Users, Sun, CheckCircle2 } from "lucide-react";

export default async function SceneReviewPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (scenes.length === 0) {
    redirect(`/projects/${resolvedParams.id}/scenes`);
  }

  // Check if any scenes are approved
  const hasApprovedScenes = scenes.some(scene => scene.Versions?.[0]?.status === "Approved");

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <StageHeader 
        title="Scene Review"
        status={hasApprovedScenes ? "COMPLETED" : "IN_PROGRESS"}
        progress={hasApprovedScenes ? 100 : 50}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Approved Scenes</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {scenes.map((scene) => {
            const version = scene.Versions?.[0];
            const isApproved = version?.status === "Approved";
            
            return (
              <div key={scene.id} className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-1/4 bg-slate-50 p-6 border-r flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-bold text-slate-400">SCENE {scene.scene_number}</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">{scene.title}</h3>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded">{version?.scene_type || "N/A"}</span>
                    <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded">{version?.time_of_day || "N/A"}</span>
                  </div>
                </div>
                
                <div className="flex-1 p-6 space-y-4 relative">
                  <div className="absolute top-6 right-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                      isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {version?.status || 'Draft'}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 text-sm pr-24">{scene.description}</p>
                  
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}