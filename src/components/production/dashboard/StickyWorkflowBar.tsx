import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StickyWorkflowBarProps {
  workflowState: any;
  projectId: string;
}

export function StickyWorkflowBar({ workflowState, projectId }: StickyWorkflowBarProps) {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!workflowState || !isSticky) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 z-50 shadow-sm flex justify-center pl-64 animate-in slide-in-from-top-4 duration-300">
      <div className="w-full max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-100">
              <div 
                className="absolute inset-0 rounded-full border-2 border-emerald-500" 
                style={{ clipPath: `polygon(50% 50%, -50% -50%, ${workflowState.progress > 50 ? '150%' : '-50%'} -50%, ${workflowState.progress > 50 ? '150%' : '50%'} 150%, 50% 150%)` }} 
              />
              <span className="text-[10px] font-bold text-slate-700 z-10">{workflowState.progress}%</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">Stage</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-800 leading-tight">{workflowState.currentStage?.title || 'Workspace'}</span>
                {workflowState.progress === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>
          </div>
        </div>
        <Button 
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          onClick={() => router.push(workflowState.nextStage?.href || `/projects/${projectId}`)}
        >
          Continue Workflow <ArrowRight className="w-3.5 h-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
