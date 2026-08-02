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
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="py-4 border-b border-slate-100">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Production Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
          {workflowState.stages.map((stage: any, idx: number) => {
            const isCompleted = stage.status === 'COMPLETED';
            const isActive = stage.id === workflowState.currentStage?.id;
            const isLocked = stage.status === 'LOCKED';

            return (
              <div key={stage.id} className="relative pl-6">
                {/* Timeline Node */}
                <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white transition-colors
                  ${isCompleted ? 'border-emerald-500 text-emerald-500' : 
                    isActive ? 'border-blue-500 text-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 
                    'border-slate-200 text-slate-300'}`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : 
                   isLocked ? <Lock className="w-2.5 h-2.5" /> : 
                   isActive ? <Circle className="w-2 h-2 fill-current" /> : null}
                </div>

                <div className="group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                        {stage.title}
                      </h4>
                      {isActive && <p className="text-xs text-slate-500 mt-1">{stage.description}</p>}
                    </div>
                    {(!isLocked) && (
                      <button 
                        onClick={() => router.push(stage.href || `/projects/${projectId}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50"
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
