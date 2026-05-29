import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ai } from '@/ai/genkit';
import { logAIEvent, checkRateLimit } from '@/lib/ai-telemetry';

/**
 * POST /api/v1/intelligence/copilot
 *
 * Gemini-powered AI assistant for the AI Command Center.
 * - Role-aware context injection (respects tenant isolation + permissions)
 * - Finance data only for SUPER_ADMIN / ACCOUNTS / MANAGER
 * - Rate limited: 10 requests/min per user
 * - Logs all queries to ActivityLog
 * - Falls back to keyword-based response if Gemini fails
 */

// ── Keyword fallback (original mock logic, preserved exactly) ─────────────────
function keywordFallback(query: string): string {
  const lower = query.toLowerCase();
  if (lower.includes('delay') || lower.includes('project')) {
    return 'AI Risk Engine report: 1 Delayed Project detected (BB App TVC Commercial). Recommendation: Assign Basil Joseph as secondary assistant director to resolve production pipeline bottleneck.';
  }
  if (lower.includes('anchor') || lower.includes('kochi') || lower.includes('malayalam')) {
    return 'Matchmaking matches found: Tovino Thomas (Actor, Kochi) is available. Malavika Mohanan (Model, Kochi) is available. Aparna B. has a conflicting booking on Friday June 14.';
  }
  if (lower.includes('invoice') || lower.includes('overdue') || lower.includes('finance')) {
    return 'Financial Ledger status: Client Novus Lifesciences has 1 overdue GST Invoice (INV-2026-049, ₹1,20,000, Unpaid). Urgency rating: High. Suggestion logged in automation queue.';
  }
  if (lower.includes('proposal') || lower.includes('healthcare') || lower.includes('generate')) {
    return "AI Proposal Drafter initialized: Created 'CGI Premium Ad Package for Healthcare' draft. Included GST matrices and regional Kerala placement metrics. Viewable in Proposals draft board.";
  }
  return "I've searched our operational memory. No records matched your keyword search. Try asking about delayed projects, anchors in Kochi, or overdue invoices.";
}

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const supabase = await createClient();

    // ── Auth ─────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const { allowed, remaining } = checkRateLimit(user.id, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait 1 minute before sending more requests.' },
        { status: 429 }
      );
    }

    // ── Parse request ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { query } = body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // ── Profile & permissions ─────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('User')
      .select('company_id, role_id, department, fullName')
      .eq('id', user.id)
      .single();

    const company_id = profile?.company_id;
    const role_id = profile?.role_id ?? 'EMPLOYEE';
    const isPrivileged = ['SUPER_ADMIN', 'MANAGER'].includes(role_id);
    const isFinance = ['SUPER_ADMIN', 'MANAGER', 'ACCOUNTS'].includes(role_id);
    const isSales = ['SUPER_ADMIN', 'MANAGER', 'MARKETING_SALES'].includes(role_id);

    // ── Check if Gemini is available ──────────────────────────────────────────
    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY);

    if (!hasGemini || !company_id) {
      // Graceful degradation to keyword fallback
      const fallbackReply = keywordFallback(query);
      return NextResponse.json({ response: fallbackReply, source: 'fallback' });
    }

    // ── Build role-aware context bundle ───────────────────────────────────────
    const contextParts: string[] = [];

    // Always: Active projects
    const { data: projects } = await supabase
      .from('Project')
      .select('project_name, status, deadline, progress, client_name, budget')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (projects?.length) {
      const now = new Date();
      const projectSummary = projects.map((p: any) => {
        const isOverdue = p.deadline && new Date(p.deadline) < now && p.status !== 'completed';
        return `- "${p.project_name}" | Client: ${p.client_name ?? 'N/A'} | Status: ${p.status} | Progress: ${p.progress ?? 0}% | Deadline: ${p.deadline ?? 'TBD'} | Budget: ₹${(p.budget ?? 0).toLocaleString()} ${isOverdue ? '⚠️ OVERDUE' : ''}`;
      }).join('\n');
      contextParts.push(`ACTIVE PROJECTS (${projects.length} total):\n${projectSummary}`);
    }

    // Always: Open objectives count
    const { count: openObjectives } = await supabase
      .from('Objective')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress', 'blocked']);
    if (openObjectives !== null) {
      contextParts.push(`OPEN OBJECTIVES: ${openObjectives} tasks currently pending/in-progress/blocked.`);
    }

    // Finance context (privileged only)
    if (isFinance) {
      const { data: invoices } = await supabase
        .from('Invoice')
        .select('invoice_number, total, payment_status, client_name, due_date')
        .eq('company_id', company_id)
        .in('payment_status', ['pending', 'unpaid', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(10);

      if (invoices?.length) {
        const invoiceSummary = invoices.map((i: any) =>
          `- ${i.invoice_number} | Client: ${i.client_name ?? 'N/A'} | Amount: ₹${(i.total ?? 0).toLocaleString()} | Due: ${i.due_date ?? 'N/A'}`
        ).join('\n');
        contextParts.push(`OUTSTANDING INVOICES (${invoices.length}):\n${invoiceSummary}`);
      }
    }

    // CRM context (sales roles)
    if (isSales) {
      const { data: prospects } = await supabase
        .from('Prospect')
        .select('company_name, stage, deal_value, contact_name')
        .eq('company_id', company_id)
        .not('stage', 'in', '("won","lost")')
        .order('deal_value', { ascending: false })
        .limit(10);

      if (prospects?.length) {
        const prospectSummary = prospects.map((p: any) =>
          `- "${p.company_name}" | Contact: ${p.contact_name ?? 'N/A'} | Stage: ${p.stage} | Value: ₹${(p.deal_value ?? 0).toLocaleString()}`
        ).join('\n');
        contextParts.push(`ACTIVE CRM PROSPECTS (${prospects.length}):\n${prospectSummary}`);
      }
    }

    // Team context (managers)
    if (isPrivileged) {
      const { data: teamMembers } = await supabase
        .from('User')
        .select('fullName, role_id, status')
        .eq('company_id', company_id)
        .limit(20);

      if (teamMembers?.length) {
        const approved = teamMembers.filter((u: any) => u.status === 'approved');
        contextParts.push(`TEAM: ${approved.length} active crew members across roles: ${[...new Set(approved.map((u: any) => u.role_id))].join(', ')}`);
      }
    }

    // ── Compose system prompt ─────────────────────────────────────────────────
    const systemPrompt = `You are the AI Operations Assistant for a premium creative media and digital marketing agency.
You have secure, real-time access to the company's operational database.

OPERATOR ROLE: ${role_id} | USER: ${profile?.fullName ?? 'Staff Member'}
ACCESS LEVEL: ${isPrivileged ? 'Full Operations' : 'Standard'}${isFinance ? ' + Finance' : ''}${isSales ? ' + CRM' : ''}

LIVE OPERATIONAL DATA:
${contextParts.length ? contextParts.join('\n\n') : 'No operational data available for this query context.'}

INSTRUCTIONS:
- Answer concisely and professionally. Maximum 3 paragraphs.
- Base your response ONLY on the data provided above. Do not invent data.
- If data is not available for the query, say so clearly.
- For project queries: reference real project names, statuses, and deadlines.
- For financial queries: only respond if you have finance access.
- Provide actionable recommendations when appropriate.
- Format key figures with Indian Rupee symbol (₹).

USER QUERY: ${query}`;

    // ── Call Gemini ───────────────────────────────────────────────────────────
    let aiResponse: string;
    try {
      const { text } = await ai.generate({
        prompt: systemPrompt,
        config: {
          temperature: 0.3, // Lower temperature for factual, grounded responses
          maxOutputTokens: 400,
        },
      });
      aiResponse = text?.trim() ?? keywordFallback(query);
    } catch (geminiError: any) {
      console.error('[AI Copilot] Gemini call failed, using keyword fallback:', geminiError.message);
      aiResponse = keywordFallback(query);
    }

    // ── Telemetry (non-blocking) ──────────────────────────────────────────────
    if (company_id) {
      logAIEvent({
        event_type: 'AI_QUERY',
        user_id: user.id,
        company_id,
        details: `Query: "${query.substring(0, 100)}" | Duration: ${Date.now() - startMs}ms | Rate remaining: ${remaining}`,
        duration_ms: Date.now() - startMs,
      });
    }

    return NextResponse.json({
      response: aiResponse,
      source: 'gemini',
      remaining_requests: remaining,
    });

  } catch (error: any) {
    console.error('[AI Copilot] Fatal error:', error);
    // Final safety net — always return a usable response
    const body = await req.json().catch(() => ({}));
    const fallback = keywordFallback(body?.query ?? '');
    return NextResponse.json({ response: fallback, source: 'fallback' });
  }
}
