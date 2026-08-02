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
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] pl-64">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-800" onClick={() => router.push('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-slate-600 bg-white" onClick={onSaveDraft} disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Draft</>}
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 px-8"
            onClick={() => router.push(workflowState.nextStage?.href || `/projects/${projectId}`)}
          >
            Continue Workflow <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
