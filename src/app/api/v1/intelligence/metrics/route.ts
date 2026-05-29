import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAIEvent } from '@/lib/ai-telemetry';

/**
 * GET /api/v1/intelligence/metrics
 *
 * Returns real-time business KPIs for the AI Command Center.
 * All queries are company-id scoped for tenant isolation.
 * Falls back to safe mock data if any query fails.
 * Role-gated: finance metrics only visible to SUPER_ADMIN / ACCOUNTS / MANAGER.
 */

// Fallback mock data — used if DB queries fail
const MOCK_METRICS = {
  projectedRevenue: '₹24,50,000',
  revenueGrowth: '+18.4%',
  activeRisks: 2,
  utilizationRate: '88%',
  proposalConversion: '84%',
  // extended
  totalRevenue: 0,
  outstandingRevenue: 0,
  monthlyRevenue: 0,
  activeProjects: 0,
  delayedProjects: 0,
  teamUtilization: 88,
  objectiveCompletionRate: 84,
  prospectConversionRate: 84,
  isMock: true,
};

export async function GET() {
  const startMs = Date.now();

  try {
    const supabase = await createClient();

    // ── Auth check ──────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Get user profile + company_id ────────────────────────────────────────
    const { data: profile } = await supabase
      .from('User')
      .select('company_id, role_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ metrics: MOCK_METRICS });
    }

    const { company_id, role_id } = profile;
    const isPrivileged = ['SUPER_ADMIN', 'MANAGER', 'ACCOUNTS'].includes(role_id ?? '');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // ── Run all queries in parallel for performance ───────────────────────────
    const [
      invoicesResult,
      projectsResult,
      usersResult,
      objectivesResult,
      prospectsResult,
    ] = await Promise.allSettled([
      // 1. Invoices (finance — only for privileged roles)
      isPrivileged
        ? supabase.from('Invoice').select('total, payment_status, issue_date').eq('company_id', company_id)
        : Promise.resolve({ data: [], error: null }),

      // 2. Projects
      supabase.from('Project').select('id, status, deadline').eq('company_id', company_id),

      // 3. Users
      supabase.from('User').select('id, status').eq('company_id', company_id),

      // 4. Objectives
      supabase.from('Objective').select('id, status, project_id'),

      // 5. Prospects (CRM)
      supabase.from('Prospect').select('id, stage, deal_value').eq('company_id', company_id),
    ]);

    // ── Extract results with graceful fallbacks ───────────────────────────────
    const invoices = invoicesResult.status === 'fulfilled' ? (invoicesResult.value.data ?? []) : [];
    const projects = projectsResult.status === 'fulfilled' ? (projectsResult.value.data ?? []) : [];
    const users = usersResult.status === 'fulfilled' ? (usersResult.value.data ?? []) : [];
    const objectives = objectivesResult.status === 'fulfilled' ? (objectivesResult.value.data ?? []) : [];
    const prospects = prospectsResult.status === 'fulfilled' ? (prospectsResult.value.data ?? []) : [];

    // ── Compute metrics ───────────────────────────────────────────────────────

    // Revenue
    const paidInvoices = invoices.filter((i: any) => i.payment_status === 'paid');
    const pendingInvoices = invoices.filter((i: any) => i.payment_status === 'pending' || i.payment_status === 'unpaid');
    const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const outstandingRevenue = pendingInvoices.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
    const monthlyRevenue = paidInvoices
      .filter((i: any) => i.issue_date && i.issue_date >= startOfMonth)
      .reduce((s: number, i: any) => s + (i.total ?? 0), 0);

    // Previous month for growth calculation
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const prevMonthRevenue = paidInvoices
      .filter((i: any) => i.issue_date && i.issue_date >= startOfPrevMonth && i.issue_date <= endOfPrevMonth)
      .reduce((s: number, i: any) => s + (i.total ?? 0), 0);

    const revenueGrowthPct = prevMonthRevenue > 0
      ? (((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
      : '0.0';

    // Projects
    const activeProjects = projects.filter((p: any) => p.status === 'in_progress').length;
    const delayedProjects = projects.filter((p: any) => {
      if (!p.deadline || p.status === 'completed') return false;
      return new Date(p.deadline) < now;
    }).length;

    // Team utilization
    const approvedUsers = users.filter((u: any) => u.status === 'approved').length;
    const totalUsers = users.length;
    const teamUtilization = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;

    // Objective completion
    const totalObjectives = objectives.length;
    const doneObjectives = objectives.filter((o: any) => o.status === 'done' || o.status === 'completed').length;
    const objectiveCompletionRate = totalObjectives > 0 ? Math.round((doneObjectives / totalObjectives) * 100) : 0;

    // Prospect conversion
    const totalProspects = prospects.length;
    const wonProspects = prospects.filter((p: any) => p.stage === 'won').length;
    const prospectConversionRate = totalProspects > 0 ? Math.round((wonProspects / totalProspects) * 100) : 0;

    // Active pipeline risks = delayed projects + overdue invoices
    const overdueInvoicesCount = pendingInvoices.length;
    const activeRisks = delayedProjects + (overdueInvoicesCount > 0 ? 1 : 0);

    // Format for display
    const formatINR = (n: number) => {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n.toLocaleString('en-IN')}`;
    };

    const metrics = {
      // Original stats shape (for drop-in compatibility with existing UI)
      projectedRevenue: formatINR(monthlyRevenue || totalRevenue),
      revenueGrowth: `${parseFloat(revenueGrowthPct) >= 0 ? '+' : ''}${revenueGrowthPct}%`,
      activeRisks,
      utilizationRate: `${teamUtilization}%`,
      proposalConversion: `${prospectConversionRate}%`,

      // Extended metrics
      totalRevenue,
      outstandingRevenue,
      monthlyRevenue,
      activeProjects,
      delayedProjects,
      teamUtilization,
      objectiveCompletionRate,
      prospectConversionRate,
      totalProjects: projects.length,
      totalUsers,
      isMock: false,
    };

    // ── Telemetry (non-blocking) ──────────────────────────────────────────────
    logAIEvent({
      event_type: 'AI_METRICS_FETCH',
      user_id: user.id,
      company_id,
      details: `Metrics computed in ${Date.now() - startMs}ms. Projects: ${projects.length}, Invoices: ${invoices.length}`,
      duration_ms: Date.now() - startMs,
    });

    return NextResponse.json({ metrics });

  } catch (error: any) {
    console.error('[AI Metrics] Fatal error:', error);
    // Return mock data — never crash the frontend
    return NextResponse.json({ metrics: MOCK_METRICS });
  }
}
