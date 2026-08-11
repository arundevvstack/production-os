import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { WorkflowFooter as GlobalFooterWorkflow } from "@/components/projects/WorkflowFooter";
import { SmartNotifications } from "@/components/ui/SmartNotifications";
import { headers } from "next/headers";
import { GlobalWorkspaceToolbar } from "@/components/production/workspace/GlobalWorkspaceToolbar";
import { GlobalInspectorDrawer } from "@/components/production/workspace/GlobalInspectorDrawer";
import { WorkspaceProvider } from "@/components/production/workspace/WorkspaceContext";
import { IdentityProvider } from "@/components/production/workspace/IdentityContext";
import { GlobalPageHeader } from "@/components/production/workspace/GlobalPageHeader";

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ProductionScript: true,
      ProductionVisualBible: { include: { Versions: true } },
      ProductionStoryboard: { include: { Versions: true } }
    }
  });

  if (!project) {
    redirect("/projects");
  }

  const workflowState = await WorkflowEngine.getWorkflowState(id);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <IdentityProvider>
        <WorkspaceProvider>
          <ProjectSidebar workflowState={workflowState} />
          <div className="flex-1 flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden relative ml-2 mr-2 my-5 bg-secondary/10 rounded-3xl shadow-premium border border-white/10">
            <ProjectHeader project={project} workflowState={workflowState} />
            <GlobalWorkspaceToolbar />
            
            <main className="flex-1 overflow-hidden bg-transparent rounded-b-3xl flex flex-col relative">
              <GlobalPageHeader />
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
                <div className="p-8 pb-32">
                  {children}
                </div>
              </div>
              <GlobalInspectorDrawer />
            </main>
            
            <GlobalFooterWorkflow workflowState={workflowState} />
            <SmartNotifications />
          </div>
        </WorkspaceProvider>
      </IdentityProvider>
    </div>
  );
}
