import React from "react";
import { WorkflowState } from "@/lib/production/WorkflowEngine";

import { DeleteProjectButton } from "./DeleteProjectButton";
import { Briefcase, Hash, Activity } from "lucide-react";

export function ProjectHeader({ project, workflowState }: { project: any, workflowState: WorkflowState }) {
  const { currentStage, progress, stages } = workflowState;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:px-8 border-b border-slate-100 bg-white gap-4 sticky top-0 z-10 rounded-t-3xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-inner">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{project.project_name}</h1>
          <div className="flex items-center space-x-3 text-sm text-slate-500 mt-0.5">
            <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              {project.project_type}
            </span>
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              {project.id.split("-")[0]}...
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-5 bg-slate-50 p-2 pl-5 rounded-2xl border border-slate-100 shadow-sm">
          {stages.length > 0 && (
            <div className="flex items-center gap-5 text-sm mr-2">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-0.5">Workflow</span>
                <span className="font-bold text-slate-800">{progress}%</span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
            </div>
          )}
          {currentStage && (
            <div className="flex items-center gap-5 text-sm">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-0.5">Current Stage</span>
                <span className="font-bold text-slate-800">{currentStage.title}</span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-0.5">Status</span>
                <span className="font-bold text-slate-800">{currentStage.status}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <DeleteProjectButton projectId={project.id} projectName={project.project_name} />
        </div>
      </div>
    </div>
  );
}
