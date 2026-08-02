import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Terminal, Database, ImagePlay, Activity, Wand2, Users, MapPin } from "lucide-react";

import { ApprovePromptButton } from "./ApprovePromptButton";
import { ApproveAllPromptsButton } from "./ApproveAllPromptsButton";
import { CopyButton } from "./CopyButton";
import { CopyAllButton } from "./CopyAllButton";
// import { EditPromptSpecsModal } from "./EditPromptSpecsModal";
import { RegeneratePromptButton } from "./RegeneratePromptButton";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { PromptCard } from "./PromptCard";

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

  const workflowState = await WorkflowEngine.getWorkflowState(resolvedParams.id);
  // NOTE: stage id is 'prompt_studio' in WorkflowEngine — not 'prompts'
  const statusInfo = workflowState.stages.find(s => s.id === 'prompt_studio');
  const intelStage = workflowState.stages.find(s => s.id === 'production_intelligence');

  // WorkflowEngine emits status = "Completed" (not "Complete").
  // Use the .locked boolean — it is the canonical source of truth.
  if (statusInfo?.locked) {
     return (
        <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">
                    <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-slate-700 mb-2">Prompt Library Locked</h2>
            <p className="text-slate-500 max-w-md mb-6">
              Complete the Production Intelligence stage first to unlock your shot prompts.
              {intelStage && !intelStage.locked && intelStage.status !== 'Completed' && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Intelligence Engine is active — click "Compile All Packages" to complete it.
                </span>
              )}
            </p>
          </div>
        </div>
     );
  }

  async function triggerPromptGen() {
    "use server";
    const headerStore = await headers();
    const host = headerStore.get('host') || `localhost:${process.env.PORT || 3003}`;
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    const res = await fetch(`${protocol}://${host}/api/v1/projects/${resolvedParams.id}/workflows/prompt-gen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    
    if (!res.ok) {
        throw new Error(await res.text());
    }
    revalidatePath(`/projects/${resolvedParams.id}/prompts`);
  }

  return (
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">
            
      {allPrompts.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <Terminal className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Prompts Configured</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Prompt Studio expands your Approved Shots into Provider-specific generation prompts.
          </p>
          <form action={triggerPromptGen}>
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow hover:bg-slate-800 transition">
              Generate Prompts from Packages
            </button>
          </form>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-500 w-5 h-5" />
              <span className="font-bold">Shot Prompts</span>
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
                <PromptCard key={prompt.id} version={v} shot={shot} projectId={resolvedParams.id} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
