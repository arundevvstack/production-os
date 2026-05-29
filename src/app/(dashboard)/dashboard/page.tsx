"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Sparkles, 
  Loader2, 
  Plus, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Clock,
  IndianRupee,
  Briefcase,
  Users,
  Target,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Layout,
  UserCheck,
  Ban,
  Activity,
  Receipt,
  FileText,
  Calendar,
  Lock
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  XAxis, 
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { profile, company, user, isLoading: isTenantLoading, companyId, isSuperAdmin, roleId } = useTenant();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // Live Realtime Clearance Listener
    const channel = supabase
      .channel('pending-clearance-listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'User' }, (payload) => {
        const newUser = payload.new;
        if (newUser.status === 'pending') {
          const roleDisplay = newUser.role_id === 'TALENT' ? 'Talent' : newUser.role_id === 'CLIENT' ? 'Client' : 'Internal Employee';
          toast({
            title: `New ${roleDisplay} Registration`,
            description: `${newUser.fullName} is waiting for clearance approval.`,
            duration: 6000,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- BUSINESS COLLECTIONS ---
  const { data: allProjects, isLoading: isProjectsLoading } = useSupabaseCollection('Project', {
    where: { company_id: companyId }
  });

  const { data: rawObjectives, isLoading: isObjectivesLoading } = useSupabaseCollection('Objective');

  const { data: invoices, isLoading: isInvoicesLoading } = useSupabaseCollection('Invoice', {
    where: { company_id: companyId }
  });

  const { data: prospects, isLoading: isProspectsLoading } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId }
  });

  const { data: talents } = useSupabaseCollection('Talent', {
    where: { company_id: companyId }
  });

  const { data: expenses } = useSupabaseCollection('Expense', {
    where: { company_id: companyId }
  });

  const { data: proposals } = useSupabaseCollection('Proposal', {
    where: { company_id: companyId }
  });

  const { data: companyUsers, refetch: reloadUsers } = useSupabaseCollection('User');

  const { data: activityLogs } = useSupabaseCollection('ActivityLog', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' },
    limit: 10
  });

  const { data: pendingAssets } = useSupabaseCollection('Asset', {
    where: { company_id: companyId }, // We could filter by status but it doesn't have status in this schema version
    orderBy: { created_at: 'desc' }
  });

  // --- MUTATIONS ---
  const handleApproveUser = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('User')
        .update({ 
          status: 'approved',
          company_id: companyId || undefined
        })
        .eq('id', memberId);

      if (error) throw error;
      toast({ title: "User Approved", description: "Crew member has been granted command center clearance and assigned to the company." });
      reloadUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Approval Failed", description: err.message });
    }
  };

  // --- ANALYTICS & WIDGET AGGREGATORS ---
  const stats = useMemo(() => {
    const revenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    const grossExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
    const activeProjects = allProjects?.filter(p => p.status === 'in_progress').length || 0;
    const pendingInvoices = invoices?.filter(inv => inv.payment_status === 'pending').length || 0;
    const crmPipeline = prospects?.reduce((sum, l) => !['won', 'lost'].includes(l.stage || '') ? sum + (l.deal_value || 0) : sum, 0) || 0;
    const pendingUsers = companyUsers?.filter(u => u.status === 'pending').length || 0;
    
    return { revenue, grossExpenses, activeProjects, pendingInvoices, crmPipeline, pendingUsers };
  }, [invoices, expenses, allProjects, prospects, companyUsers]);

  const companyObjectives = useMemo(() => {
    if (!rawObjectives) return [];
    if (!allProjects) return [];
    const projectIds = new Set(allProjects.map(p => p.id));
    return rawObjectives.filter(t => projectIds.has(t.project_id));
  }, [rawObjectives, allProjects]);

  const objectivesFeed = useMemo(() => {
    // For EMPLOYEE, show only their assigned objectives
    const baseObjectives = roleId === 'EMPLOYEE'
      ? companyObjectives.filter(t => t.assignee_id === user?.id)
      : companyObjectives;
    return baseObjectives.filter(t => t.status !== 'done').slice(0, 5);
  }, [companyObjectives, roleId, user]);

  const revenueChartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), i);
      return { month: format(d, 'MMM'), date: startOfMonth(d), revenue: 0 };
    }).reverse();

    invoices?.forEach(inv => {
      const invDate = inv.issue_date ? new Date(inv.issue_date) : null;
      if (invDate) {
        const monthMatch = months.find(m => isSameMonth(m.date, invDate));
        if (monthMatch) monthMatch.revenue += (inv.total || 0);
      }
    });
    return months;
  }, [invoices]);

  const activeProjectsList = useMemo(() => {
    if (!allProjects) return [];
    return allProjects.filter(p => p.status === 'in_progress').slice(0, 4);
  }, [allProjects]);

  if (isTenantLoading || isProjectsLoading || isObjectivesLoading || isInvoicesLoading || isProspectsLoading || !hasMounted) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  // --- RENDER DASHBOARD BASED ON ROLE ---

  // 1. SUPER_ADMIN / OWNER Command Center
  if (roleId === 'SUPER_ADMIN' || isSuperAdmin) {
    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
                Command, <span className="text-gradient">{profile?.fullName?.split(' ')[0] || 'Administrator'}</span>
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-primary/20 shadow-sm">
                <Zap className="h-3 w-3 fill-current animate-pulse" /> {profile?.role_id ? `${profile.role_id.replace('_', ' ')} STATUS` : 'SUPER ADMIN STATUS'}
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Layout className="h-4 w-4 text-foreground" /> {company?.name || 'Operational'} Enterprise Headquarters
            </p>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[10px]"><IndianRupee className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Gross Sales</span>
                <span className="text-2xl font-black text-foreground">₹{stats.revenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Workspaces</span>
                <span className="text-2xl font-black text-foreground">{allProjects?.length || 0} units</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Users className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Crew Force</span>
                <span className="text-2xl font-black text-foreground">{companyUsers?.length || 0} profiles</span>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-none shadow-premium rounded-[10px] transition-colors ${stats.pendingUsers > 0 ? 'bg-accent text-white' : 'bg-white'}`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-[10px] ${stats.pendingUsers > 0 ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}><UserCheck className="h-6 w-6" /></div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${stats.pendingUsers > 0 ? 'text-white/80' : 'text-muted-foreground'}`}>Pending Approvals</span>
                <span className="text-2xl font-black">{stats.pendingUsers} requests</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SuperAdmin Specific Sections: User Requests & System Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Request Approvals */}
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white overflow-hidden">
            <CardHeader className="border-b p-6">
              <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-foreground" /> Pending User Clearances
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">New registrations awaiting credentials verification before accessing dashboard workspaces.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {companyUsers?.filter(u => u.status === 'pending').length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-bold uppercase tracking-wider text-xs">
                  All systems clear. No pending crew registrations.
                </div>
              ) : (
                <div className="divide-y">
                  {companyUsers?.filter(u => u.status === 'pending').map((member) => {
                    const dispName = member.fullName || member.full_name || member.email?.split('@')[0] || 'New Crew';
                    return (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-foreground text-[10px] font-black">
                              {dispName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-black text-foreground">{dispName}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{member.email}</p>
                          </div>
                        </div>
                        <Button onClick={() => handleApproveUser(member.id)} className="h-9 px-4 rounded-xl gap-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-200">
                          <UserCheck className="h-4 w-4" /> Grant Access
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="border border-white/60 shadow-premium rounded-[10px] bg-white/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 pb-4 border-b border-white/40 relative z-10">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                Operational Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              {activityLogs?.length === 0 ? (
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider text-center py-8">Zero system logs generated.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {activityLogs?.map((log) => (
                    <div key={log.id} className="text-xs space-y-2 p-3 rounded-[10px] bg-white/60 border border-white/60 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-2">
                        <span>{log.user_name}</span>
                        <span className="text-primary/70">{format(new Date(log.created_at), 'HH:mm | MMM d')}</span>
                      </div>
                      <p className="font-black text-foreground pl-2">{log.action}</p>
                      <p className="text-[11px] text-muted-foreground font-medium pl-2">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 2. MANAGER Command Center
  if (roleId === 'MANAGER') {
    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
              Director, <span className="text-gradient">{profile?.fullName?.split(' ')[0] || 'Manager'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Layout className="h-4 w-4 text-foreground" /> Workspace Management Core
            </p>
          </div>
        </div>

        {/* Manager KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Active Units</span>
                <span className="text-2xl font-black text-foreground">{stats.activeProjects} active</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Clock className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Active Tasks</span>
                <span className="text-2xl font-black text-foreground">{companyObjectives.filter(t => t.status !== 'done').length || 0} tasks</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Users className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Crew Force</span>
                <span className="text-2xl font-black text-foreground">{companyUsers?.length || 0} members</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><UserCheck className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Pending Crew</span>
                <span className="text-2xl font-black text-foreground">{stats.pendingUsers} requests</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manager Workspace Active Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-black text-foreground">Operational Focus Units</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeProjectsList.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground font-bold uppercase tracking-wider text-xs">No projects currently marked In Progress.</p>
              ) : (
                <div className="divide-y">
                  {activeProjectsList.map((p) => (
                    <div key={p.id} className="p-6 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-black text-base text-foreground">{p.project_name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded">Budget: ₹{p.budget?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Health</span>
                          <span className="font-black text-foreground">{p.progress}%</span>
                        </div>
                        <Link href={`/projects/${p.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 bg-muted hover:bg-primary/5 hover:text-foreground rounded-xl"><ArrowUpRight className="h-5 w-5" /></Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending crew panel for managers */}
          <Card className="border border-white/60 shadow-premium rounded-[10px] bg-white/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/40 relative z-10">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
                Crew Enlistment Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              {companyUsers?.filter(u => u.status === 'pending').length === 0 ? (
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider text-center py-8">Zero pending registrations.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {companyUsers?.filter(u => u.status === 'pending').map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-3 rounded-[10px] bg-white/60 border border-white/60 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="min-w-0 pl-2">
                        <p className="text-xs font-black text-foreground truncate">{member.fullName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">{member.email}</p>
                      </div>
                      <Button onClick={() => handleApproveUser(member.id)} className="h-8 px-3 rounded-lg font-bold text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-none border border-primary/20 hover:border-transparent transition-all">Approve</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 3. EMPLOYEE Command Center
  if (roleId === 'EMPLOYEE') {
    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
              Assigned Work, <span className="text-gradient">{profile?.fullName?.split(' ')[0] || 'Creative'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Layers className="h-4 w-4 text-foreground" /> Team Member Dashboard
            </p>
          </div>
        </div>

        {/* Employee KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Clock className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Assigned Tasks</span>
                <span className="text-2xl font-black text-foreground">{objectivesFeed.length} active</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Assigned Productions</span>
                <span className="text-2xl font-black text-foreground">{activeProjectsList.length} units</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Calendar className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Clearance Level</span>
                <span className="text-2xl font-black text-foreground">Crew Member</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Assigned Objectives backlogs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-black text-foreground">My Task Backlog</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Clear assigned milestones inside production roadmaps.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {objectivesFeed.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground font-bold uppercase tracking-wider text-xs">All tasks completed successfully!</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {objectivesFeed.map((t) => (
                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-foreground px-2 py-0.5 rounded">Milestone</span>
                        <h4 className="font-bold text-sm text-foreground">{t.title}</h4>
                      </div>
                      <Link href={`/projects/${t.project_id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-muted hover:bg-primary/5 hover:text-foreground rounded-xl"><ArrowUpRight className="h-5 w-5" /></Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Reviews Panel */}
          <Card className="border-none shadow-premium rounded-[10px] bg-white overflow-hidden relative">
            <CardHeader className="p-6 relative z-10 border-b border-border bg-muted">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-foreground" /> Pending Asset Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              {!pendingAssets || pendingAssets.length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-center py-8">
                  No assets pending review.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {pendingAssets.slice(0,5).map((asset) => (
                    <div key={asset.id} className="p-4 flex justify-between items-center hover:bg-muted transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground truncate">{asset.name}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Awaiting Feedback</p>
                      </div>
                      <Link href={`/projects/${asset.project_id}/approvals`}>
                         <Button size="sm" className="h-8 px-3 rounded-lg font-bold text-[10px] bg-primary hover:bg-primary/95 text-white">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 4. ACCOUNTS Dashboard
  if (roleId === 'ACCOUNTS') {
    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
              Accounting, <span className="text-gradient">{profile?.fullName?.split(' ')[0] || 'Auditor'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Receipt className="h-4 w-4 text-foreground" /> Finance & Payroll Department
            </p>
          </div>
        </div>

        {/* Accounts KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[10px]"><IndianRupee className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Gross Capital</span>
                <span className="text-2xl font-black text-foreground">₹{stats.revenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Layers className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Gross Expenses</span>
                <span className="text-2xl font-black text-foreground">₹{stats.grossExpenses.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Receipt className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Pending Invoices</span>
                <span className="text-2xl font-black text-foreground">{stats.pendingInvoices} invoices</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><TrendingUp className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Cash Velocity</span>
                <span className="text-2xl font-black text-foreground">₹{((stats.revenue - stats.grossExpenses) / 1000).toFixed(1)}k</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] overflow-hidden bg-white">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-xl font-black tracking-tight text-foreground">Revenue Ledger</CardTitle>
              <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global billing performance</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] pt-4 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: '900', fill: '#94a3b8' }} />
                  <RechartsTooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Billing']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Secure lock warning for accounts */}
          <Card className="border border-white/60 shadow-premium rounded-[10px] bg-white/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/40 relative z-10">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                Access Gates Active
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10 pt-4 space-y-4">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                As a finance crew member, your profile is locked under strict tenant isolation policies. You do not have permissions to access:
              </p>
              <ul className="text-[10px] font-black uppercase tracking-wider text-muted-foreground space-y-3">
                <li className="flex items-center gap-2"><div className="h-4 w-4 bg-accent/10 rounded flex items-center justify-center"><Ban className="h-3 w-3 text-accent" /></div> CRM client funnels</li>
                <li className="flex items-center gap-2"><div className="h-4 w-4 bg-accent/10 rounded flex items-center justify-center"><Ban className="h-3 w-3 text-accent" /></div> Project production edits</li>
                <li className="flex items-center gap-2"><div className="h-4 w-4 bg-accent/10 rounded flex items-center justify-center"><Ban className="h-3 w-3 text-accent" /></div> Administration configurations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 5. MARKETING & SALES Dashboard
  if (roleId === 'MARKETING_SALES') {
    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
              Sales, <span className="text-gradient">{profile?.fullName?.split(' ')[0] || 'Strategist'}</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Target className="h-4 w-4 text-foreground" /> Growth & CRM Department
            </p>
          </div>
        </div>

        {/* Marketing KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Target className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">CRM Pipeline</span>
                <span className="text-2xl font-black text-foreground">₹{stats.crmPipeline.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Total Prospects</span>
                <span className="text-2xl font-black text-foreground">{prospects?.length || 0} prospects</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><FileText className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Proposals</span>
                <span className="text-2xl font-black text-foreground">{proposals?.length || 0} drafts</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[10px]"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Approved Total</span>
                <span className="text-2xl font-black text-foreground">₹{stats.revenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Funnel List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white overflow-hidden">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-black text-foreground">Growth Opportunities</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Latest incoming prospects in the sales pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {prospects?.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground font-bold uppercase tracking-wider text-xs">Funnel empty. Create new prospect opportunity.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {prospects?.slice(0, 4).map((l) => (
                    <div key={l.id} className="p-5 flex items-center justify-between hover:bg-muted transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">{l.company_name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded">Stage: {l.stage || 'new'}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Deal Value</span>
                          <span className="font-black text-emerald-600">₹{l.deal_value?.toLocaleString() || 0}</span>
                        </div>
                        <Link href="/crm">
                          <Button variant="ghost" size="icon" className="h-9 w-9 bg-muted hover:bg-primary/5 hover:text-foreground rounded-xl"><ArrowUpRight className="h-5 w-5" /></Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secure lock warning for sales */}
          <Card className="border border-white/60 shadow-premium rounded-[10px] bg-white/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/40 relative z-10">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                Operational Boundary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10 pt-4 space-y-4">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                As a marketing strategist, your profile is locked under strict tenant isolation policies. You do not have permissions to access:
              </p>
              <ul className="text-[10px] font-black uppercase tracking-wider text-muted-foreground space-y-3">
                <li className="flex items-center gap-2"><div className="h-4 w-4 bg-accent/10 rounded flex items-center justify-center"><Ban className="h-3 w-3 text-accent" /></div> Detailed Invoice edits</li>
                <li className="flex items-center gap-2"><div className="h-4 w-4 bg-accent/10 rounded flex items-center justify-center"><Ban className="h-3 w-3 text-accent" /></div> Expenses ledger and tax filing</li>
                <li className="flex items-center gap-2"><div className="h-4 w-4 bg-accent/10 rounded flex items-center justify-center"><Ban className="h-3 w-3 text-accent" /></div> Platform configurations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // fallback to base active view
  return null;
}
