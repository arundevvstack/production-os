import React from 'react';
import { Check, Lock, Circle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface WorkflowTimelineProps {
  workflowState: any;
  projectId: string;
}

export function WorkflowTimeline({ workflowState, projectId }: WorkflowTimelineProps) {
  const router = useRouter();

  if (!workflowState || !workflowState.stages) return null;

  return (
    <Card className="bg-secondary/30 shadow-premium border-border">
      <CardHeader className="py-4 border-b border-border">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Production Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative border-l-2 border-border ml-3 space-y-6">
          {workflowState.stages.map((stage: any, idx: number) => {
            const isCompleted = stage.status?.toUpperCase() === 'COMPLETED';
            const isActive = stage.id === workflowState.currentStage?.id || stage.status?.toUpperCase() === 'ACTIVE';
            const isLocked = stage.status?.toUpperCase() === 'LOCKED';

            return (
              <div key={stage.id} className="relative pl-6">
                {/* Timeline Node */}
                <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors z-10
                  ${isCompleted ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,255,153,0.2)]' : 
                    isActive ? 'bg-background border-primary text-primary shadow-[0_0_0_4px_rgba(0,255,153,0.1)]' : 
                    'bg-background border-border text-muted-foreground'}`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : 
                   isLocked ? <Lock className="w-2.5 h-2.5" /> : 
                   isActive ? <Circle className="w-2 h-2 fill-current" /> : null}
                </div>

                <div className="group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`text-sm font-bold transition-colors ${isActive ? 'text-primary' : isLocked ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                        {stage.title}
                      </h4>
                      {isActive && <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>}
                    </div>
                    {(!isLocked) && (
                      <button 
                        onClick={() => router.push(stage.href || `/projects/${projectId}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1 rounded-md hover:bg-primary/10"
                        title={`Open ${stage.title}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
