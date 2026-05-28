import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Note: In production this would be triggered via a cron job, BullMQ worker, 
// or an AWS EventBridge target rather than a public HTTP endpoint without auth.
// We secure it with an internal API token for now.

const prisma = new PrismaClient();
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
    }

    // 1. Fetch pending items
    const pendingJobs = await prisma.notificationQueue.findMany({
      where: {
        status: 'pending',
        scheduled_at: { lte: new Date() }
      },
      take: 50 // Batch process
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    // 2. Process each job
    const results = [];
    for (const job of pendingJobs) {
      try {
        // Mark as processing
        await prisma.notificationQueue.update({
          where: { id: job.id },
          data: { status: 'processing' }
        });

        // Simulate sending based on channel
        console.log(`Processing job ${job.id} for channel ${job.channel}`);
        // let success = false;
        // if (job.channel === 'EMAIL') { success = await sendEmail(job.payload); }
        // else if (job.channel === 'WHATSAPP') { success = await sendWhatsApp(job.payload); }

        // We assume success for now
        await prisma.notificationQueue.update({
          where: { id: job.id },
          data: { status: 'sent', sent_at: new Date() }
        });

        results.push({ id: job.id, status: 'success' });
      } catch (err: any) {
        // Handle failure and retry logic
        console.error(`Job ${job.id} failed:`, err);
        const retryCount = job.retry_count + 1;
        const newStatus = retryCount > 3 ? 'failed' : 'pending';

        await prisma.notificationQueue.update({
          where: { id: job.id },
          data: {
            status: newStatus,
            retry_count: retryCount,
            scheduled_at: new Date(Date.now() + retryCount * 5 * 60000) // Exponential backoff
          }
        });

        results.push({ id: job.id, status: newStatus, error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: pendingJobs.length, results });

  } catch (error: any) {
    console.error("Queue Processor Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process queue" }, { status: 500 });
  }
}
