'use server';
/**
 * @fileOverview AI Proposal Architect flow for generating high-premium sales proposals.
 * 
 * This flow performs a 5-step analysis:
 * 1. Project Understanding
 * 2. Market Research
 * 3. Proposal Structuring
 * 4. Content Generation
 * 5. Structured JSON Output
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProposalContentInputSchema = z.object({
  service_vertical: z.string().describe('The type of service, e.g., Brand Film, SEO, Social Media.'),
  client_type: z.string().describe('The industry or type of client business.'),
  location: z.string().describe('The geographical location of the client/project.'),
  project_description: z.string().describe('Detailed description of the project requirements.'),
  project_duration: z.string().describe('Estimated timeline for the project.'),
  target_market: z.string().describe('The specific audience the project aims to reach.'),
  budget: z.string().optional().describe('Budget range if provided.'),
});
export type GenerateProposalContentInput = z.infer<typeof GenerateProposalContentInputSchema>;

const GenerateProposalContentOutputSchema = z.object({
  proposal_title: z.string(),
  client: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string().describe('Professional agency-level markdown content for this section.'),
  })),
  isPreview: z.boolean().optional(),
});
export type GenerateProposalContentOutput = z.infer<typeof GenerateProposalContentOutputSchema>;

function generateMockProposal(input: GenerateProposalContentInput): GenerateProposalContentOutput {
  const service = input.service_vertical || "Premium Video Production & Digital Strategy";
  const client = input.client_type || "Corporate Partner";
  const desc = input.project_description || "High-end corporate campaigns and media assets";
  const target = input.target_market || "Global Audience";
  const location = input.location || "Metro Hub";
  
  return {
    proposal_title: `Strategic ${service} Campaign for ${client}`,
    client: client,
    isPreview: true,
    sections: [
      {
        title: "1. Cover Page",
        content: `# Strategic Campaign Proposal\n\n**PROJECT:** ${service}\n**PREPARED FOR:** ${client}\n**LOCATION:** ${location}\n**DATE:** ${new Date().toLocaleDateString()}\n\n---\n*CONFIDENTIALITY NOTICE: The information contained in this proposal is confidential and proprietary to Define Perspective. Any unauthorized review, use, disclosure, or distribution is prohibited.*`
      },
      {
        title: "2. Proposal Introduction",
        content: `Dear Team,\n\nWe are thrilled to present this comprehensive proposal for the **Strategic ${service}** campaign. At Define Perspective, we specialize in high-end cinematic execution, visual excellence, and ROI-driven marketing frameworks designed to capture market authority.\n\nOur analysis indicates a significant opportunity for your business to dominate the **${client}** landscape by leveraging a modern, multi-channel narrative campaign tailored for the **${target}** target demographic.`
      },
      {
        title: "3. Executive Summary",
        content: `### Objective\nTo position your brand as the absolute leader in the **${client}** industry by deploying high-impact creative media assets.\n\n### Strategy\n1. **High-Fidelity Cinema**: Capture audience attention through state-of-the-art camera craftsmanship.\n2. **Dynamic Distribution**: Optimize multi-channel delivery across social media and digital portals.\n3. **Search Engine Dominance**: Ensure all digital assets are highly indexable and citation-ready for modern AI answer engines.`
      },
      {
        title: "4. Client Business Overview",
        content: `Your business operates in the highly competitive **${client}** vertical. To successfully expand, you require a cohesive media voice that conveys trust, technological edge, and premium value. The current campaign targets: \n- **Vision**: ${desc}\n- **Market Position**: Premium Tier\n- **Primary Challenge**: Audience engagement and conversion velocity.`
      },
      {
        title: "5. Digital Presence Audit",
        content: `We conducted a thorough audit of your existing channels:\n- **Visual Identity**: Inconsistent across platforms; requires cinematic grade and unified typography.\n- **Search Authority**: High potential, but currently lacking specialized schemas and target landing page structures.\n- **Engagement Rates**: Average benchmark is 1.8%; our target framework aims for 4.5%+ through high-retention cinematic storytelling.`
      },
      {
        title: "6. Competitor Analysis",
        content: `### Competitor Benchmark Matrix\n\n| Parameter | Competitors | Target Strategy |\n|---|---|---|\n| Visual Premium | Medium | High (Cinematic Quality) |\n| Digital Reach | Broad | High-Intent Silo (Targeted Reach) |\n| Conversion Logic | Simple Form | Cinematic Interactive Modals |\n\nWe will bypass standard competitor noise by focusing on highly stylized, narrative-driven execution.`
      },
      {
        title: "7. Keyword & Search Opportunity",
        content: `Based on your service vertical **${service}**, we target high-conversion search intents including:\n- *"${service} near me"*\n- *"${client} luxury services"*\n- *"${client} strategic solutions"*\n\nAll video and page assets will be fully optimized with schema tags (VideoObject, Organization) to secure top-tier placements in Google AI Overviews and traditional SERPs.`
      },
      {
        title: "8. Strategic Framework",
        content: `Our proposed three-pillar operational framework:\n\n\`\`\`mermaid\ngraph TD\n  A[Creative Strategy] --> B[Cinematic Production]\n  B --> C[Performance Distribution]\n  C --> D[Revenue Conversion]\n\`\`\`\n\n1. **Pre-Production**: Scriptwriting, storyboarding, and custom mood boards.\n2. **Production**: Directed camera operation utilizing premier anamorphic optics.\n3. **Post-Production**: Cinematic color grading, sound design, and custom metadata tagging.`
      },
      {
        title: "9. 12-Month Marketing Roadmap",
        content: `- **Months 1-3**: Onboarding, keyword blueprinting, and core asset shoots.\n- **Months 4-6**: First-wave campaign release and target page activation.\n- **Months 7-9**: Analytics review, creative tuning, and micro-content scaling.\n- **Months 10-12**: Performance optimization and market share expansion.`
      },
      {
        title: "10. Media Production Plan",
        content: `### Logistics & Creative Details\n- **Camera Package**: Premium Digital Cinema Camera (Arri/RED) with High-Speed Prime Optics.\n- **Lighting Package**: Cinematic LED diffusion setup for high-fidelity skin tones.\n- **Audio Design**: Custom sound effects (SFX) and licensed orchestral orchestration.`
      },
      {
        title: "11. Digital Marketing Plan",
        content: `We will deploy your media assets across premium digital acquisition points:\n1. **Paid Acquisition**: High-impact video ads targeting luxury demographics.\n2. **Organic Engine**: Dynamic landing page clusters backed by robust semantic schemas.\n3. **Social Retargeting**: Micro-content and highlight clips designed for high viral velocity.`
      },
      {
        title: "12. Deliverables Summary",
        content: `- **1x Master Campaign Film** (2-3 Minutes, 4K Cinema Master)\n- **3x Social Cutdowns** (30-60 Seconds, 9:16 Vertical format)\n- **1x Semantic Landing Page** (Fully optimized with high-performance HSL theme)\n- **1x Schema Knowledge Graph Integration**`
      },
      {
        title: "13. KPI Targets",
        content: `- **Video View Rates**: >55% completion rate.\n- **Organic Impressions**: +120% YoY in target regions.\n- **Conversion Growth**: +35% increase in high-intent inbound leads.`
      },
      {
        title: "14. Budget Structure",
        content: `### Cost Estimation Breakdown\n\n| Phase | Allocation | Cost |\n|---|---|---|\n| Pre-Production | Creative Direction & Scripting | ₹75,000 |\n| Production | Studio Booking, Crew, Gear Package | ₹2,00,000 |\n| Post-Production | Editing, Color Grading, SFX | ₹75,000 |\n| **Total** | | **₹3,50,000** |\n\n*Optional add-ons are available for regional translation and localized target pages.*`
      },
      {
        title: "15. Expected ROI",
        content: `### Projected Yield Analysis\n- **Conservative**: 2.5x ROI within 6 months through direct conversions.\n- **Moderate**: 4.0x ROI within 12 months incorporating organic authority growth.\n- **Optimistic**: 6.0x+ ROI utilizing nationwide programmatic campaign duplication.`
      },
      {
        title: "16. Implementation Timeline",
        content: `- **Day 1-7**: Kickoff and script freeze.\n- **Day 8-14**: Shoot execution.\n- **Day 15-25**: First cut review & color grade.\n- **Day 30**: Final master delivery and campaign launch.`
      },
      {
        title: "17. Next Steps",
        content: `To activate this campaign and enlist the crew:\n1. **Approve Proposal**: Authorize this V1 draft document.\n2. **Kickoff Meeting**: Schedule the technical creative planning session.\n3. **Deposit Clearance**: Clear initial milestone billing (50%) to reserve gear packages.`
      },
      {
        title: "18. Terms & Conditions",
        content: `- **Validity**: This proposal is valid for 30 days from issuance.\n- **Payment Terms**: 50% advance, 30% post-production, 20% final delivery.\n- **Copyright**: All master copyrights transfer to the client upon full payment clearance.`
      }
    ]
  };
}

export async function generateProposalContent(
  input: GenerateProposalContentInput
): Promise<GenerateProposalContentOutput> {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!hasKey) {
    console.warn("GEMINI_API_KEY not set. Using premium preview proposal template.");
    return generateMockProposal(input);
  }
  try {
    return await generateProposalContentFlow(input);
  } catch (error) {
    console.error("Genkit AI Generation failed:", error);
    console.warn("Falling back to premium preview proposal template gracefully.");
    return generateMockProposal(input);
  }
}

const proposalContentPrompt = ai.definePrompt({
  name: 'proposalContentPrompt',
  input: { schema: GenerateProposalContentInputSchema },
  output: { schema: GenerateProposalContentOutputSchema },
  prompt: `You are an AI Proposal Architect for a premium creative media and digital marketing agency.
Your task is to automatically generate a professional business proposal structure and research insights based on the following inputs:

INPUT DATA:
- Service Vertical: {{{service_vertical}}}
- Client Industry / Type: {{{client_type}}}
- Client Location: {{{location}}}
- Project Description: {{{project_description}}}
- Project Duration: {{{project_duration}}}
- Target Market: {{{target_market}}}
- Budget Range: {{#if budget}}{{{budget}}}{{else}}Standard Agency Rates{{/if}}

Please follow these steps to generate the proposal:

STEP 1 — Understand the Project
Analyze the service vertical and description to determine business goals, challenges, and trends.

STEP 2 — Perform Market Research
Include industry overview, market trends, competitor analysis (strengths/weaknesses), and digital presence opportunities.

STEP 3 — Generate Proposal Structure (18 Sections)
1. Cover Page
2. Proposal Introduction
3. Executive Summary
4. Client Business Overview
5. Digital Presence Audit
6. Competitor Analysis
7. Keyword & Search Opportunity
8. Strategic Framework
9. 12-Month Marketing Roadmap
10. Media Production Plan
11. Digital Marketing Plan
12. Deliverables Summary
13. KPI Targets
14. Budget Structure
15. Expected ROI
16. Implementation Timeline
17. Next Steps
18. Terms & Conditions

STEP 4 — Generate Content
- Premium agency tone (strategic and data-driven).
- Adapt tone to the client industry.
- Include data-backed insights and measurable outcomes.

STEP 5 — Format Output
Return a structured JSON object with a "proposal_title", "client", and an array of "sections" each with a "title" and "content".`,
});

const generateProposalContentFlow = ai.defineFlow(
  {
    name: 'generateProposalContentFlow',
    inputSchema: GenerateProposalContentInputSchema,
    outputSchema: GenerateProposalContentOutputSchema,
  },
  async (input) => {
    const { output } = await proposalContentPrompt(input);
    return output!;
  }
);
