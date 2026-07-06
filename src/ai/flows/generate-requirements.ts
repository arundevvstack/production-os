'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import prisma from '@/lib/prisma';

const RequirementInputSchema = z.object({
  projectType: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  budget: z.string().optional(),
  duration: z.string().optional(),
  resolution: z.string().optional(),
  priority: z.string().optional(),
  objective: z.string().optional(),
  historicalContext: z.string().optional(),
});

export type RequirementInput = z.infer<typeof RequirementInputSchema>;

// BUDGET
const BudgetOutputSchema = z.object({
  budget: z.string(),
  currency: z.string()
});
export type BudgetOutput = z.infer<typeof BudgetOutputSchema>;

// TIMELINE
const TimelineOutputSchema = z.object({
  start_date: z.string(),
  first_draft: z.string(),
  delivery_date: z.string(),
});
export type TimelineOutput = z.infer<typeof TimelineOutputSchema>;

// SCOPE
const ScopeOutputSchema = z.object({
  scope_of_work: z.string(),
});
export type ScopeOutput = z.infer<typeof ScopeOutputSchema>;

// --- PROMPTS ---

const generateBudgetPrompt = ai.definePrompt({
  name: 'generateBudgetPrompt',
  input: { schema: RequirementInputSchema },
  output: { schema: BudgetOutputSchema },
  prompt: `You are an expert Media Production Producer. Based on the inputs, estimate a reasonable budget.
Project Type: {{{projectType}}}
Deliverables: {{{deliverables}}}
Resolution: {{{resolution}}}
Priority: {{{priority}}}
Objective: {{{objective}}}

{{{historicalContext}}}

Return a JSON with budget (as a numeric string) and currency (e.g. INR or USD). If unsure, assume standard Indian commercial rates (e.g. 500000 INR).`,
});

const generateTimelinePrompt = ai.definePrompt({
  name: 'generateTimelinePrompt',
  input: { schema: RequirementInputSchema },
  output: { schema: TimelineOutputSchema },
  prompt: `You are an expert Media Production Project Manager. Based on the inputs, estimate a realistic timeline starting from today (${new Date().toISOString().split('T')[0]}).
Project Type: {{{projectType}}}
Deliverables: {{{deliverables}}}
Priority: {{{priority}}}

{{{historicalContext}}}

Return a JSON with start_date, first_draft, and delivery_date in YYYY-MM-DD format.`,
});

const generateScopePrompt = ai.definePrompt({
  name: 'generateScopePrompt',
  input: { schema: RequirementInputSchema },
  output: { schema: ScopeOutputSchema },
  prompt: `You are an expert Media Production Proposal Architect. Based on the inputs, write a clear, detailed 3-4 paragraph Scope of Work.
Project Type: {{{projectType}}}
Deliverables: {{{deliverables}}}
Objective: {{{objective}}}
Duration: {{{duration}}}

{{{historicalContext}}}

Return a JSON with a single "scope_of_work" string field detailing Pre-Production, Production, and Post-Production phases.`,
});

// --- HISTORICAL LEARNING ---

async function fetchHistoricalContext(projectType?: string) {
  if (!projectType) return "";
  try {
    const past = await (prisma as any).requirement.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
    
    const matching = past.filter((p: any) => {
      const details = p.project_details as any;
      return details && details.project_type === projectType;
    }).slice(0, 3);
    
    if (matching.length === 0) return "";
    
    let context = "--- HISTORICAL PRECEDENTS (LEARNED DATA) ---\n";
    context += "Use the following past completed projects of type '" + projectType + "' to inform your estimates (learn from these budgets, timelines, and scopes):\n\n";
    
    matching.forEach((p: any, i: any) => {
      const pDetails = p.project_details as any || {};
      const budget = pDetails.budget || "Unknown";
      const currency = pDetails.currency || "INR";
      const timeline = p.timeline as any || {};
      const scope = (p.root as any)?.scope_of_work || "Unknown";
      
      context += `Past Project ${i+1}:\n`;
      context += `- Budget: ${budget} ${currency}\n`;
      context += `- Timeline: Start: ${timeline.start_date || 'Unknown'}, Delivery: ${timeline.delivery_date || 'Unknown'}\n`;
      context += `- Scope: ${String(scope).substring(0, 300)}...\n\n`;
    });
    
    return context;
  } catch (e) {
    console.error("Failed to fetch historical context", e);
    return "";
  }
}

// --- EXPORTS ---

export async function generateRequirementBudget(input: RequirementInput): Promise<BudgetOutput> {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!hasKey) throw new Error("Missing Google AI API Key");
  try {
    input.historicalContext = await fetchHistoricalContext(input.projectType);
    const { output } = await generateBudgetPrompt(input);
    return output!;
  } catch (error) {
    console.error("Budget AI Gen failed:", error);
    throw new Error("Failed to generate budget via AI.");
  }
}

export async function generateRequirementTimeline(input: RequirementInput): Promise<TimelineOutput> {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!hasKey) throw new Error("Missing Google AI API Key");
  try {
    input.historicalContext = await fetchHistoricalContext(input.projectType);
    const { output } = await generateTimelinePrompt(input);
    return output!;
  } catch (error) {
    console.error("Timeline AI Gen failed:", error);
    throw new Error("Failed to generate timeline via AI.");
  }
}

export async function generateRequirementScope(input: RequirementInput): Promise<ScopeOutput> {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!hasKey) throw new Error("Missing Google AI API Key");
  try {
    input.historicalContext = await fetchHistoricalContext(input.projectType);
    const { output } = await generateScopePrompt(input);
    return output!;
  } catch (error) {
    console.error("Scope AI Gen failed:", error);
    throw new Error("Failed to generate scope via AI.");
  }
}
