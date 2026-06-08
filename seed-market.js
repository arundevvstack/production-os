const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '4cacb0ff-dd13-4e18-becf-6db843ae178c';

  // Insert Market Opportunity
  await prisma.marketOpportunity.create({
    data: {
      company_id: companyId,
      industry: 'Healthcare',
      region: 'Kerala',
      gap_description: 'Outdated local clinic advertising on Instagram with low quality graphics.',
      severity: 'Critical',
      ad_style: 'Static Image',
      ai_readiness: 85,
      impact_score: 92,
      status: 'open'
    }
  });

  // Insert Market Lead
  await prisma.marketLead.create({
    data: {
      company_id: companyId,
      company_name: 'Kerala Wellness Center',
      industry: 'Healthcare',
      website: 'https://example.com',
      instagram: '@keralawellness',
      marketing_quality: 'Poor',
      brand_quality: 'Medium',
      services_needed: 'AI Video Ads, Social Media Management',
      growth_potential: 'High',
      estimated_budget: 150000,
      ai_readiness: 85,
      opportunity_score: 92,
      score_label: 'Premium Opportunity',
      scores: {
        create: {
          revenue_potential: 80,
          ai_readiness: 85,
          marketing_maturity: 30,
          urgency: 90,
          competition_score: 40,
          conversion_probability: 0.92,
          final_score: 92
        }
      }
    }
  });

  await prisma.marketLead.create({
    data: {
      company_id: companyId,
      company_name: 'Cochin Tech Solutions',
      industry: 'IT Services',
      website: 'https://cochintech.example.com',
      marketing_quality: 'Average',
      brand_quality: 'High',
      services_needed: 'Corporate Film, Brand Strategy',
      growth_potential: 'High',
      estimated_budget: 350000,
      ai_readiness: 60,
      opportunity_score: 78,
      score_label: 'High',
      scores: {
        create: {
          revenue_potential: 90,
          ai_readiness: 60,
          marketing_maturity: 50,
          urgency: 70,
          competition_score: 60,
          conversion_probability: 0.78,
          final_score: 78
        }
      }
    }
  });

  // Insert Competitor
  await prisma.competitor.create({
    data: {
      company_id: companyId,
      brand_name: 'Agency X',
      campaigns_count: 12,
      video_style: 'Cinematic',
      ai_usage: 'Low',
      activities: {
        create: [
          {
            activity_type: 'Campaign Launch',
            description: 'Launched a new healthcare ad campaign.',
            impact: 'High'
          }
        ]
      }
    }
  });

  // Insert Trend
  await prisma.industryTrend.create({
    data: {
      company_id: companyId,
      title: 'AI Generated Walkthroughs',
      source: 'Instagram Reels',
      velocity_score: 95,
      viral_format: 'Before/After Transitions',
      upcoming_prediction: 'Real Estate agencies will adopt this rapidly.'
    }
  });

  // Insert Alert
  await prisma.marketAlert.create({
    data: {
      company_id: companyId,
      type: 'gap',
      message: 'Critical market gap detected in Kerala Healthcare sector.'
    }
  });

  console.log('Seeded data successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
