"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileText, Image, Video, Sparkles, Lock, Clapperboard } from "lucide-react";

export interface SidebarStage {
  label: string;
  href: string;
  icon: any; // Lucide icon
  isLocked: boolean;
  progress: number;
}

export function UniversalSidebar({ stages }: { stages: SidebarStage[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-slate-50/50 p-4 flex flex-col justify-between">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
          Workspace
        </div>
        <nav className="space-y-1">
          {stages.map((stage) => {
            const isActive = pathname === stage.href;
            
            if (stage.isLocked) {
              return (
                <div key={stage.label} className="flex flex-col gap-1 px-3 py-2 rounded-md cursor-not-allowed text-slate-400">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <stage.icon className="h-4 w-4" />
                    {stage.label}
                    <Lock className="h-3 w-3 ml-auto text-slate-300" />
                  </div>
                </div>
              );
            }

            return (
              <Link 
                key={stage.label} 
                href={stage.href}
                className={`flex flex-col gap-1 px-3 py-2 rounded-md transition ${isActive ? 'bg-white shadow-sm border border-slate-100 text-black' : 'text-slate-600 hover:bg-slate-100 hover:text-black'}`}
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <stage.icon className="h-4 w-4" />
                  {stage.label}
                  {stage.progress === 100 && <span className="ml-auto text-green-500 text-[10px] uppercase font-bold">Done</span>}
                </div>
                {stage.progress > 0 && stage.progress < 100 && (
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-1">
                    <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${stage.progress}%` }} />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
