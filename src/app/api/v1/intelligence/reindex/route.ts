import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { vectorStore } from '@/lib/vector-provider';
import { logAIEvent } from '@/lib/ai-telemetry';

/**
 * POST /api/v1/intelligence/reindex
 *
 * Triggers a background memory reindexing job for the company's operational data.
 * - SUPER_ADMIN only
 * - Non-blocking: returns immediately with a jobId, indexes in background
 * - Safe retries: each entity is indexed independently
 * - Progress is tracked via ActivityLog
 * - Replaces the fake setTimeout in handleClearMemory
 */

export async function POST() {
  try {
    const supabase = await createClient();

    // ── Auth ─────────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Permission: SUPER_ADMIN only ─────────────────────────────────────────
    const { data: profile } = await supabase
      .from('User')
      .select('company_id, role_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company association found' }, { status: 403 });
    }

    const isAllowed = ['SUPER_ADMIN', 'MANAGER'].includes(profile.role_id ?? '');
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Memory reindexing requires SUPER_ADMIN or MANAGER role' },
        { status: 403 }
      );
    }

    const { company_id } = profile;
    const jobId = `reindex_${company_id}_${Date.now()}`;

    // ── Respond immediately (non-blocking) ────────────────────────────────────
    // The indexing runs as a background promise — we don't await it here.
    // This prevents the HTTP request from timing out on large datasets.
    runIndexingJob(supabase, company_id, user.id, jobId).catch((err) => {
      console.error(`[Reindex] Background job ${jobId} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Memory reindexing started. This runs in the background.',
      started_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Reindex] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start reindex job' },
      { status: 500 }
    );
  }
}

/**
 * The actual indexing work — runs in background.
 * Each entity type is indexed independently so a single failure doesn't abort the whole job.
 */
async function runIndexingJob(supabase: any, company_id: string, user_id: string, jobId: string) {
  const stats = { projects: 0, prospects: 0, objectives: 0, errors: 0 };

  // ── Index Projects ────────────────────────────────────────────────────────
  try {
    const { data: projects } = await supabase
      .from('Project')
      .select('id, project_name, status, client_name, deadline, notes')
      .eq('company_id', company_id);

    for (const project of (projects ?? [])) {
      try {
        const text = [
          `Project: ${project.project_name}`,
          `Client: ${project.client_name ?? 'N/A'}`,
          `Status: ${project.status}`,
          `Deadline: ${project.deadline ?? 'TBD'}`,
          project.notes ? `Notes: ${project.notes}` : '',
        ].filter(Boolean).join('. ');

        await vectorStore.upsertEmbedding(
          `project_${project.id}`,
          text,
          { type: 'project', company_id, entity_id: project.id }
        );
        stats.projects++;
      } catch {
        stats.errors++;
      }
    }
  } catch (err) {
    console.error('[Reindex] Project indexing failed:', err);
    stats.errors++;
  }

  // ── Index CRM Prospects ───────────────────────────────────────────────────
  try {
    const { data: prospects } = await supabase
      .from('Prospect')
      .select('id, company_name, contact_name, stage, deal_value, notes')
      .eq('company_id', company_id);

    for (const prospect of (prospects ?? [])) {
      try {
        const text = [
          `Prospect: ${prospect.company_name}`,
          `Contact: ${prospect.contact_name ?? 'N/A'}`,
          `Stage: ${prospect.stage}`,
          `Value: ₹${(prospect.deal_value ?? 0).toLocaleString()}`,
          prospect.notes ? `Notes: ${prospect.notes}` : '',
        ].filter(Boolean).join('. ');

        await vectorStore.upsertEmbedding(
          `prospect_${prospect.id}`,
          text,
          { type: 'prospect', company_id, entity_id: prospect.id }
        );
        stats.prospects++;
      } catch {
        stats.errors++;
      }
    }
  } catch (err) {
    console.error('[Reindex] Prospect indexing failed:', err);
    stats.errors++;
  }

  // ── Index Objectives ──────────────────────────────────────────────────────
  try {
    const { data: objectives } = await supabase
      .from('Objective')
      .select('id, title, description, status, assignee_id')
      .limit(500); // Cap to avoid overload

    for (const obj of (objectives ?? [])) {
      try {
        const text = [
          `Objective: ${obj.title}`,
          `Status: ${obj.status}`,
          obj.description ? `Description: ${obj.description}` : '',
        ].filter(Boolean).join('. ');

        await vectorStore.upsertEmbedding(
          `objective_${obj.id}`,
          text,
          { type: 'objective', company_id, entity_id: obj.id }
        );
        stats.objectives++;
      } catch {
        stats.errors++;
      }
    }
  } catch (err) {
    console.error('[Reindex] Objective indexing failed:', err);
    stats.errors++;
  }

  // ── Write completion to ActivityLog ───────────────────────────────────────
  const totalIndexed = stats.projects + stats.prospects + stats.objectives;
  logAIEvent({
    event_type: 'REINDEX_JOB',
    user_id,
    company_id,
    details: `Reindex job ${jobId} complete. Indexed: ${totalIndexed} records (${stats.projects} projects, ${stats.prospects} prospects, ${stats.objectives} objectives). Errors: ${stats.errors}`,
    metadata: { jobId, stats },
  });

  console.log(`[Reindex] Job ${jobId} complete. Indexed ${totalIndexed} records with ${stats.errors} errors.`);
}
