import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FooterActionBarProps {
  projectId: string;
  workflowState: any;
  isSaving: boolean;
  onSaveDraft: () => void;
}

export function FooterActionBar({ projectId, workflowState, isSaving, onSaveDraft }: FooterActionBarProps) {
  const router = useRouter();

  if (!workflowState) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] pl-64">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-secondary/50" onClick={() => router.push('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-foreground bg-secondary/50 border-border hover:bg-secondary" onClick={onSaveDraft} disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Draft</>}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 px-8"
            onClick={() => router.push(workflowState.nextStage?.href || `/projects/${projectId}`)}
          >
            Continue Workflow <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
