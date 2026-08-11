"use client";

import React from "react";
import { WorkflowState } from "@/lib/production/WorkflowEngine";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function WorkflowFooter({ workflowState }: { workflowState: WorkflowState }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { stages } = workflowState;
  
  // Determine which stage the user is currently looking at
  const pageStageIndex = stages.findIndex(s => s.href === pathname);
  const pageStage = pageStageIndex !== -1 ? stages[pageStageIndex] : workflowState.currentStage;
  
  const prevStage = pageStageIndex > 0 ? stages[pageStageIndex - 1] : null;
  const sequentialNextStage = pageStageIndex !== -1 && pageStageIndex < stages.length - 1 ? stages[pageStageIndex + 1] : null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/50 backdrop-blur-md z-10 sticky bottom-0">
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
        {pageStage.status === "Completed" ? (
          <>
            <span className="flex items-center text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full mr-2">
              <Check className="w-4 h-4 mr-1.5" />
              Stage Completed
            </span>
            {sequentialNextStage && (
              <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-premium" onClick={() => {
                router.push(sequentialNextStage.href);
              }}>
                Continue to {sequentialNextStage.title}
              </Button>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground font-medium mr-2">
            Complete tasks to unlock next stage
          </span>
        )}

        {sequentialNextStage && !sequentialNextStage.locked && pageStage.status !== "Completed" && (
          <Button variant="outline" onClick={() => router.push(sequentialNextStage.href)}>
            Next: {sequentialNextStage.title}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
