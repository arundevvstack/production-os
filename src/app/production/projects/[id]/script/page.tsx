import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { ChecklistPanel } from "@/components/production/ChecklistPanel";
import { CommentThread } from "@/components/production/CommentThread";
import { ActivityTimeline } from "@/components/production/ActivityTimeline";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { PermissionEngine } from "@/lib/production/PermissionEngine";

export default async function ScriptPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { production_script: true }
  });

  if (!project) redirect("/production/projects");

  const script = project.production_script;
  const statusInfo = WorkflowEngine.evaluateStageStatus('script', project);
  
  // Dummy data for MVP layout
  const fakeChecklist = [
    { id: '1', content: 'Initial Draft Uploaded', is_completed: true, is_required: true },
    { id: '2', content: 'Creative Director Review', is_completed: script?.is_approved || false, is_required: true },
    { id: '3', content: 'Client Sign-off', is_completed: script?.is_locked || false, is_required: true }
  ];
  const fakeComments = [
    { id: '1', authorName: 'John Doe', content: 'Looks great! Just one typo in scene 2.', created_at: new Date(Date.now() - 3600000).toISOString() }
  ];
  const fakeActivities = [
    { id: '1', eventType: 'UPDATE', description: 'Script draft uploaded', actorName: 'Jane Smith', created_at: new Date(Date.now() - 86400000).toISOString() }
  ];

  async function completeScriptAction() {
    "use server";
    if (!script) return;
    const role = PermissionEngine.getCurrentUserRole();
    if (!PermissionEngine.can(role, 'approve_script')) return;

    await prisma.productionScript.update({
      where: { id: script.id },
      data: { is_locked: true, is_approved: true, completion_pct: 100, status: 'Completed' }
    });
    await WorkflowEngine.autoUnlockNextStage(project.id);
    revalidatePath(`/production/projects/${params.id}`);
  }

  // Define a Server Action inside the component so it works nicely or just use inline since this is server component
  // We'll leave the checklist interactive stubbed for MVP 
  // NextJS server action rule: they must be async functions marked "use server".

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader 
        title="Script"
        status={statusInfo.status}
        progress={script?.completion_pct || 0}
        assignedUser={script?.assigned_to || "Unassigned"}
        commentsCount={fakeComments.length}
        attachmentsCount={1}
        onComplete={completeScriptAction}
        isCompleteLocked={script?.is_locked || false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-sm">Editor (v{script?.version || 1})</span>
              <span className="text-xs text-slate-400">Read-only preview</span>
            </div>
            <div className="p-6 min-h-[400px]">
              <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
                {script?.content || "No script content available."}
              </pre>
            </div>
          </div>
          
          <ActivityTimeline events={fakeActivities} />
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <ChecklistPanel 
            items={fakeChecklist} 
            onToggleItem={async (id, status) => {
              "use server";
              // Stubbed server action for toggle
              console.log('Toggled', id, status);
            }} 
          />
          <CommentThread 
            comments={fakeComments}
            onAddComment={async (content) => {
              "use server";
              console.log('Added comment', content);
            }}
          />
        </div>
      </div>
    </div>
  );
}
