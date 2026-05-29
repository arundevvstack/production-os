'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiscoverLeadsInputSchema = z.object({
  industry: z.string().describe('The target industry to scan for leads.'),
  region: z.string().describe('The target geographic region or market.'),
});
export type DiscoverLeadsInput = z.infer<typeof DiscoverLeadsInputSchema>;

const LeadSchema = z.object({
  company_name: z.string(),
  industry: z.string(),
  website: z.string().optional(),
  marketing_quality: z.string(),
  brand_quality: z.string(),
  services_needed: z.string(),
  growth_potential: z.string(),
  estimated_budget: z.number(),
  ai_readiness: z.number().int().min(0).max(100),
  opportunity_score: z.number().int().min(0).max(100),
  score_label: z.string(),
  weaknesses: z.array(z.string()).optional(),
});

const DiscoverLeadsOutputSchema = z.object({
  leads: z.array(LeadSchema).describe('A list of discovered high-potential market leads.'),
  trends: z.array(z.object({
    title: z.string(),
    source: z.string(),
    velocity_score: z.number(),
    viral_format: z.string(),
    upcoming_prediction: z.string(),
  })).describe('Current market trends related to this industry.'),
  gaps: z.array(z.object({
    gap_description: z.string(),
    severity: z.string(),
    ad_style: z.string(),
    impact_score: z.number(),
  })).describe('Identified market gaps or opportunities for production services.'),
});
export type DiscoverLeadsOutput = z.infer<typeof DiscoverLeadsOutputSchema>;

function generateMockLeads(input: DiscoverLeadsInput): DiscoverLeadsOutput {
  return {
    leads: [
      {
        company_name: `Apex ${input.industry} Solutions`,
        industry: input.industry,
        website: 'www.apex-example.com',
        marketing_quality: 'Poor Video Presence',
        brand_quality: 'Outdated Logo, High Friction',
        services_needed: 'Cinematic Brand Film, UI/UX Overhaul',
        growth_potential: 'High Market Cap, Low Digital Authority',
        estimated_budget: 450000,
        ai_readiness: 85,
        opportunity_score: 92,
        score_label: 'Premium Opportunity',
        weaknesses: ['No vertical video', 'Slow website load time'],
      },
      {
        company_name: `NextGen ${input.industry} Regional`,
        industry: input.industry,
        website: 'www.nextgen-example.com',
        marketing_quality: 'Inconsistent Content',
        brand_quality: 'Average',
        services_needed: 'Monthly Retainer, AI SEO Content',
        growth_potential: 'Rapidly expanding to Tier 2 cities',
        estimated_budget: 150000,
        ai_readiness: 60,
        opportunity_score: 75,
        score_label: 'High Opportunity',
        weaknesses: ['No programmatic SEO', 'Zero CGI assets'],
      }
    ],
    trends: [
      {
        title: 'Shift to Immersive 3D',
        source: 'Instagram/TikTok',
        velocity_score: 95,
        viral_format: 'CGI Fake Out of Home Ads',
        upcoming_prediction: 'Brands will stop traditional shoots in favor of Unreal Engine renders.',
      }
    ],
    gaps: [
      {
        gap_description: 'Lack of localized vernacular video ads',
        severity: 'Critical',
        ad_style: 'Hyper-localized AI voice clones',
        impact_score: 98,
      }
    ]
  };
}

const discoverPrompt = ai.definePrompt({
  name: 'discoverMarketLeadsPrompt',
  input: { schema: DiscoverLeadsInputSchema },
  output: { schema: DiscoverLeadsOutputSchema },
  prompt: `You are an elite Market Research AI. Analyze the {{industry}} sector in the {{region}} market.
Your task is to identify 2-3 realistic fictional (or real if publicly known) target companies that would drastically benefit from high-end video production, CGI, or AI automation services.
Provide their estimated budgets, marketing weaknesses, and score them on opportunity.
Also identify 1-2 major industry trends and 1 critical market gap.
Format the output strictly as JSON matching the schema.`,
});

const discoverFlow = ai.defineFlow(
  {
    name: 'discoverMarketLeadsFlow',
    inputSchema: DiscoverLeadsInputSchema,
    outputSchema: DiscoverLeadsOutputSchema,
  },
  async (input) => {
    const { output } = await discoverPrompt(input);
    return output!;
  }
);

export async function discoverMarketLeads(input: DiscoverLeadsInput): Promise<DiscoverLeadsOutput> {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!hasKey) {
    console.warn("GEMINI_API_KEY not set. Using premium preview leads.");
    return generateMockLeads(input);
  }
  try {
    return await discoverFlow(input);
  } catch (error) {
    console.error("Discover flow failed:", error);
    return generateMockLeads(input);
  }
}
