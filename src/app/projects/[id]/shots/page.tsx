import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { Camera, ListVideo, Frame, Search, Maximize2, CheckCircle2 } from "lucide-react";

export default async function ShotListPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { 
      ProductionStoryboard: { 
        include: { 
          ProductionScene: {
            include: {
              ProductionShot: {
                include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } },
                orderBy: { shot_number: 'asc' }
              }
            },
            orderBy: { scene_number: 'asc' }
          }
        } 
      }
    }
  });

  if (!project) redirect(`/projects`);

  const storyboard = (project as any).ProductionStoryboard;
  const scenes = storyboard?.ProductionScene || [];
  
  // Flatten shots for easy counting/status check
  const allShots = scenes.flatMap((s: any) => s.ProductionShot);

  async function triggerShotGen() {
    "use server";
    const res = await fetch(`http://localhost:${process.env.PORT || 3003}/api/v1/projects/${resolvedParams.id}/workflows/shot-list-gen`, {
      method: "POST"
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
        throw new Error(await res.text());
    }
    if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
    }
    revalidatePath(`/projects/${resolvedParams.id}/shots`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <StageHeader 
        title="Shot Planner"
        status={allShots.length > 0 ? "IN_PROGRESS" : "NOT_STARTED"}
        progress={0}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      {allShots.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <ListVideo className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Shots Generated</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Shot Planner expands your Approved Scenes into technical, executable shots (Camera, Lens, Movement, Blocking).
          </p>
          <form action={triggerShotGen}>
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow hover:bg-slate-800 transition">
              Generate Shot List from Scenes
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Shot List</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Approve All Shots
              </button>
            </div>
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
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
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
      )}
    </div>
  );
}
