"use client";

import React from "react";
import { WorkflowState } from "@/lib/production/WorkflowEngine";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function WorkflowFooter({ workflowState }: { workflowState: WorkflowState }) {
  const router = useRouter();
  
  const { currentStage, currentStageIndex, stages, nextStage } = workflowState;
  
  const prevStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white z-10 sticky bottom-0">
      <div>
        {prevStage ? (
          <Button variant="ghost" onClick={() => router.push(prevStage.href)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous: {prevStage.title}
          </Button>
        ) : (
          <div />
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentStage.status === "Completed" ? (
          <>
            <span className="flex items-center text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full mr-2">
              <Check className="w-4 h-4 mr-1.5" />
              Stage Completed
            </span>
            <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
              const activeStage = nextStage || stages[0];
              router.push(activeStage.href);
            }}>
              Continue Workflow
            </Button>
          </>
        ) : (
          <span className="text-sm text-slate-500 font-medium mr-2">
            Complete tasks to unlock next stage
          </span>
        )}

        {nextStage && !nextStage.locked && nextStage.id !== currentStage.id && (
          <Button variant="outline" onClick={() => router.push(nextStage.href)}>
            Next Stage
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
