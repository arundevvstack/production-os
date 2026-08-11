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
    <Card className="bg-primary/5 border-primary/20 shadow-premium">
      <CardHeader className="py-4 border-b border-primary/10">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Production Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {tasks.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground font-medium">Recommended Next Steps:</p>
            <div className="space-y-2">
              {tasks.slice(0, 3).map((task: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 bg-background/40 p-3 rounded-lg border border-primary/10">
                  <div className="mt-0.5"><div className="w-4 h-4 rounded-full border-2 border-primary/50" /></div>
                  <span className="text-sm text-foreground font-medium">{task}</span>
                </div>
              ))}
            </div>
            {nextStage && (
              <Button 
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-premium"
                onClick={() => router.push(nextStage.href || `/projects/${projectId}`)}
              >
                Proceed to {nextStage.title} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <p className="text-primary font-bold">You're all caught up!</p>
            <p className="text-xs text-primary/70 mt-1">Everything is ready for the next production stage.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
