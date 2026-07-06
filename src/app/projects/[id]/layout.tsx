import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
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

  const stages = await WorkflowEngine.getProjectStages(id);
  
  // Extract pathname safely from headers in app router
  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || `/projects/${id}`;

  const currentStage = stages.find(s => currentPath === s.href) || stages[0];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      <ProjectSidebar stages={stages} currentPath={currentPath} />
      <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] overflow-hidden relative mr-4 my-4 bg-white rounded-3xl shadow-sm border border-slate-200">
        <ProjectHeader project={project} currentStage={currentStage} />
        <main className="flex-1 overflow-y-auto bg-white rounded-b-3xl">
          {children}
        </main>
        <SmartNotifications />
      </div>
    </div>
  );
}
