"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkflowState, WorkflowStage } from "@/lib/production/WorkflowEngine";
import { 
  Search, Settings, HelpCircle, ChevronRight, MoreVertical, LayoutPanelLeft,
  FileText, List, BookOpen, ImageIcon, Clapperboard, Video, Sparkles, 
  Wand2, Library, CheckCircle, Scissors, UploadCloud, Info, Briefcase, 
  PlayCircle, Star, Lock
} from "lucide-react";

const iconMap: Record<string, any> = {
  FileText, List, BookOpen, ImageIcon, Clapperboard, Video, Sparkles, 
  Wand2, Library, CheckCircle, Scissors, UploadCloud, Settings, Info, 
  Briefcase, PlayCircle, Star
};

import { SettingsModal } from "@/components/system/SettingsModal";

export function ProjectSidebar({ workflowState, currentPath }: { workflowState: WorkflowState, currentPath: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { stages } = workflowState;

  // Group stages by their defined group
  const groupedStages = stages.reduce((acc, stage) => {
    if (!acc[stage.group]) {
      acc[stage.group] = [];
    }
    acc[stage.group].push(stage);
    return acc;
  }, {} as Record<string, WorkflowStage[]>);

  return (
    <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'} flex-shrink-0 m-4`}>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <div className="h-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Header - Logo */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">P.OS</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">Production OS</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Studio Plan</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none flex-shrink-0"
          >
            <LayoutPanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
              />
              <div className="absolute right-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-300 shadow-sm">
                ⌘K
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-6 scrollbar-hide">
          {Object.entries(groupedStages).map(([groupName, groupStages]) => (
            <div key={groupName}>
              {!isCollapsed && (
                <div className="flex items-center justify-between px-3 mb-2">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {groupName}
                  </h4>
                </div>
              )}
              <ul className="space-y-1">
                {groupStages.map((stage) => {
                  const isActive = currentPath === stage.href;
                  const isLocked = stage.locked;
                  const StageIcon = iconMap[stage.icon] || Info;

                  return (
                    <li key={stage.id}>
                      <Link
                        href={isLocked ? "#" : stage.href}
                        title={isLocked ? "Complete previous stage to unlock." : (isCollapsed ? stage.title : undefined)}
                        className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'space-x-3 px-3 py-2'} rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' 
                            : isLocked 
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60 hover:bg-transparent'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        onClick={(e) => isLocked && e.preventDefault()}
                      >
                        <div className={`relative flex items-center justify-center ${isCollapsed ? '' : 'w-6 h-6'}`}>
                          <StageIcon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-red-600 dark:text-red-400' : ''}`} />
                          
                          {/* Status Indicators overlaying the icon */}
                          {stage.status === 'Completed' && (
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            </div>
                          )}
                          {isLocked && (
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full">
                              <Lock className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{stage.title}</span>
                            {stage.status === 'Active' && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                            )}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-50 dark:border-slate-800">
          <ul className="space-y-1 mb-2">
            <li>
              <button onClick={() => setIsSettingsOpen(true)} className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'space-x-3 px-3 py-2'} rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all`}>
                <Settings className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {!isCollapsed && <span>Settings</span>}
              </button>
            </li>
            <li>
              <button className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'space-x-3 px-3 py-2'} rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all`}>
                <HelpCircle className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {!isCollapsed && <span>Help</span>}
              </button>
            </li>
          </ul>
          {/* User Profile */}
          <button className={`w-full flex items-center ${isCollapsed ? 'justify-center p-1 mx-auto w-10 h-10' : 'gap-3 p-2 px-3'} hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors`}>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-600">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Admin`} alt="User" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">Sandra More</span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">sandra@gmail.com</span>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
