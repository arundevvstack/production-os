import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logAIEvent } from '@/lib/ai-telemetry';

/**
 * POST /api/v1/intelligence/automations/execute
 *
 * Executes AI-suggested automation actions after human approval.
 * All actions are server-side, permission-validated, and audit-logged.
 * Supports rollback via error handling — no partial state on failure.
 *
 * Supported action_types:
 *   SEND_INVOICE_REMINDER  — Queue email notification for overdue invoice
 *   ASSIGN_TALENT          — Update Objective assignee
 *   GENERATE_PROPOSAL      — Create draft Proposal record in DB
 *   UPDATE_PROJECT_STATUS  — Update Project status field
 *   NOTIFY_TEAM            — Insert into NotificationQueue
 */

type ActionType =
  | 'SEND_INVOICE_REMINDER'
  | 'ASSIGN_TALENT'
  | 'GENERATE_PROPOSAL'
  | 'UPDATE_PROJECT_STATUS'
  | 'NOTIFY_TEAM';

interface AutomationRequest {
  automation_id: string;
  action_type: ActionType;
  payload?: Record<string, any>;
  description: string;
}

// Roles permitted to execute automations
const PERMITTED_ROLES = ['SUPER_ADMIN', 'MANAGER'];

export async function POST(req: Request) {
  const startMs = Date.now();

  try {
    const supabase = await createClient();

    // ── Auth ─────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Profile + permission check ────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('User')
      .select('company_id, role_id, fullName')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
    }

    if (!PERMITTED_ROLES.includes(profile.role_id ?? '')) {
      return NextResponse.json(
        { error: `Insufficient permissions. Role '${profile.role_id}' cannot execute automations.` },
        { status: 403 }
      );
    }

    const { company_id } = profile;

    // ── Parse request ─────────────────────────────────────────────────────────
    const body: AutomationRequest = await req.json();
    const { automation_id, action_type, payload = {}, description } = body;

    if (!automation_id || !action_type) {
      return NextResponse.json({ error: 'Missing automation_id or action_type' }, { status: 400 });
    }

    // ── Execute action ────────────────────────────────────────────────────────
    let result: Record<string, any> = {};

    switch (action_type) {
      case 'SEND_INVOICE_REMINDER': {
        // Queue an email notification for overdue invoice
        const { error } = await supabase.from('NotificationQueue').insert({
          company_id,
          channel: 'EMAIL',
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          payload: {
            type: 'INVOICE_REMINDER',
            invoice_id: payload.invoice_id ?? null,
            client_name: payload.client_name ?? 'Client',
            amount: payload.amount ?? 0,
            triggered_by: user.id,
            message: description,
          },
          retry_count: 0,
        });
        if (error) throw new Error(`Failed to queue reminder: ${error.message}`);
        result = { queued: true, channel: 'EMAIL' };
        break;
      }

      case 'ASSIGN_TALENT': {
        // Update Objective assignee — requires objective_id and assignee_id in payload
        if (!payload.objective_id || !payload.assignee_id) {
          // Graceful: if no specific IDs provided, log intent only
          result = { assigned: false, note: 'No specific objective/assignee provided — action logged as intent.' };
        } else {
          const { error } = await supabase
            .from('Objective')
            .update({ assignee_id: payload.assignee_id })
            .eq('id', payload.objective_id)
            .eq('company_id', company_id); // Tenant isolation enforced
          if (error) throw new Error(`Failed to assign talent: ${error.message}`);
          result = { assigned: true, objective_id: payload.objective_id };
        }
        break;
      }

      case 'GENERATE_PROPOSAL': {
        // Create a draft Proposal record
        const { data: proposal, error } = await supabase.from('Proposal').insert({
          company_id,
          title: payload.title ?? `AI-Generated Proposal — ${new Date().toLocaleDateString()}`,
          status: 'draft',
          created_by: user.id,
          notes: description,
          service_category: payload.service_category ?? 'General',
          client_name: payload.client_name ?? null,
        }).select().single();
        if (error) throw new Error(`Failed to create proposal: ${error.message}`);
        result = { created: true, proposal_id: proposal?.id };
        break;
      }

      case 'UPDATE_PROJECT_STATUS': {
        if (!payload.project_id || !payload.status) {
          result = { updated: false, note: 'No project_id or status provided — action logged as intent.' };
        } else {
          const validStatuses = ['in_progress', 'on_hold', 'completed', 'cancelled'];
          if (!validStatuses.includes(payload.status)) {
            return NextResponse.json({ error: `Invalid status '${payload.status}'` }, { status: 400 });
          }
          const { error } = await supabase
            .from('Project')
            .update({ status: payload.status })
            .eq('id', payload.project_id)
            .eq('company_id', company_id);
          if (error) throw new Error(`Failed to update project: ${error.message}`);
          result = { updated: true, project_id: payload.project_id, new_status: payload.status };
        }
        break;
      }

      case 'NOTIFY_TEAM': {
        const { error } = await supabase.from('NotificationQueue').insert({
          company_id,
          channel: 'IN_APP',
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          payload: {
            type: 'TEAM_NOTIFICATION',
            message: description,
            triggered_by: user.id,
          },
          retry_count: 0,
        });
        if (error) throw new Error(`Failed to queue notification: ${error.message}`);
        result = { notified: true };
        break;
      }

      default: {
        return NextResponse.json(
          { error: `Unsupported action_type: ${action_type}` },
          { status: 400 }
        );
      }
    }

    // ── Audit log (non-blocking) ──────────────────────────────────────────────
    logAIEvent({
      event_type: 'AUTOMATION_EXECUTE',
      user_id: user.id,
      company_id,
      details: `Executed: ${action_type} | Automation: ${automation_id} | "${description.substring(0, 100)}"`,
      duration_ms: Date.now() - startMs,
      metadata: { action_type, result },
    });

    return NextResponse.json({
      success: true,
      action_type,
      automation_id,
      result,
      executed_by: profile.fullName ?? user.id,
      executed_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Automation Execute] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Automation execution failed' },
      { status: 500 }
    );
  }
}
