"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WorkflowState, WorkflowStage } from "@/lib/production/WorkflowEngine";
import { 
  Search, Settings, HelpCircle, ChevronRight, ChevronLeft, MoreVertical, LayoutPanelLeft,
  FileText, List, BookOpen, ImageIcon, Clapperboard, Video, Sparkles, 
  Wand2, Library, CheckCircle, Scissors, UploadCloud, Info, Briefcase, 
  PlayCircle, Star, Lock, MapPin
} from "lucide-react";

const iconMap: Record<string, any> = {
  FileText, List, BookOpen, ImageIcon, Clapperboard, Video, Sparkles, 
  Wand2, Library, CheckCircle, Scissors, UploadCloud, Settings, Info, 
  Briefcase, PlayCircle, Star, MapPin
};

import { usePathname, useRouter } from "next/navigation";
import { SettingsModal } from "@/components/system/SettingsModal";
import { useSupabase } from "@/supabase/provider";
import { useSupabaseDoc } from "@/supabase/hooks/use-doc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Image as ImageIcon2 } from "lucide-react";

export function ProjectSidebar({ workflowState, isMobile = false }: { workflowState: WorkflowState, isMobile?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const currentPath = usePathname();
  const router = useRouter();

  const { user } = useSupabase();
  const { data: profile } = useSupabaseDoc('User', user?.id || null);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error(error);
    }
  };

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
    <div className={`${isMobile ? 'flex flex-col w-full h-full border-none m-0 rounded-none bg-background' : `hidden md:flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'} flex-shrink-0 m-4`}`}>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <div className={`h-full bg-background flex flex-col overflow-hidden relative ${isMobile ? '' : 'rounded-3xl shadow-premium border border-border'}`}>
        
        {/* Header - Logo */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-xs">P.OS</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground truncate">Production OS</span>
                <span className="text-xs text-muted-foreground truncate">Studio Plan</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground focus:outline-none flex-shrink-0"
          >
            <LayoutPanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Back */}
        {!isCollapsed && (
          <div className="px-4 pb-4 space-y-3">
            <Link href="/projects" className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors p-1.5 -mx-1.5 rounded-md hover:bg-secondary/50 uppercase tracking-widest">
              <ChevronLeft className="w-3.5 h-3.5" /> Projects Dashboard
            </Link>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-secondary/30 border border-border rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground text-foreground"
              />
              <div className="absolute right-2 bg-secondary/50 border border-border rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
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
                  <h4 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
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
                            ? 'bg-primary/10 text-primary' 
                            : isLocked 
                              ? 'text-muted-foreground/40 cursor-not-allowed opacity-60 hover:bg-transparent'
                              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        }`}
                        onClick={(e) => isLocked && e.preventDefault()}
                      >
                        <div className={`relative flex items-center justify-center ${isCollapsed ? '' : 'w-6 h-6'}`}>
                          <StageIcon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-primary' : ''}`} />
                          
                          {/* Status Indicators overlaying the icon */}
                          {stage.status?.toUpperCase() === 'COMPLETED' && (
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                              <CheckCircle className="w-3 h-3 text-primary" />
                            </div>
                          )}
                          {isLocked && (
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{stage.title}</span>
                            {stage.status?.toUpperCase() === 'ACTIVE' && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(0,255,153,0.5)] animate-pulse" />
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
        <div className="p-3 border-t border-border">
          <ul className="space-y-1 mb-2">

            <li>
              <button className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'space-x-3 px-3 py-2'} rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all`}>
                <HelpCircle className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {!isCollapsed && <span>Help</span>}
              </button>
            </li>
          </ul>
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center ${isCollapsed ? 'justify-center p-1 mx-auto w-10 h-10' : 'gap-3 p-2 px-3'} hover:bg-secondary/50 rounded-xl transition-colors`}>
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0 border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">
                  {profile?.avatar ? (
                    <Image src={profile.avatar} alt="User" width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    profile?.fullName?.substring(0, 2).toUpperCase() || 'US'
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="text-sm font-bold text-foreground truncate">{profile?.fullName || user?.email || 'Local User'}</span>
                      <span className="text-[10px] font-medium text-muted-foreground truncate">{user?.email || 'Local OS'}</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer font-medium">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer font-semibold">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </div>
  );
}
