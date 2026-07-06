"use client";

import * as React from "react";
import {
  Folder, LayoutGrid, Brain, Compass, FileText, Image as ImageIcon, 
  Clapperboard, Video, Sparkles, Wand2, Archive, Settings, LogOut, Loader2,
  Camera, Briefcase, Activity, Home, ClipboardList, Scissors, Music, 
  CheckCircle, Package, File, ChevronDown
} from "lucide-react";
import * as Icons from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, 
  SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar, SidebarGroupLabel
} from "@/components/ui/sidebar";
import Link from "next/link";
import useSWR from "swr";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { useSupabaseDoc } from '@/supabase/hooks/use-doc';
import { useSupabase } from '@/supabase/provider';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading: isAuthLoading } = useSupabase();
  const { data: profile, isLoading: isProfileLoading } = useSupabaseDoc('User', user?.id || null);
  const isLoading = isAuthLoading || isProfileLoading;
  
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  
  const [isMounted, setIsMounted] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  // Extract projectId from URL if present
  const projectIdMatch = pathname?.match(/\/production\/projects\/([^\/]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

  const { data: workflowTree, isLoading: isWorkflowLoading } = useSWR(
    projectId ? `/api/v1/projects/${projectId}/workflow` : null,
    (url: string) => fetch(url).then(async (res) => {
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok) {
            throw new Error(await res.text());
        }
        if (!contentType.includes("application/json")) {
            throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
        }
        return res.json();
    })
  );

  React.useEffect(() => { setIsMounted(true); }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const uid = profile?.id;
    if (!file || !uid) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload an image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) { 
      toast({ variant: "destructive", title: "File Too Large", description: "Image must be less than 2MB." });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', uid);
      const res = await fetch('/api/v1/user/avatar', {
        method: 'POST',
        body: formData,
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
          throw new Error(await res.text());
      }
      if (!contentType.includes("application/json")) {
          throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
      }
      const data = await res.json();
      toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      toast({ title: "Logged out", description: "Successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  const isNavItemActive = (url: string, exact: boolean = false): boolean => {
    if (!isMounted || !pathname) return false;
    if (exact) return pathname === url;
    return pathname === url || pathname.startsWith(url + '/');
  };

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" variant="inset" className="bg-sidebar">
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r border-white/20 dark:border-slate-700/20 bg-white dark:bg-slate-900 font-body">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-start min-h-[40px]">
          <Logo variant={state === "collapsed" ? "icon" : "full"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 gap-0">
        
        {/* Top Level Workspace */}
        <SidebarGroup className="py-1">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isNavItemActive('/', true)} className={cn(
                "h-9 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                isNavItemActive('/', true) ? "bg-primary/10 text-black dark:text-white" : "hover:bg-secondary/50 text-black dark:text-white/80"
              )}>
                <Link href="/" className="flex items-center gap-3 w-full">
                  {isNavItemActive('/', true) && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                  <Home className={cn("size-4 transition-transform group-hover/btn:scale-110", isNavItemActive('/', true) ? "text-black dark:text-white" : "text-black dark:text-white/60")} />
                  <span className={cn("text-[13px] tracking-tight", isNavItemActive('/', true) ? "font-black" : "font-medium")}>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isNavItemActive('/projects')} className={cn(
                "h-9 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                isNavItemActive('/projects') ? "bg-primary/10 text-black dark:text-white" : "hover:bg-secondary/50 text-black dark:text-white/80"
              )}>
                <Link href="/projects" className="flex items-center gap-3 w-full">
                  {isNavItemActive('/projects') && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                  <Folder className={cn("size-4 transition-transform group-hover/btn:scale-110", isNavItemActive('/projects') ? "text-black dark:text-white" : "text-black dark:text-white/60")} />
                  <span className={cn("text-[13px] tracking-tight", isNavItemActive('/projects') ? "font-black" : "font-medium")}>Projects</span>
                </Link>
              </SidebarMenuButton>
              {/* Optional sub-items can go here if needed later (Active, Archived, Templates) */}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Current Project specific links */}
        {projectId && workflowTree && (
          <>
            <div className="px-3 mt-4 mb-2 flex flex-col gap-2">
              <div className="flex items-center">
                <div className="h-px bg-border flex-1" />
                <span className="px-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Current Project</span>
                <div className="h-px bg-border flex-1" />
              </div>
              
              {/* Project Card */}
              <div className="flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="text-[13px] font-black text-foreground truncate w-full mb-1">
                  {workflowTree.projectCard?.name || "Project Name"}
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">{workflowTree.projectCard?.type}</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {workflowTree.projectCard?.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span>Progress</span>
                    <span>{workflowTree.projectCard?.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${workflowTree.projectCard?.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Workflow Groups */}
            {workflowTree.groups?.map((group: any) => (
              <SidebarGroup key={group.id} className="py-1">
                {group.title && (
                  <SidebarGroupLabel className="px-3 text-[10px] font-normal uppercase tracking-widest text-muted-foreground mb-1 h-4">
                    {group.title}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item: any) => {
                    const isActive = isNavItemActive(item.url, item.exact);
                    const IconComponent = (Icons as any)[item.icon] || Icons.Circle;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive} 
                          tooltip={item.title} 
                          className={cn(
                            "h-9 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                            isActive ? "bg-primary/10 text-black dark:text-white hover:bg-primary/15" : "hover:bg-secondary/50 text-black dark:text-white/80 hover:text-black dark:text-white",
                            item.isLocked && "opacity-60 grayscale cursor-not-allowed"
                          )}
                        >
                          <Link href={item.isLocked ? "#" : item.url} className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                              <IconComponent className={cn("size-4 transition-transform group-hover/btn:scale-110", isActive ? "text-black dark:text-white" : "text-black dark:text-white/60")} />
                              <span className={cn("text-[13px] tracking-tight", isActive ? "font-black" : "font-medium")}>
                                {item.title}
                              </span>
                            </div>
                            
                            {/* Badges/Indicators */}
                            {item.badge ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/20 text-primary rounded-sm whitespace-nowrap">
                                {item.badge}
                              </span>
                            ) : item.status === "Completed" ? (
                              <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : item.isLocked ? (
                              <Icons.Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                            ) : null}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </>
        )}

      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="w-full h-px bg-border/50 mb-4" />
        <SidebarMenu className="gap-0.5 mb-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-9 rounded-[10px] px-3 hover:bg-secondary/50 text-black dark:text-white/80">
              <Link href="/settings" className="flex items-center gap-3 w-full">
                <Settings className="size-4 text-black dark:text-white/60" />
                <span className="text-[13px] font-medium tracking-tight">Workspace Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-[10px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/60 dark:border-slate-700/60 hover:bg-white/60 dark:bg-slate-900/60 transition-all cursor-pointer group shadow-premium relative overflow-hidden",
              state === "collapsed" ? "justify-center p-2" : ""
            )}>
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900/80 shrink-0 shadow-lg group-hover:ring-primary/40 transition-all">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-primary text-white text-[10px] font-black">
                  {profile?.fullName?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] font-black tracking-tight truncate text-black dark:text-white leading-none">{profile?.fullName}</span>
                  <span className="text-[9px] font-black text-muted-foreground truncate leading-none mt-2 flex items-center gap-1.5 uppercase tracking-normal">
                    <div className="h-1 w-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" /> <span className="truncate">{'Workspace'}</span>
                  </span>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-[12px] p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border-white/60 dark:border-slate-700/60 shadow-premium">
            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-wider text-muted-foreground">My Account</DropdownMenuLabel>
            
            <DropdownMenuItem className="cursor-pointer font-medium text-[13px] rounded-lg focus:bg-primary/10 focus:text-primary" onClick={() => fileInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              Change Thumbnail
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-border/50 my-2" />
            
            <DropdownMenuItem className="cursor-pointer font-black text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
