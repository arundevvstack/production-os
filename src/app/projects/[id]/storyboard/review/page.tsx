import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { Clapperboard, MapPin, Users, Sun, Camera, CheckCircle } from "lucide-react";
import { SceneImage } from "../SceneImage";

export default async function StoryboardReviewPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <StageHeader 
        title="Storyboard Review"
        status={latestVersion?.status || "NOT_STARTED"}
        progress={latestVersion?.status === 'approved' ? 100 : 0}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      {!latestVersion ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <Clapperboard className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Storyboard Available</h2>
          <p className="text-slate-500 max-w-md">
            The storyboard has not been generated yet. Please go to the Storyboard Editor to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenes.map((scene: any, i: number) => (
            <div key={i} className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
              <SceneImage scene={scene} projectId={resolvedParams.id} sceneIndex={i} readOnly={true} />
              
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{scene.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">{scene.scene_summary || scene.visual_description}</p>
                  </div>
                  {scene.is_approved && (
                    <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full shrink-0" title="Approved">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}