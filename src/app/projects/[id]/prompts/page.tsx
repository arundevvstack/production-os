import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { Terminal, Settings, Database, SlidersHorizontal, ImagePlay, Activity, FileText } from "lucide-react";

import { ApprovePromptButton } from "./ApprovePromptButton";
import { ApproveAllPromptsButton } from "./ApproveAllPromptsButton";
import { CopyButton } from "./CopyButton";
import { CopyAllButton } from "./CopyAllButton";
import { EditPromptSpecsModal } from "./EditPromptSpecsModal";
import { RegeneratePromptButton } from "./RegeneratePromptButton";

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
  
  const hasUnapprovedPrompts = allPrompts.some((p: any) => p.Versions[0]?.status !== "Approved");

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
            <div className="flex items-center gap-3">
              <ApproveAllPromptsButton projectId={resolvedParams.id} hasUnapproved={hasUnapprovedPrompts} />
              <form action={triggerPromptGen}>
                <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 transition">
                  Regenerate Prompts
                </button>
              </form>
              <Link href={`/projects/${resolvedParams.id}/generation`} className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 transition">
                Send Approved Prompts to Generation Studio
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            {allShots.map((shot: any) => {
              if (shot.ProductionPrompt.length === 0) return null;
              const prompt = shot.ProductionPrompt[0];
              const v = prompt.Versions[0];
              
              const isApproved = v?.status === "Approved";
              
              return (
                <div 
                  key={prompt.id} 
                  className={`relative group bg-white border ${isApproved ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-200/60'} rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl`}
                >
                  {/* Premium Header */}
                  <div className={`p-5 flex items-center justify-between ${isApproved ? 'bg-gradient-to-r from-emerald-900 to-emerald-950' : 'bg-gradient-to-r from-slate-900 to-slate-950'} text-slate-100 border-b border-white/10`}>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest ${isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-slate-300'}`}>
                        SHOT ID {shot.shot_number}
                      </div>
                      <h3 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Master Generation Prompt
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 shadow-inner">
                        Provider: {v?.model_rec}
                      </span>
                      <CopyAllButton version={v} />
                      <RegeneratePromptButton versionId={v.id} projectId={resolvedParams.id} />
                    </div>
                  </div>
                  
                  {/* Prompt Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1 bg-slate-100">
                    {/* Image/Video Prompt */}
                    <div className="p-5 bg-white rounded-l-xl flex flex-col h-full group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ImagePlay className="w-4 h-4" /> Motion Prompt
                        </div>
                        <CopyButton content={v?.video_prompt || v?.image_prompt || ''} label="Motion Prompt" />
                      </div>
                      <div className="relative flex-grow">
                        <p className="w-full text-sm font-mono text-slate-700 leading-relaxed selection:bg-indigo-100">
                          {v?.video_prompt || v?.image_prompt || ''}
                        </p>
                      </div>
                    </div>

                    {/* Technical Specs */}
                    <div className="p-5 bg-white flex flex-col h-full group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Technical Specs
                        </div>
                        <CopyButton content={`Camera: ${v?.camera_prompt}\nLighting: ${v?.lighting_prompt}\nEnvironment: ${v?.environment_prompt}`} label="Technical Specs" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">CAMERA</span>
                          <p className="text-sm font-mono text-slate-700">{v?.camera_prompt}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">LIGHTING</span>
                          <p className="text-sm font-mono text-slate-700">{v?.lighting_prompt}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">ENVIRONMENT</span>
                          <p className="text-sm font-mono text-slate-700">{v?.environment_prompt}</p>
                        </div>
                      </div>
                    </div>

                    {/* Negative Prompt */}
                    <div className="p-5 bg-white rounded-r-xl flex flex-col h-full group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Negative Exclusions
                        </div>
                        <CopyButton content={v?.negative_prompt || ''} label="Negative Exclusions" />
                      </div>
                      <p className="w-full text-sm font-mono text-rose-700/80 leading-relaxed bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        {v?.negative_prompt || ''}
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-6 py-4 flex items-center justify-between bg-white border-t border-slate-100">
                    <div className="flex items-center gap-6 text-xs font-bold text-slate-500 tracking-wide">
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border">
                        <SlidersHorizontal className="w-4 h-4 text-slate-400" /> Aspect: {v?.aspect_ratio}
                      </span>
                      {isApproved ? (
                        <span className="text-emerald-500 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <Activity className="w-4 h-4" /> APPROVED
                        </span>
                      ) : (
                        <span className="text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          STATUS: DRAFT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <EditPromptSpecsModal version={v} projectId={resolvedParams.id} />
                      <ApprovePromptButton versionId={v.id} projectId={resolvedParams.id} />
                    </div>
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
