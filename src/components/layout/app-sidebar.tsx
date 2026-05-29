
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
}

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Workspace", items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, module: "dashboard", isCore: true, exact: true },
      { title: "AI Command", url: "/ai-command", icon: Bot, module: "dashboard", isCore: true },
      { title: "Projects", url: "/projects", icon: Film, module: "projects", isCore: true },
      { title: "Analytics", url: "/reports", icon: PieChart, module: "reports" },
    ]},
  { label: "Growth & CRM", items: [
      { title: "Clients", url: "/clients", icon: Building2, module: "clients" },
      { title: "Sales CRM", url: "/crm", icon: Briefcase, module: "crm" },
      { title: "Proposals", url: "/proposals", icon: FileText, module: "proposals" },
      { title: "Market Research", url: "/research", icon: Search, module: "research" },
    ]},
  { label: "Production", items: [
      { title: "Service Builder", url: "/service-builder", icon: Settings2, module: "services" },
      { title: "Talent Network", url: "/talents", icon: Users, module: "talents" },
    ]},
  { label: "Finance", items: [
      { title: "Invoice and Quote", url: "/invoices", icon: Receipt, module: "invoices" },
      { title: "Accounts", url: "/accounts", icon: Wallet, module: "accounts" },
    ]},
  { label: "Storage", items: [
      { title: "Archives", url: "/archives", icon: Archive, module: "archives", isCore: true },
    ]},
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const { profile, company, isLoading, isModuleEnabled, hasPermission } = useTenant();
  // isMounted prevents SSR/hydration mismatch causing all links to appear active
  const [isMounted, setIsMounted] = React.useState(false);
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

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || "https://picsum.photos/seed/logo/200/200";

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" variant="inset" className="bg-sidebar">
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r border-white/20 glass-panel font-body">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-start min-h-[40px]">
          <Logo variant={state === "collapsed" ? "icon" : "full"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 gap-0">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.isCore || (isModuleEnabled(item.module) && hasPermission(item.module, 'view')));
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="py-1">
                <SidebarGroupLabel className="px-3 text-[10px] font-normal uppercase tracking-normal text-slate-500 mb-1 h-4">{group.label}</SidebarGroupLabel>
                <SidebarMenu className="gap-0.5">
                    {visibleItems.map((item) => {
                      const isActive = isNavItemActive(item);
                      return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={cn(
                              "h-7 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                              isActive 
                                ? "bg-primary/10 text-primary hover:bg-primary/15" 
                                : "hover:bg-slate-200/50 text-slate-700 hover:text-slate-900"
                            )}>
                            <Link href={item.url} className="flex items-center gap-3 w-full">
                                {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                                <item.icon className={cn("size-4 transition-transform group-hover/btn:scale-110", isActive ? "text-primary" : "text-slate-500")} />
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

        <SidebarGroup className="py-2 border-t border-white/10 mt-1">
            <SidebarGroupLabel className="px-3 text-[10px] font-normal uppercase tracking-normal text-slate-500 mb-1">Systems</SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/settings') && !pathname?.includes('/rbac')} tooltip="Global Settings" className={cn(
                      "h-7 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                      (pathname?.startsWith('/settings') && !pathname?.includes('/rbac'))
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "hover:bg-slate-200/50 text-slate-700 hover:text-slate-900"
                  )}>
                      <Link href="/settings" className="flex items-center gap-3 w-full">
                          {(pathname?.startsWith('/settings') && !pathname?.includes('/rbac')) && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                          <Settings2 className={cn("size-4 transition-transform group-hover/btn:scale-110", (pathname?.startsWith('/settings') && !pathname?.includes('/rbac')) ? "text-primary" : "text-slate-500")} />
                          <span className={cn("text-[13px] tracking-tight", (pathname?.startsWith('/settings') && !pathname?.includes('/rbac')) ? "font-black" : "font-medium")}>Preferences</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {hasPermission('admin') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.includes('/rbac')} tooltip="Access Control" className={cn(
                      "h-7 rounded-[10px] transition-all duration-300 px-3 relative overflow-hidden group/btn",
                      pathname?.includes('/rbac')
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "hover:bg-slate-200/50 text-slate-700 hover:text-slate-900"
                  )}>
                      <Link href="/settings/rbac" className="flex items-center gap-3 w-full">
                          {pathname?.includes('/rbac') && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md shadow-[0_0_10px_rgba(220,38,38,0.5)]" />}
                          <ShieldCheck className={cn("size-4 transition-transform group-hover/btn:scale-110", pathname?.includes('/rbac') ? "text-primary" : "text-slate-500")} />
                          <span className={cn("text-[13px] tracking-tight", pathname?.includes('/rbac') ? "font-black" : "font-medium")}>Access Control</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Log Out" className="h-7 rounded-lg px-3 hover:bg-rose-500/10 hover:text-rose-600 text-slate-700 font-normal group transition-colors">
                    <LogOut className="size-4 text-slate-600 transition-transform group-hover:translate-x-1" />
                    <span className="text-[13px]">Log Out</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-[10px] bg-white/40 backdrop-blur-3xl border border-white/60 hover:bg-white/60 transition-all cursor-pointer group shadow-premium",
          state === "collapsed" ? "justify-center p-2" : ""
        )}>
          <Avatar className="h-10 w-10 ring-2 ring-white/80 shrink-0 shadow-lg group-hover:ring-primary/40 transition-all">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="bg-primary text-white text-[10px] font-black">
              {profile?.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-black tracking-tight truncate text-slate-900 leading-none">{profile?.fullName}</span>
              <span className="text-[9px] font-black text-slate-400 truncate leading-none mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                <div className="h-1 w-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> {company?.name || 'Workspace'}
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
