
"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { usePathname, useRouter } from "next/navigation";
import { navGroups } from "@/components/layout/app-sidebar";
import { ThemeSync } from "@/components/layout/theme-sync";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, companyId, isSuperAdmin, profile, isLoading, hasPermission, isModuleEnabled } = useTenant();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    // Safety checks: instantly route to appropriate holding pages
    if (profile?.status === 'suspended') {
      router.push("/access-blocked");
      return;
    }
    if (profile?.status === 'pending' && !isSuperAdmin) {
      router.push("/pending-approval");
      return;
    }

    // Role-based isolation: ensure TALENT and CLIENT cannot access internal workspace
    if (profile?.role_id === 'TALENT') {
      router.push("/talent/dashboard");
      return;
    }
    if (profile?.role_id === 'CLIENT') {
      router.push("/client/dashboard");
      return;
    }

    // Company exists — no onboarding needed for Define Perspective
    // If companyId is still null after profile loads, it means the profile
    // is still pending approval — handled above.

    // Module-level Route Guard
    if (pathname && profile) {
      for (const group of navGroups) {
        for (const item of group.items) {
          const isMatch = item.exact ? pathname === item.url : pathname.startsWith(item.url);
          if (isMatch) {
            // Check if the current user has permission to view this module
            const isVisible = hasPermission(item.module, 'view') && (item.isCore || isModuleEnabled(item.module));
            if (!isVisible) {
              // Block access and redirect to a safe page
              if (pathname !== "/dashboard") {
                router.push("/dashboard");
              } else {
                router.push("/access-blocked");
              }
              return;
            }
          }
        }
      }
    }
  }, [user, companyId, isSuperAdmin, profile, isLoading, router, pathname, hasPermission, isModuleEnabled]);

  if (isLoading || !user || (profile?.status === 'suspended') || (profile?.status === 'pending' && !isSuperAdmin) || profile?.role_id === 'TALENT' || profile?.role_id === 'CLIENT') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
        <ThemeSync />
        <AppSidebar />
        <SidebarInset className="bg-transparent overflow-hidden flex flex-col h-[100dvh]">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/20 dark:border-slate-700/20 glass-panel px-6 md:hidden relative z-40">
                <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-primary/5 text-muted-foreground/80" />
                <div className="flex items-center gap-2 ml-2">
                    <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-primary/20">DP</div>
                    <span className="font-black text-sm tracking-tight text-foreground">Media<span className="text-foreground">OS</span></span>
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar relative z-0">
                <div className="max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}

