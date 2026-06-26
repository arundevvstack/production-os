
"use client";

import * as React from "react";
import {
  LayoutGrid, Film, Users, Briefcase, FileText, Receipt, Search, PieChart, 
  UserCircle, Plus, ShieldCheck, LogOut, Loader2, Building2, Wallet, 
  Settings2, Archive, Bot
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, 
  SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar, SidebarGroupLabel
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  module: string;
  isCore?: boolean;
  exact?: boolean;
  hideFrom?: string[];
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Workspace", items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, module: "dashboard", isCore: true, exact: true },
      { title: "AI Command", url: "/ai-command", icon: Bot, module: "ai_command", hideFrom: ['EMPLOYEE'] },
      { title: "Projects", url: "/projects", icon: Film, module: "projects", isCore: true },
      { title: "Team", url: "/team", icon: UserCircle, module: "team" },
      { title: "Analytics", url: "/reports", icon: PieChart, module: "reports" },
    ]},
  { label: "Growth & CRM", items: [
      { title: "Clients", url: "/clients", icon: Building2, module: "clients", isCore: true },
      { title: "Sales CRM", url: "/crm", icon: Briefcase, module: "crm" },
      { title: "Proposals", url: "/proposals", icon: FileText, module: "proposals" },
      { title: "Market Research", url: "/research", icon: Search, module: "research" },
    ]},
  { label: "Production", items: [
      { title: "Service Builder", url: "/service-builder", icon: Settings2, module: "services" },
      { title: "Talent Network", url: "/talents", icon: Users, module: "talents" },
      { title: "Operations", url: "/ops/command-center", icon: ShieldCheck, module: "ops" },
    ]},
  { label: "Finance", items: [
      { title: "Finance Dashboard", url: "/finance", icon: PieChart, module: "finance" },
      { title: "Invoice and Quote", url: "/invoices", icon: Receipt, module: "invoices" },
      { title: "Accounts", url: "/accounts", icon: Wallet, module: "accounts" },
    ]},
  
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const { profile, company, isLoading, isModuleEnabled, hasPermission } = useTenant();
  // isMounted prevents SSR/hydration mismatch causing all links to appear active
  const [isMounted, setIsMounted] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
      
      // The useTenant hook will automatically reflect the change via Supabase realtime subscription.
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  React.useEffect(() => { setIsMounted(true); }, []);

  // Stable active check: use startsWith so sub-routes stay highlighted
  const isNavItemActive = (item: NavItem): boolean => {
    if (!isMounted || !pathname) return false;
    if (item.exact) return pathname === item.url;
    return pathname === item.url || pathname.startsWith(item.url + '/');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out", description: "Successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || "";

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
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => {
            if (item.hideFrom && profile?.role_id && item.hideFrom.includes(profile.role_id)) {
              return false;
            }
            // Core items bypass company-level module disabling, but ALL items must pass RBAC role permissions
            return hasPermission(item.module, 'view') && (item.isCore || isModuleEnabled(item.module));
          });
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="py-1">
                <SidebarGroupLabel className="px-3 text-[10px] font-normal uppercase tracking-normal text-muted-foreground mb-1 h-4">{group.label}</SidebarGroupLabel>
                <SidebarMenu className="gap-0.5">
                    {visibleItems.map((item) => {
                      const isActive = isNavItemActive(item);
                      return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={cn(
                              "h-9 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                              isActive 
                                ? "bg-primary/10 text-black dark:text-white hover:bg-primary/15" 
                                : "hover:bg-secondary/50 text-black dark:text-white/80 hover:text-black dark:text-white"
                            )}>
                            <Link href={item.url} className="flex items-center gap-3 w-full">
                                {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                                <item.icon className={cn("size-4 transition-transform group-hover/btn:scale-110", isActive ? "text-black dark:text-white" : "text-black dark:text-white/60")} />
                                <span className={cn("text-[13px] tracking-tight", isActive ? "font-black" : "font-medium")}>{item.title}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
            </SidebarGroup>
          );
        })}

        
      </SidebarContent>

      <SidebarFooter className="p-4">
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
                    <div className="h-1 w-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" /> <span className="truncate">{company?.name || 'Workspace'}</span>
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
            {profile?.role_id !== 'EMPLOYEE' && (
              <DropdownMenuItem asChild className="cursor-pointer font-medium text-[13px] rounded-lg focus:bg-primary/10 focus:text-primary">
                <Link href="/archives"><Archive className="mr-2 h-4 w-4" /> Archives</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="cursor-pointer font-medium text-[13px] rounded-lg focus:bg-primary/10 focus:text-primary">
              <Link href="/settings"><Settings2 className="mr-2 h-4 w-4" /> Preferences</Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild className="cursor-pointer font-medium text-[13px] rounded-lg focus:bg-primary/10 focus:text-primary">
              <Link href="/settings/rbac"><ShieldCheck className="mr-2 h-4 w-4" /> Access Control</Link>
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
