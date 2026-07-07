import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { WorkflowFooter } from "@/components/projects/WorkflowFooter";
import { SmartNotifications } from "@/components/ui/SmartNotifications";
import { headers } from "next/headers";

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
    <div className="flex h-screen overflow-hidden bg-slate-200/50 font-sans">
      <ProjectSidebar workflowState={workflowState} />
      <div className="flex-1 flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden relative ml-2 mr-8 my-5 bg-white rounded-3xl shadow-sm border border-slate-200">
        <ProjectHeader project={project} workflowState={workflowState} />
        <main className="flex-1 overflow-y-auto bg-white rounded-b-3xl">
          {children}
          <WorkflowFooter workflowState={workflowState} />
        </main>
        <SmartNotifications />
      </div>
    </div>
  );
}
