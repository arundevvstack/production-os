"use client";

import React from 'react';
import { useWorkspace } from './WorkspaceContext';
import { cn } from '@/lib/utils';

export function GlobalInspectorDrawer() {
  const { inspectorContent } = useWorkspace();

  if (!inspectorContent) return null;

  return (
    <div className={cn(
      "w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-200 shadow-xl lg:shadow-none z-40 fixed right-0 top-0 bottom-0 lg:static"
    )}>
      {inspectorContent}
    </div>
  );
}
