import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { discoverMarketLeads } from '@/ai/flows/market-flows';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Profile & Role
    const { data: profile } = await supabase
      .from('User')
      .select('company_id, role_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company association found' }, { status: 403 });
    }

    const companyId = profile.company_id;

    // 3. Parse input
    const body = await request.json();
    const industry = body.industry || 'Digital Media';
    const region = body.region || 'Global';

    const jobId = `scan_${companyId}_${Date.now()}`;

    // 4. Run background job (non-blocking)
    runMarketScan(companyId, industry, region, jobId).catch((err) => {
      console.error(`[Market Scan] Background job ${jobId} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Market intelligence scan initiated. Results will populate shortly.',
    });
  } catch (error: any) {
    console.error('[Market Scan API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start market scan' },
      { status: 500 }
    );
  }
}

async function runMarketScan(companyId: string, industry: string, region: string, jobId: string) {
  try {
    console.log(`[Market Scan] Starting job ${jobId} for ${industry} in ${region}`);
    
    // 1. Trigger Genkit Flow
    const aiOutput = await discoverMarketLeads({ industry, region });

    // 2. Save Gaps
    for (const gap of aiOutput.gaps) {
      await prisma.marketOpportunity.create({
        data: {
          company_id: companyId,
          industry,
          region,
          gap_description: gap.gap_description,
          severity: gap.severity,
          ad_style: gap.ad_style,
          impact_score: gap.impact_score,
          status: 'open',
        }
      });
    }

    // 3. Save Trends
    for (const trend of aiOutput.trends) {
      await prisma.industryTrend.create({
        data: {
          company_id: companyId,
          title: trend.title,
          source: trend.source,
          velocity_score: trend.velocity_score,
          viral_format: trend.viral_format,
          upcoming_prediction: trend.upcoming_prediction,
        }
      });
    }

    // 4. Save Leads
    for (const lead of aiOutput.leads) {
      await prisma.marketLead.create({
        data: {
          company_id: companyId,
          company_name: lead.company_name,
          industry: lead.industry,
          website: lead.website,
          marketing_quality: lead.marketing_quality,
          brand_quality: lead.brand_quality,
          services_needed: lead.services_needed,
          growth_potential: lead.growth_potential,
          estimated_budget: lead.estimated_budget,
          ai_readiness: lead.ai_readiness,
          opportunity_score: lead.opportunity_score,
          score_label: lead.score_label,
          scores: {
            create: {
              revenue_potential: Math.floor(Math.random() * 100), // mock subscore
              ai_readiness: lead.ai_readiness,
              marketing_maturity: Math.floor(Math.random() * 100),
              urgency: Math.floor(Math.random() * 100),
              competition_score: Math.floor(Math.random() * 100),
              conversion_probability: lead.opportunity_score / 100,
              final_score: lead.opportunity_score,
            }
          }
        }
      });
    }

    // 5. Generate Alert
    await prisma.marketAlert.create({
      data: {
        company_id: companyId,
        type: 'lead',
        message: `Market scan complete: Discovered ${aiOutput.leads.length} new high-potential leads in ${industry}.`,
      }
    });

    console.log(`[Market Scan] Job ${jobId} complete.`);
  } catch (err) {
    console.error(`[Market Scan] Job ${jobId} execution error:`, err);
    // Generate failure alert
    await prisma.marketAlert.create({
      data: {
        company_id: companyId,
        type: 'gap',
        message: `Market scan failed due to an error. Please try again.`,
      }
    });
  }
}
