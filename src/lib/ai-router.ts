import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AIRequestPayload {
  projectId: string;
  provider: 'OpenAI' | 'Runway' | 'Midjourney' | 'Kling';
  model: string;
  prompt: string;
}

export class AIRouter {
  /**
   * Dispatches an AI generation task to the selected provider, tracks the cost,
   * and records the outcome in the AIGenerationJob ledger for financial tracking.
   */
  static async dispatchJob(payload: AIRequestPayload) {
    // 0. AI Governance & Cost Control Check (PHASE 5)
    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
      include: { 
        company: { include: { tenant_subscription: true } }
      }
    });

    if (project?.company?.tenant_subscription) {
      const sub = project.company.tenant_subscription;
      
      // Calculate total AI usage for this company in the current billing period
      const currentUsageJobs = await prisma.aIGenerationJob.aggregate({
        where: {
          project: { company_id: project.company_id },
          status: 'completed',
          created_at: { gte: sub.current_period_end ? new Date(sub.current_period_end.getTime() - 30 * 24 * 60 * 60 * 1000) : new Date(0) }
        },
        _sum: { cost_credits: true }
      });

      const totalUsage = currentUsageJobs._sum.cost_credits || 0;

      // Hard cap: If total usage exceeds their tier limit, block AI generation
      if (totalUsage >= sub.ai_usage_limit) {
        throw new Error('AI Generation blocked: Workspace AI budget limit exceeded (Payment Required).');
      }
    }

    // 1. Create Job Entry
    const job = await prisma.aIGenerationJob.create({
      data: {
        project_id: payload.projectId,
        provider: payload.provider,
        model: payload.model,
        prompt: payload.prompt,
        status: 'processing'
      }
    });

    try {
      const startMs = Date.now();
      let resultUrls: string[] = [];
      let costCredits = 0;

      // 2. Route to specific provider (Mocked API calls for now)
      switch (payload.provider) {
        case 'OpenAI':
          // const res = await openai.images.generate({ model: payload.model, prompt: payload.prompt });
          // resultUrls = [res.data[0].url];
          resultUrls = ['https://placeholder.co/generated-openai-img.png'];
          costCredits = 0.04;
          break;
        case 'Runway':
          // const res = await fetch('https://api.runwayml.com/v1/generate', ...);
          resultUrls = ['https://placeholder.co/generated-runway-vid.mp4'];
          costCredits = 0.50;
          break;
        case 'Midjourney':
          // (Via third-party API wrapper since MJ has no official API)
          resultUrls = ['https://placeholder.co/generated-mj-img.png'];
          costCredits = 0.05;
          break;
        case 'Kling':
          resultUrls = ['https://placeholder.co/generated-kling-vid.mp4'];
          costCredits = 0.60;
          break;
        default:
          throw new Error('Unsupported AI Provider');
      }

      const computeTimeMs = Date.now() - startMs;

      // 3. Update Job with Success
      return await prisma.aIGenerationJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          result_urls: resultUrls,
          cost_credits: costCredits,
          compute_time_ms: computeTimeMs
        }
      });

    } catch (error: any) {
      // 4. Update Job with Failure
      await prisma.aIGenerationJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error_log: error.message
        }
      });

      // Optionally trigger an AutomationRule for 'RENDER_FAILED' here.
      throw error;
    }
  }
}
