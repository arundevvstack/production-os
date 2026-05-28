import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FinancialEngine } from '@/lib/financial-engine';
import { AIRouter } from '@/lib/ai-router';

const prisma = new PrismaClient();

// In production, this would be triggered by a Cron job or a Redis worker polling loop.
// For Next.js on Vercel, this is typically called via Vercel Cron.

export async function POST(req: Request) {
  try {
    // Basic shared-secret auth for cron jobs
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch highest priority queued job
    const job = await prisma.distributedJobQueue.findFirst({
      where: { status: 'queued' },
      orderBy: [
        { priority: 'desc' },
        { started_at: 'asc' } // Oldest first within same priority
      ]
    });

    if (!job) {
      return NextResponse.json({ success: true, message: 'No jobs in queue' });
    }

    // 2. Lock the job
    await prisma.distributedJobQueue.update({
      where: { id: job.id },
      data: { status: 'processing', started_at: new Date() }
    });

    const payload: any = job.payload;

    try {
      // 3. Process based on Event Type
      switch (job.job_type) {
        case 'STAGE_TRANSITIONED':
          // Auto-recalculate budgets and update health scores async
          if (payload.projectId) {
            await FinancialEngine.recalculateProjectBudget(payload.projectId);
            // Optionally call HealthEngine here
          }
          break;

        case 'AI_RENDER_FAILED':
          // Auto-remediation logic
          console.log("Triggering auto-remediation for failed AI Job", payload.jobId);
          break;

        case 'ASSET_UPLOADED':
          // Trigger vision tagging API asynchronously
          break;

        default:
          console.log(`Unknown job type ${job.job_type}, acknowledging anyway.`);
      }

      // 4. Mark Complete
      await prisma.distributedJobQueue.update({
        where: { id: job.id },
        data: { status: 'completed', completed_at: new Date() }
      });

      return NextResponse.json({ success: true, processedJobId: job.id });

    } catch (processError: any) {
      // 5. Mark Failed
      await prisma.distributedJobQueue.update({
        where: { id: job.id },
        data: { status: 'failed', error_log: processError.message, completed_at: new Date() }
      });
      return NextResponse.json({ error: processError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Worker Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process queue" }, { status: 500 });
  }
}
