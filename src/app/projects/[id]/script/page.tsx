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
import { verifyScript } from "./actions";
import { ScriptContainer } from "@/components/production/script/ScriptContainer";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { ProductionScript: true }
  });

  if (!project) redirect("/projects");

  const scripts = project.ProductionScript ? [project.ProductionScript] : [];
  const latestScript = scripts[0];
  const stages = await WorkflowEngine.getProjectStages(resolvedParams.id);
  const statusInfo = stages.find(s => s.id === 'script');
  
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
  }

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader 
        title="Script"
        status={statusInfo?.status || "In Progress"}
        progress={(latestScript?.is_approved ? 100 : 0) || 0}
        assignedUser={"Unassigned"}
        commentsCount={fakeComments.length}
        attachmentsCount={1}
        onComplete={completeScriptAction}
        isCompleteLocked={latestScript?.is_locked || false}
      />

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
            onToggleItem={async (id, status) => {
              "use server";
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
