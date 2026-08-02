import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ChecklistPanel } from "@/components/production/ChecklistPanel";
import { CommentThread } from "@/components/production/CommentThread";
import { ActivityTimeline } from "@/components/production/ActivityTimeline";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { PermissionEngine } from "@/lib/production/PermissionEngine";
import { verifyScript } from "./actions";
import { ScriptContainer } from "@/components/production/script/ScriptContainer";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { ProductionScript: true }
  });

  if (!project) {
    redirect("/projects");
  }

  const scripts = project.ProductionScript ? [project.ProductionScript] : [];
  const latestScript = scripts[0];
  const workflowState = await WorkflowEngine.getWorkflowState(resolvedParams.id);
  const statusInfo = workflowState.stages.find(s => s.id === 'script');
  
  // Dummy data for MVP layout
  const fakeChecklist = [
    { id: '1', content: 'Initial Draft Uploaded', is_completed: scripts.length > 0, is_required: true },
    { id: '2', content: 'Creative Director Review', is_completed: latestScript?.is_approved || false, is_required: true },
    { id: '3', content: 'Client Sign-off', is_completed: latestScript?.is_locked || false, is_required: true }
  ];
  const fakeComments = [
    { id: '1', authorName: 'John Doe', content: 'Looks great! Just one typo in scene 2.', created_at: "2026-06-27T10:00:00.000Z" }
  ];
  const fakeActivities = [
    { id: '1', eventType: 'UPDATE', description: 'Script draft uploaded', actorName: 'Jane Smith', created_at: "2026-06-26T10:00:00.000Z" }
  ];

  async function completeScriptAction() {
    "use server";
    if (!latestScript || !project) return;
    await verifyScript(latestScript.id, project.id);
    redirect(`/projects/${project.id}/breakdown`);
  }

  async function toggleItemAction(id: string, status: boolean) {
    "use server";
    if (!latestScript) return;
    if (id === '2') {
      await prisma.productionScript.update({
        where: { id: latestScript.id },
        data: { is_approved: status }
      });
    } else if (id === '3') {
      await prisma.productionScript.update({
        where: { id: latestScript.id },
        data: { is_locked: status }
      });
    }
    if (project) {
      revalidatePath(`/projects/${project.id}`, 'layout');
    }
  }

  async function addCommentAction(content: string) {
    "use server";
    // Empty comment handler for V1
  }

  return (
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 w-full">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <ScriptContainer projectId={project.id} scripts={scripts.map((s: any) => ({...s, comments: undefined, checklist: undefined}))} />
          <ActivityTimeline events={fakeActivities} />
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <ChecklistPanel 
            items={fakeChecklist} 
            onToggleItem={toggleItemAction} 
          />
          <CommentThread 
            comments={fakeComments}
            onAddComment={addCommentAction}
          />
        </div>
      </div>
    </div>
  );
}
