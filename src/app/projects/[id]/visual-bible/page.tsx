import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { BookOpen } from "lucide-react";
import { VisualBibleViewer } from "./VisualBibleViewer";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";

export default async function VisualBiblePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { 
      ProductionVisualBible: { 
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

  const visualBible = (project as any).ProductionVisualBible;
  const latestVersion = visualBible?.Versions?.[0] || null;
  const workflowState = await WorkflowEngine.getWorkflowState(resolvedParams.id);
  const statusInfo = workflowState.stages.find(s => s.id === 'visual-bible');

  async function triggerVisualBibleGen() {
    "use server";
    const headerStore = await headers();
    const host = headerStore.get('host') || `localhost:${process.env.PORT || 3003}`;
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    const res = await fetch(`${protocol}://${host}/api/v1/projects/${resolvedParams.id}/workflows/visual-bible-gen`, {
      method: "POST"
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
        throw new Error(await res.text());
    }
    if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
    }
    revalidatePath(`/projects/${resolvedParams.id}/visual-bible`);
  }

  return (
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">
            
      {!latestVersion ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 text-center bg-white shadow-sm flex flex-col items-center justify-center">
          <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Visual Bible Not Generated</h2>
          <p className="text-slate-500 max-w-md mb-6">
            The Visual Bible converts your Production Breakdown into structured creative directives for AI Generation.
          </p>
          <form action={triggerVisualBibleGen}>
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold shadow hover:bg-slate-800 transition">
              Generate Visual Bible
            </button>
          </form>
        </div>
      ) : (
        <VisualBibleViewer projectId={resolvedParams.id} version={latestVersion} />
      )}
    </div>
  );
}
