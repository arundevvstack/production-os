import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { Frame, CheckCircle2 } from "lucide-react";

export default async function ShotReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      ProductionStoryboard: {
        include: {
          ProductionScene: {
            orderBy: { scene_number: 'asc' },
            include: {
              ProductionShot: {
                orderBy: { shot_number: 'asc' },
                include: {
                  Versions: {
                    orderBy: { version_number: 'desc' },
                    take: 1
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!project) redirect(`/projects`);

  const scenes = project.ProductionStoryboard?.ProductionScene || [];
  
  // Flatten to check if there are any shots
  const allShots = scenes.flatMap((s: any) => s.ProductionShot);
  
  if (allShots.length === 0) {
    redirect(`/projects/${resolvedParams.id}/shots`);
  }

  // Check if any shots are approved to determine stage progress
  const hasApprovedShots = allShots.some((shot: any) => shot.Versions[0]?.status === "Approved");

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <StageHeader 
        title="Shot Review"
        status={hasApprovedShots ? "COMPLETED" : "IN_PROGRESS"}
        progress={hasApprovedShots ? 100 : 50}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Approved Shot List</h2>
        </div>

        {scenes.map((scene: any) => {
          if (scene.ProductionShot.length === 0) return null;
          return (
            <div key={scene.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-black text-white px-3 py-1 rounded font-bold text-sm">SCENE {scene.scene_number}</div>
                <h3 className="text-xl font-bold text-slate-800">{scene.title}</h3>
              </div>
              
              <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-center">Shot</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Lens / Angle</th>
                      <th className="px-4 py-3">Movement</th>
                      <th className="px-4 py-3">Blocking / Action</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scene.ProductionShot.map((shot: any) => {
                      const v = shot.Versions[0];
                      const isApproved = v?.status === 'Approved';
                      return (
                        <tr key={(shot as any).id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-4 text-center font-bold text-slate-400">{scene.scene_number}.{shot.shot_number}</td>
                          <td className="px-4 py-4 font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                              <Frame className="w-4 h-4 text-slate-400" />
                              {v?.shot_type || 'Auto'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-slate-800 font-medium">{v?.lens || shot.lens}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{v?.camera_angle || shot.camera}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {v?.movement || shot.movement}
                          </td>
                          <td className="px-4 py-4 text-slate-600 max-w-xs truncate">
                            {v?.character_blocking || 'No blocking specified'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isApproved && <CheckCircle2 className="w-3 h-3" />}
                              {v?.status || 'Draft'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}