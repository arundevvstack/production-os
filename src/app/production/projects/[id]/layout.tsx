import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, FileText, Image as ImageIcon, Video, Sparkles, Activity, Clapperboard, FolderOpen, Settings, Brain, Compass } from "lucide-react";
import { redirect } from "next/navigation";
import { UniversalSidebar } from "@/components/production/UniversalSidebar";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { ProductionAssistant } from "@/components/production/ProductionAssistant";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      production_script: true,
      production_storyboard: true,
    }
  });

  if (!project) redirect("/production/projects");

  const scriptStatus = WorkflowEngine.evaluateStageStatus('script', project);
  const storyboardStatus = WorkflowEngine.evaluateStageStatus('storyboard', project);
  const sceneWorkspaceStatus = WorkflowEngine.evaluateStageStatus('scene_workspace', project);
  const shotListStatus = WorkflowEngine.evaluateStageStatus('shot_list', project);
  const promptsStatus = WorkflowEngine.evaluateStageStatus('prompts', project);

  const navItems = [
    { 
      label: "Dashboard", 
      href: `/production/projects/${project.id}`, 
      icon: Activity, 
      isLocked: false,
      progress: 0
    },
    { 
      label: "Production Intelligence", 
      href: `/production/projects/${project.id}/intelligence`, 
      icon: Brain, 
      isLocked: false,
      progress: 0
    },
    { 
      label: "Creative Explorer", 
      href: `/production/projects/${project.id}/explorer`, 
      icon: Compass, 
      isLocked: false,
      progress: 0
    },
    { 
      label: "Script", 
      href: `/production/projects/${project.id}/script`, 
      icon: FileText, 
      isLocked: scriptStatus.isLocked,
      progress: project.production_script?.is_approved ? 100 : 0
    },
    { 
      label: "Storyboard", 
      href: `/production/projects/${project.id}/storyboard`, 
      icon: ImageIcon, 
      isLocked: storyboardStatus.isLocked,
      progress: project.production_storyboard?.is_completed ? 100 : 0
    },
    { 
      label: "Scene Workspace", 
      href: `/production/projects/${project.id}/scenes`, 
      icon: Clapperboard, 
      isLocked: sceneWorkspaceStatus.isLocked,
      progress: 0 // Mocked for MVP
    },
    { 
      label: "Shot List", 
      href: `/production/projects/${project.id}/shot-list`, 
      icon: Video, 
      isLocked: shotListStatus.isLocked,
      progress: 0 // Mocked for MVP
    },
    { 
      label: "Prompt Studio", 
      href: `/production/projects/${project.id}/prompts`, 
      icon: Sparkles, 
      isLocked: promptsStatus.isLocked,
      progress: 0 
    },
    { 
      label: "Asset Library", 
      href: `/production/projects/${project.id}/assets`, 
      icon: FolderOpen, 
      isLocked: false,
      progress: 0 
    },
    { 
      label: "Creative Memory", 
      href: `/production/projects/${project.id}/memory`, 
      icon: Brain, 
      isLocked: false,
      progress: 0 
    },
    { 
      label: "Job Queue", 
      href: `/production/projects/${project.id}/jobs`, 
      icon: Settings, 
      isLocked: false,
      progress: 0 
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center text-sm font-medium text-slate-500 space-x-2">
          <Link href="/production/projects" className="hover:text-black">Projects</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-black">{project.project_name}</span>
        </div>
      </header>

      {/* Workspace Content */}
      <div className="flex flex-1 overflow-hidden">
        <UniversalSidebar stages={navItems} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-10">
          {children}
        </main>

        <ProductionAssistant projectId={project.id} />
      </div>
    </div>
  );
}
