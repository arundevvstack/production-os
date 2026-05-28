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

    // 2. SELF-HEALING: Circuit Breaker & Failover Logic (PHASE 6)
    // Check if the requested provider is currently experiencing issues.
    const recentIncidents = await prisma.infrastructureIncident.findMany({
        where: { 
            component: `AI_PROVIDER_${payload.provider.toUpperCase()}`, 
            resolved: false,
            timestamp: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
        }
    });

    let activeProvider = payload.provider;
    let activeModel = payload.model;

    if (recentIncidents.length >= 3) {
        console.warn(`[AIRouter] Circuit breaker tripped for ${payload.provider}. Falling back to OpenAI.`);
        activeProvider = 'OpenAI';
        activeModel = 'dall-e-3';
        
        // Log telemetry for the failover
        if (project?.company_id) {
            await prisma.operationalTelemetry.create({
                data: {
                    company_id: project.company_id,
                    metric_type: 'AI_PROVIDER_FAILOVER',
                    metric_value: 1,
                    context: { original: payload.provider, fallback: activeProvider }
                }
            });
        }
    }

    try {
      const startMs = Date.now();
      let resultUrls: string[] = [];
      let costCredits = 0;

      console.log(`[AIRouter] Simulating generation via ${activeProvider} / ${activeModel}...`);
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulate random failure (for testing the self-healing incident engine)
      if (Math.random() < 0.05) { // 5% chance of failure
          throw new Error(`Simulated upstream API timeout for ${activeProvider}`);
      }

      // Route to specific provider (Mocked API calls for now)
      switch (activeProvider) {
        case 'OpenAI':
          resultUrls = ['https://placeholder.co/generated-openai-img.png'];
          costCredits = 0.04;
          break;
        case 'Runway':
          resultUrls = ['https://placeholder.co/generated-runway-vid.mp4'];
          costCredits = 0.50;
          break;
        case 'Midjourney':
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

      // (Phase 6) Log Infrastructure Incident if it's a provider timeout
      if (error.message.includes('timeout')) {
          await prisma.infrastructureIncident.create({
              data: {
                  component: `AI_PROVIDER_${activeProvider.toUpperCase()}`,
                  error_message: error.message,
                  severity: 'HIGH'
              }
          });
      }

      // Optionally trigger an AutomationRule for 'RENDER_FAILED' here.
      throw error;
    }
  }
}
