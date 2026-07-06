import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { Terminal, Settings, Database, SlidersHorizontal, ImagePlay, Activity, FileText } from "lucide-react";

export default async function PromptsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      ProductionStoryboard: { 
        include: { 
          ProductionScene: {
            include: {
              ProductionShot: {
                include: {
                  ProductionPrompt: { include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } } }
                }
              }
            }
          }
        } 
      }
    }
  });

  if (!project) redirect(`/projects`);

  const allShots = project.ProductionStoryboard?.ProductionScene.flatMap((s: any) => s.ProductionShot) || [];
  const allPrompts = allShots.flatMap((s: any) => s.ProductionPrompt);

  async function triggerPromptGen() {
    "use server";
    const res = await fetch(`http://localhost:${process.env.PORT || 3003}/api/v1/projects/${resolvedParams.id}/workflows/prompt-gen`, {
      method: "POST"
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
        throw new Error(await res.text());
    }
    if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
    }
    revalidatePath(`/projects/${resolvedParams.id}/prompts`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <StageHeader 
        title="Prompt Studio"
        status={allPrompts.length > 0 ? "IN_PROGRESS" : "NOT_STARTED"}
        progress={0}
        commentsCount={0}
        attachmentsCount={0}
      />
      
      {allPrompts.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <Terminal className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Prompts Configured</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Prompt Studio expands your Approved Shots into Provider-specific generation prompts.
          </p>
          <form action={triggerPromptGen}>
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow hover:bg-slate-800 transition">
              Generate Prompts from Shots
            </button>
          </form>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-500 w-5 h-5" />
              <span className="font-bold">Enterprise Prompt Repository</span>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 transition">
              Send Approved Prompts to Generation Studio
            </button>
          </div>

          {allShots.map((shot: any) => {
            if (shot.ProductionPrompt.length === 0) return null;
            const prompt = shot.ProductionPrompt[0];
            const v = prompt.Versions[0];
            
            return (
              <div key={prompt.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-slate-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 px-2 py-1 rounded text-xs font-mono font-bold text-emerald-400">SHOT ID: {shot.shot_number}</div>
                    <h3 className="font-bold">Master Generation Prompt</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-700 px-2 py-1 rounded text-xs font-bold uppercase">Provider: {v?.model_rec}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                  <div className="p-4 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><ImagePlay className="w-3 h-3" /> Image / Video Prompt</div>
                    <textarea readOnly className="w-full text-sm font-mono text-slate-700 bg-white border rounded p-3 h-32 focus:outline-none focus:ring-2" value={v?.video_prompt || v?.image_prompt || ''} />
                  </div>
                  <div className="p-4 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Technical Specs</div>
                    <textarea readOnly className="w-full text-sm font-mono text-slate-700 bg-white border rounded p-3 h-32 focus:outline-none focus:ring-2" value={`Camera: ${v?.camera_prompt}\nLighting: ${v?.lighting_prompt}\nEnvironment: ${v?.environment_prompt}`} />
                  </div>
                  <div className="p-4 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Negative Prompt</div>
                    <textarea readOnly className="w-full text-sm font-mono text-slate-700 bg-white border border-red-200 rounded p-3 h-32 focus:outline-none focus:ring-2" value={v?.negative_prompt || ''} />
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Aspect: {v?.aspect_ratio}</span>
                    <span>Status: {v?.status}</span>
                  </div>
                  <div className="space-x-2">
                    <button className="px-4 py-2 border text-slate-600 rounded font-semibold text-sm hover:bg-slate-50 transition">Edit Specs</button>
                    <button className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-sm hover:bg-emerald-100 transition">Approve Prompt</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
