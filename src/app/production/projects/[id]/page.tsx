import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProgressEngine } from "@/lib/production/ProgressEngine";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { StatusBadge } from "@/components/production/StatusBadge";
import Link from "next/link";
import { FileText, Image as ImageIcon, Video, Sparkles, ArrowRight, Clapperboard } from "lucide-react";

export default async function ProjectDashboardPage({ params }: { params: { id: string } }) {
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

  const scriptProgress = project.production_script?.completion_pct || 0;
  const storyboardProgress = project.production_storyboard?.completion_pct || 0;
  
  // Aggregate progress 
  const overallProgress = ProgressEngine.calculateProjectProgress([
    { completion_pct: scriptProgress },
    { completion_pct: storyboardProgress },
    { completion_pct: project.production_script?.is_approved ? 100 : 0 },
    { completion_pct: project.production_storyboard?.is_completed ? 100 : 0 },
    { completion_pct: sceneWorkspaceStatus.status === 'Completed' ? 100 : 0 },
    { completion_pct: shotListStatus.status === 'Completed' ? 100 : 0 },
    { completion_pct: promptsStatus.status === 'Completed' ? 100 : 0 },
  ]);

  const stages = [
    { title: "Script", href: `/production/projects/${project.id}/script`, icon: FileText, status: scriptStatus.status, progress: project.production_script?.is_approved ? 100 : 0, locked: scriptStatus.isLocked },
    { title: "Storyboard", href: `/production/projects/${project.id}/storyboard`, icon: ImageIcon, status: storyboardStatus.status, progress: project.production_storyboard?.is_completed ? 100 : 0, locked: storyboardStatus.isLocked },
    { title: "Scene Workspace", icon: Clapperboard, status: sceneWorkspaceStatus.status, progress: 0, href: `/production/projects/${project.id}/scenes`, locked: sceneWorkspaceStatus.isLocked },
    { title: "Shot List", icon: Video, status: shotListStatus.status, progress: 0, href: `/production/projects/${project.id}/shot-list`, locked: shotListStatus.isLocked },
    { title: "Prompt Studio", icon: Sparkles, status: promptsStatus.status, progress: 0, href: `/production/projects/${project.id}/prompts`, locked: promptsStatus.isLocked },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview and progress for {project.project_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="lg:col-span-1 border rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-semibold mb-6">Overall Progress</h2>
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Total Completion</span>
              <span className="text-4xl font-bold tracking-tighter">{overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4">
              <div 
                className="bg-black h-4 rounded-full transition-all duration-1000" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Client</span>
              <span className="font-medium text-slate-900">Internal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Project Type</span>
              <span className="font-medium text-slate-900">{project.project_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Updated</span>
              <span className="font-medium text-slate-900">{project.updated_at.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stages.map((stage) => (
            <Link 
              key={stage.title}
              href={stage.locked ? '#' : stage.href}
              className={`block border rounded-2xl p-5 bg-white shadow-sm transition ${stage.locked ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:shadow-md cursor-pointer'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stage.locked ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white'}`}>
                  <stage.icon className="h-5 w-5" />
                </div>
                <StatusBadge status={stage.status} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{stage.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{stage.locked ? 'Locked' : 'Open Workspace'}</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Progress</span>
                  <span>{stage.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${stage.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${stage.progress}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
