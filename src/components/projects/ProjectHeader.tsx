import React from "react";
import { WorkflowState } from "@/lib/production/WorkflowEngine";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { EditProjectDialog } from "./EditProjectDialog";
import { Briefcase, Hash, Activity, ChevronRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ProjectSidebar } from "./ProjectSidebar";

export function ProjectHeader({ project, workflowState }: { project: any, workflowState: WorkflowState }) {
  const { currentStage, progress, stages } = workflowState;
  const radius = 14;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-4 md:px-8 md:py-5 bg-secondary/30 backdrop-blur-xl border-b border-border sticky top-0 z-20 rounded-none md:rounded-t-3xl transition-all">
      {/* Left side: Icon & Info */}
      <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground focus:outline-none">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-background border-r border-border">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <ProjectSidebar workflowState={workflowState} isMobile />
          </SheetContent>
        </Sheet>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            {project.project_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <Activity className="w-3 h-3" />
              {project.project_type || "AI Video Workflow"}
            </span>
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              <Hash className="w-3 h-3 mr-0.5" />
              {project.id.split("-")[0]}
            </span>
          </div>
        </div>
      </div>
      
      {/* Right side: Stats & Actions */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 mt-4 md:mt-0 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        <div className="flex flex-1 md:flex-initial items-center justify-between md:justify-start gap-4 bg-secondary/50 px-4 py-2.5 rounded-2xl ring-1 ring-white/10 shadow-sm">
          {stages.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8">
                 <svg className="w-8 h-8 transform -rotate-90">
                   <circle cx="16" cy="16" r={radius} stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-muted-foreground/30" />
                   <circle cx="16" cy="16" r={radius} stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="text-primary transition-all duration-1000 ease-in-out" />
                 </svg>
                 <span className="absolute text-[9px] font-bold text-foreground">{progress}%</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-white/10"></div>
            </div>
          )}
          
          {currentStage && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Current Phase</span>
                <span className="text-sm font-extrabold text-foreground leading-none">{currentStage.title}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    {currentStage.status === "Active" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStage.status === 'Completed' ? 'bg-indigo-500' : 'bg-primary'}`}></span>
                  </span>
                  <span className="text-sm font-extrabold text-foreground leading-none">{currentStage.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <EditProjectDialog project={project} />
          <DeleteProjectButton projectId={project.id} projectName={project.project_name} />
        </div>
      </div>
    </div>
  );
}
