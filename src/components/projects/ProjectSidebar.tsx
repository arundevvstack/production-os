import React from "react";
import Link from "next/link";
import { WorkflowEngine, WorkflowStage } from "@/lib/production/WorkflowEngine";

export function ProjectSidebar({ stages, currentPath }: { stages: WorkflowStage[], currentPath: string }) {
  // Group stages by their defined group
  const groupedStages = stages.reduce((acc, stage) => {
    if (!acc[stage.group]) {
      acc[stage.group] = [];
    }
    acc[stage.group].push(stage);
    return acc;
  }, {} as Record<string, WorkflowStage[]>);

  return (
    <div className="w-64 border-r bg-slate-50 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {Object.entries(groupedStages).map(([groupName, groupStages]) => (
          <div key={groupName}>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              {groupName}
            </h4>
            <ul className="space-y-1">
              {groupStages.map((stage) => {
                const isActive = currentPath === stage.href;
                const isLocked = stage.locked;

                return (
                  <li key={stage.id}>
                    <Link
                      href={isLocked ? "#" : stage.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-slate-200 text-slate-900"
                          : isLocked
                            ? "text-slate-400 cursor-not-allowed opacity-50"
                            : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <stage.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{stage.title}</span>
                      
                      {stage.status === "Approved" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Approved" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
