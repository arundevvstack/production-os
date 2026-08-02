"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakdown } from '../BreakdownContext';

export function ContextNavigation() {
  const { activeTab, setActiveTab, categories } = useBreakdown();

  return (
    <div className="w-56 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto hidden lg:block h-full">
      <div className="p-3 pb-24">
        {categories.map((group: any) => {
          const GroupIcon = group.icon;

          return (
            <div key={group.name} className="mb-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1.5">
                {GroupIcon && <GroupIcon className="w-3.5 h-3.5" />} {group.name}
              </h3>
              <div className="flex flex-col gap-0.5">
                {group.categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors text-left font-medium",
                      activeTab === cat.id 
                        ? "bg-red-50 text-red-700 font-semibold" 
                        : "text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <span className="truncate text-xs">{cat.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 shrink-0",
                      activeTab === cat.id ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-500"
                    )}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
