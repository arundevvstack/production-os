import React, { ReactNode } from 'react';
import { ProjectHeader } from '@/components/production/dashboard/ProjectHeader';
import { FooterActionBar } from '@/components/production/dashboard/FooterActionBar';

interface PageLayoutProps {
  children: ReactNode;
  project: any;
  workflowState: any;
  isSaving?: boolean;
  onSaveDraft?: () => void;
  headerContent?: ReactNode;
  toolbar?: ReactNode;
}

export function PageLayout({ children, project, workflowState, isSaving = false, onSaveDraft, headerContent, toolbar }: PageLayoutProps) {
  return (
    <div className="h-full flex flex-col space-y-6 pb-32 bg-slate-50/30 min-h-screen">
      {/* Universal Page Container */}
      <div className="flex-1 w-full flex flex-col gap-6 p-6">
        
        {/* Universal Header */}
        <div className="w-full">
          {headerContent ? headerContent : (
             <ProjectHeader project={project} workflowState={workflowState} />
          )}
        </div>
        
        {/* Universal Toolbar */}
        {toolbar && (
          <div className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md pb-4 pt-2 -mx-6 px-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            {toolbar}
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="w-full flex-1">
          {children}
        </main>
      </div>

      {/* Universal Footer Action Bar */}
      {workflowState && (
        <FooterActionBar 
          projectId={project?.id || ''} 
          workflowState={workflowState} 
          isSaving={isSaving} 
          onSaveDraft={onSaveDraft || (() => {})} 
        />
      )}
    </div>
  );
}
