'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestScopeInputSchema = z.object({
  service_vertical: z.string(),
  client_type: z.string(),
  proposal_type: z.string(),
});
export type SuggestScopeInput = z.infer<typeof SuggestScopeInputSchema>;

const SuggestScopeOutputSchema = z.object({
  suggestion: z.string(),
});
export type SuggestScopeOutput = z.infer<typeof SuggestScopeOutputSchema>;

function getMockSuggestion(input: SuggestScopeInput): SuggestScopeOutput {
  const service = input.service_vertical || "Premium Video Production";
  const client = input.client_type || "Corporate Partner";
  
  if (input.proposal_type === 'quote') {
    return {
      suggestion: `A high-level estimation for ${service} catered to a ${client}. Deliverables include basic raw assets and 1 master export.`
    };
  }
  
  return {
    suggestion: `Comprehensive strategic campaign for ${service} targeting the ${client} sector. 
Objectives include increasing brand authority, capturing high-intent leads, and establishing market dominance through premium cinematic visuals. 
Deliverables include a master campaign film, multiple social cutdowns, and a custom semantic landing page designed for conversion velocity.`
  };
}

export async function suggestProposalScope(
  input: SuggestScopeInput
): Promise<SuggestScopeOutput> {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!hasKey) {
    console.warn("API key not set. Using mock scope suggestion.");
    return getMockSuggestion(input);
  }
  try {
    return await suggestScopeFlow(input);
  } catch (error) {
    console.error("Genkit AI Generation failed:", error);
    return getMockSuggestion(input);
  }
}

const suggestScopePrompt = ai.definePrompt({
  name: 'suggestScopePrompt',
  input: { schema: SuggestScopeInputSchema },
  output: { schema: SuggestScopeOutputSchema },
  prompt: `You are an AI Proposal Architect for a premium creative media and digital marketing agency.
Your task is to generate a short, professional "Proposal Scope & Description" (3-4 sentences max) based on the following inputs:

Service Vertical: {{{service_vertical}}}
Client Industry: {{{client_type}}}
Document Type: {{{proposal_type}}}

Return a structured JSON object with a single "suggestion" field.`,
});

const suggestScopeFlow = ai.defineFlow(
  {
    name: 'suggestScopeFlow',
    inputSchema: SuggestScopeInputSchema,
    outputSchema: SuggestScopeOutputSchema,
  },
  async (input) => {
    const { output } = await suggestScopePrompt(input);
    return output!;
  }
);
