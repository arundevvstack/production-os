import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AIAssistantPanelProps {
  workflowState: any;
  projectId: string;
}

export function AIAssistantPanel({ workflowState, projectId }: AIAssistantPanelProps) {
  const router = useRouter();
  
  if (!workflowState) return null;

  const tasks = workflowState.remainingTasks || [];
  const nextStage = workflowState.nextStage;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-blue-100 shadow-sm">
      <CardHeader className="py-4 border-b border-blue-100/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" /> Production Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {tasks.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-blue-900 font-medium">Recommended Next Steps:</p>
            <div className="space-y-2">
              {tasks.slice(0, 3).map((task: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg border border-blue-100/50">
                  <div className="mt-0.5"><div className="w-4 h-4 rounded-full border-2 border-blue-400" /></div>
                  <span className="text-sm text-blue-900 font-medium">{task}</span>
                </div>
              ))}
            </div>
            {nextStage && (
              <Button 
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => router.push(nextStage.href || `/projects/${projectId}`)}
              >
                Proceed to {nextStage.title} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-emerald-800 font-bold">You're all caught up!</p>
            <p className="text-xs text-emerald-600 mt-1">Everything is ready for the next production stage.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
