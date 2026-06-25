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
  Lock,
  AlertTriangle,
  TrendingDown,
  Building2,
  BarChart2
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

  // Table Proposal does not exist in schema yet
  const proposals: any[] = [];

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
    const activeProjects = allProjects?.filter(p => p.status === 'in_progress' || p.status === 'active').length || 0;
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
    return allProjects.filter(p => p.status === 'in_progress' || p.status === 'active').slice(0, 4);
  }, [allProjects]);

  const userProjectMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!allProjects) return map;
    allProjects.forEach(p => {
      if (p.assignee_id) map[p.assignee_id] = (map[p.assignee_id] || 0) + 1;
    });
    return map;
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
    const netProfit = stats.revenue - stats.grossExpenses;
    const profitMargin = stats.revenue > 0 ? ((netProfit / stats.revenue) * 100).toFixed(1) : '0.0';
    const overdueProjects = allProjects?.filter(p => {
      if (!p.deadline || p.status === 'completed') return false;
      return new Date(p.deadline) < new Date();
    }).length || 0;
    const crmWon = prospects?.filter(p => p.stage === 'won').reduce((s: number, p: any) => s + (p.deal_value || 0), 0) || 0;
    const crmActive = prospects?.filter(p => !['won','lost'].includes(p.stage || ''));
    const approvedUsers = companyUsers?.filter(u => u.status === 'approved') || [];

    const statusColor = (s: string) => {
      if (s === 'in_progress') return 'bg-primary/10 text-primary';
      if (s === 'completed') return 'bg-emerald-50 text-emerald-600';
      if (s === 'on_hold') return 'bg-amber-50 text-amber-600';
      return 'bg-muted text-muted-foreground';
    };
    const statusLabel = (s: string) => {
      if (s === 'in_progress') return 'In Progress';
      if (s === 'completed') return 'Completed';
      if (s === 'on_hold') return 'On Hold';
      return s?.replace(/_/g,' ') || 'Draft';
    };
    const isDeadlineSoon = (dl: string) => {
      if (!dl) return false;
      const diff = (new Date(dl).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    };
    const isOverdue = (dl: string, status: string) => {
      if (!dl || status === 'completed') return false;
      return new Date(dl) < new Date();
    };

    return (
      <div className="space-y-8 font-body">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
                Command, <span className="text-gradient">{profile?.fullName?.split(' ')[0] || 'Administrator'}</span>
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-primary/20 shadow-sm">
                <Zap className="h-3 w-3 fill-current animate-pulse" /> {profile?.role_id ? `${profile.role_id.replace('_', ' ')} STATUS` : 'SUPER ADMIN'}
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Building2 className="h-4 w-4 text-foreground" /> {company?.name || 'Operational'} · Enterprise Command Center
            </p>
          </div>
          <span className="px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-full shadow-sm text-xs font-bold text-muted-foreground">{format(new Date(), 'EEE, dd MMM yyyy')}</span>
        </div>

        {/* 6 KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Gross Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${profitMargin}% margin` },
            { label: 'Net Profit', value: `₹${netProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', sub: netProfit >= 0 ? 'Positive cashflow' : 'Deficit' },
            { label: 'CRM Pipeline', value: `₹${stats.crmPipeline.toLocaleString()}`, icon: Target, color: 'text-violet-600', bg: 'bg-violet-50', sub: `${crmActive?.length || 0} active leads` },
            { label: 'Total Projects', value: `${allProjects?.length || 0}`, icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10', sub: `${stats.activeProjects} in progress` },
            { label: 'Crew Force', value: `${companyUsers?.length || 0}`, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', sub: `${stats.pendingUsers} pending` },
            { label: 'Overdue', value: `${overdueProjects}`, icon: AlertTriangle, color: overdueProjects > 0 ? 'text-accent' : 'text-muted-foreground', bg: overdueProjects > 0 ? 'bg-accent/10' : 'bg-muted', sub: overdueProjects > 0 ? 'Needs attention' : 'All on track' },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-none shadow-premium rounded-[12px] bg-white dark:bg-slate-900 hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-5">
                <div className={`h-9 w-9 rounded-[10px] ${kpi.bg} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Health Table + CRM Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[12px] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Project Health
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium text-xs mt-1">Status, deadlines, budget and progress for all workspaces.</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/5">
                  View All <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {(!allProjects || allProjects.length === 0) ? (
                <div className="p-12 text-center text-muted-foreground font-bold text-xs uppercase tracking-wider">No projects found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-6 py-3 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Project</th>
                        <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Deadline</th>
                        <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Budget</th>
                        <th className="text-left px-4 py-3 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Progress</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allProjects.slice(0, 8).map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-black text-foreground truncate max-w-[160px]">{p.project_name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{p.client_name || '—'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor(p.status)}`}>
                              {statusLabel(p.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {p.deadline ? (
                              <span className={`flex items-center gap-1 font-black ${isOverdue(p.deadline, p.status) ? 'text-accent' : isDeadlineSoon(p.deadline) ? 'text-amber-600' : 'text-foreground'}`}>
                                {isOverdue(p.deadline, p.status) && <AlertTriangle className="h-3 w-3" />}
                                {isDeadlineSoon(p.deadline) && !isOverdue(p.deadline, p.status) && <Clock className="h-3 w-3" />}
                                {format(new Date(p.deadline), 'dd MMM yy')}
                              </span>
                            ) : <span className="text-muted-foreground">TBD</span>}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-black text-foreground">₹{(p.budget || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-4 min-w-[110px]">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-muted-foreground">{p.progress || 0}%</span>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${p.progress || 0}%`, background: (p.progress || 0) >= 80 ? '#10b981' : (p.progress || 0) >= 50 ? 'hsl(var(--primary))' : '#f59e0b' }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Link href={`/projects/${p.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CRM Pipeline */}
          <Card className="border-none shadow-premium rounded-[12px] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b p-6">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-violet-600" />
                </div>
                CRM Pipeline
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-xs mt-1">Active lead value and conversion funnel.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div className="p-3 rounded-[10px] bg-violet-50 border border-violet-100">
                  <p className="text-[9px] font-black text-violet-500 uppercase tracking-wider">Pipeline Value</p>
                  <p className="text-lg font-black text-violet-700 mt-0.5">₹{stats.crmPipeline.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-[10px] bg-emerald-50 border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Won Revenue</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">₹{crmWon.toLocaleString()}</p>
                </div>
              </div>
              {(['new', 'proposal', 'negotiation', 'won', 'lost'] as const).map(stage => {
                const count = prospects?.filter((p: any) => p.stage === stage).length || 0;
                const val = prospects?.filter((p: any) => p.stage === stage).reduce((s: number, p: any) => s + (p.deal_value || 0), 0) || 0;
                const dot: Record<string, string> = { new: 'bg-blue-500', proposal: 'bg-primary', negotiation: 'bg-amber-500', won: 'bg-emerald-500', lost: 'bg-muted-foreground' };
                return (
                  <div key={stage} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${dot[stage]}`} />
                      <span className="text-[11px] font-black uppercase tracking-wider text-foreground capitalize">{stage}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">({count})</span>
                    </div>
                    <span className="text-xs font-black text-foreground">₹{val.toLocaleString()}</span>
                  </div>
                );
              })}
              <Link href="/crm">
                <Button variant="outline" className="w-full h-8 rounded-xl text-[10px] font-black uppercase tracking-wider mt-2">
                  Open CRM <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Crew Roster + Revenue Chart + Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crew Roster */}
          <Card className="border-none shadow-premium rounded-[12px] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b p-6">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-amber-600" />
                </div>
                Crew Roster
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium mt-1">Approved members and their active workloads.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {approvedUsers.length === 0 ? (
                <p className="p-8 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">No crew members yet.</p>
              ) : (
                <div className="divide-y max-h-[300px] overflow-y-auto custom-scrollbar">
                  {approvedUsers.map((member) => {
                    const name = member.fullName || member.full_name || member.email?.split('@')[0] || 'Crew';
                    const projCount = userProjectMap[member.id] || 0;
                    const roleTag = member.role_id?.replace(/_/g, ' ') || 'Crew';
                    return (
                      <div key={member.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-foreground text-[10px] font-black">
                            {name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground truncate">{name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate">{member.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">{roleTag}</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{projCount} project{projCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {stats.pendingUsers > 0 && (
                <div className="p-4 border-t bg-accent/5 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent block">Pending Clearances ({stats.pendingUsers})</span>
                  {companyUsers?.filter(u => u.status === 'pending').map((member) => {
                    const dispName = member.fullName || member.full_name || member.email?.split('@')[0] || 'New Crew';
                    return (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-accent/10 text-accent text-[9px] font-black">{dispName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <p className="text-[11px] font-black text-foreground truncate">{dispName}</p>
                        </div>
                        <Button onClick={() => handleApproveUser(member.id)} className="h-7 px-3 rounded-lg text-[9px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">Approve</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border-none shadow-premium rounded-[12px] bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BarChart2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Revenue Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium mt-1">6-month billing performance overview.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-4">
              <div className="flex gap-4 mb-4">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Total Billed</p>
                  <p className="text-xl font-black text-emerald-600">₹{stats.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Expenses</p>
                  <p className="text-xl font-black text-accent">₹{stats.grossExpenses.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: '900', fill: '#94a3b8' }} />
                    <RechartsTooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRev2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {stats.pendingInvoices > 0 && (
                <div className="mt-3 p-3 rounded-[10px] bg-amber-50 border border-amber-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-black text-amber-700">{stats.pendingInvoices} invoice{stats.pendingInvoices > 1 ? 's' : ''} pending payment</span>
                  <Link href="/finance/invoices" className="ml-auto">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-black text-amber-700 hover:bg-amber-100">View</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="border border-white/60 dark:border-slate-700/60 shadow-premium rounded-[12px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 pb-4 border-b border-white/40 dark:border-slate-700/40 relative z-10">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 relative z-10">
              {(!activityLogs || activityLogs.length === 0) ? (
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider text-center py-8">Zero system logs generated.</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {activityLogs?.map((log) => (
                    <div key={log.id} className="text-xs space-y-1.5 p-3 rounded-[10px] bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/60 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="flex justify-between items-center pl-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{log.user_name}</span>
                        <span className="text-[10px] font-bold text-primary/70">{format(new Date(log.created_at), 'HH:mm · MMM d')}</span>
                      </div>
                      <p className="font-black text-foreground pl-2 text-[11px]">{log.action}</p>
                      {log.details && <p className="text-[10px] text-muted-foreground font-medium pl-2">{log.details}</p>}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Active Units</span>
                <span className="text-2xl font-black text-foreground">{stats.activeProjects} active</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Clock className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Active Tasks</span>
                <span className="text-2xl font-black text-foreground">{companyObjectives.filter(t => t.status !== 'done').length || 0} tasks</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Users className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Crew Force</span>
                <span className="text-2xl font-black text-foreground">{companyUsers?.length || 0} members</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
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
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
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
          <Card className="border border-white/60 dark:border-slate-700/60 shadow-premium rounded-[10px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/40 dark:border-slate-700/40 relative z-10">
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
                    <div key={member.id} className="flex justify-between items-center p-3 rounded-[10px] bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/60 hover:shadow-md transition-all group relative overflow-hidden">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Clock className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Assigned Tasks</span>
                <span className="text-2xl font-black text-foreground">{objectivesFeed.length} active</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Assigned Productions</span>
                <span className="text-2xl font-black text-foreground">{activeProjectsList.length} units</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
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
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
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
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden relative">
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
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[10px]"><IndianRupee className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Gross Capital</span>
                <span className="text-2xl font-black text-foreground">₹{stats.revenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Layers className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Gross Expenses</span>
                <span className="text-2xl font-black text-foreground">₹{stats.grossExpenses.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Receipt className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Pending Invoices</span>
                <span className="text-2xl font-black text-foreground">{stats.pendingInvoices} invoices</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
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
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] overflow-hidden bg-white dark:bg-slate-900">
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
          <Card className="border border-white/60 dark:border-slate-700/60 shadow-premium rounded-[10px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/40 dark:border-slate-700/40 relative z-10">
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
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Target className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">CRM Pipeline</span>
                <span className="text-2xl font-black text-foreground">₹{stats.crmPipeline.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><Briefcase className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Total Prospects</span>
                <span className="text-2xl font-black text-foreground">{prospects?.length || 0} prospects</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent/10 text-accent rounded-[10px]"><FileText className="h-6 w-6" /></div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Proposals</span>
                <span className="text-2xl font-black text-foreground">{proposals?.length || 0} drafts</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900">
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
          <Card className="lg:col-span-2 border-none shadow-premium rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
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
          <Card className="border border-white/60 dark:border-slate-700/60 shadow-premium rounded-[10px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/40 dark:border-slate-700/40 relative z-10">
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
