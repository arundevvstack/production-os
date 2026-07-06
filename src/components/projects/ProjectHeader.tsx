import React from "react";
import { WorkflowStage } from "@/lib/production/WorkflowEngine";
import { StatusBadge } from "@/components/production/StatusBadge";

export function ProjectHeader({ project, currentStage }: { project: any, currentStage?: WorkflowStage }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b bg-white gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{project.project_name}</h1>
        <div className="flex items-center space-x-3 text-sm text-slate-500 mt-1">
          <span className="font-medium text-slate-700">{project.project_type}</span>
          <span>&bull;</span>
          <span>ID: {project.id.split("-")[0]}...</span>
        </div>
      </div>
      
      {currentStage && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Current Stage</span>
            <span className="font-semibold">{currentStage.title}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Status</span>
            <StatusBadge status={currentStage.status} />
          </div>
        </div>
      )}
    </div>
  );
}
