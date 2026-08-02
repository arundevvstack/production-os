import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ProjectHeaderProps {
  project: any;
  workflowState: any;
}

export function ProjectHeader({ project, workflowState }: ProjectHeaderProps) {
  const router = useRouter();

  if (!project) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.name}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <span className="uppercase text-xs tracking-wider">ID: {project.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}
