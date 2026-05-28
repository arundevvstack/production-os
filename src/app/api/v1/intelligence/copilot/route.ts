import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

// Note: In production you would use the official @google/genai SDK or OpenAI SDK.
// This serves as the endpoint the client calls with their prompt.

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query, project_id } = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // 1. Fetch live production context to inject into LLM prompt
    let contextData: any = {};
    if (project_id) {
        const project = await prisma.project.findUnique({
            where: { id: project_id },
            include: {
                budget_tracking: true,
                workflow_state: true,
                health_score: true,
                objectives: {
                    where: { status: { in: ['Pending', 'In Progress', 'Blocked'] } }
                }
            }
        });
        
        // Fetch AI Operational Memory for this project
        const projectMemories = await prisma.aIOperationalMemory.findMany({
            where: { entity_id: project_id, entity_type: 'Project' }
        });

        contextData = {
            project,
            memories: projectMemories
        };
    }

    // 2. Pass contextData to the LLM (Simulated)
    // const llmResponse = await gemini.generateContent(`Context: ${JSON.stringify(contextData)}\n\nUser Query: ${query}`);
    
    // 3. Simulated Response based on mock context
    let generatedResponse = "The production is currently on track. No immediate bottlenecks detected.";
    
    if (contextData?.project?.workflow_state?.is_blocked) {
        generatedResponse = `Warning: Project is currently blocked on stage ${contextData.project.workflow_state.active_stage_id}. I recommend reassigning the pending objectives.`;
    } else if (contextData?.project?.health_score && contextData.project.health_score.delivery_confidence < 70) {
        generatedResponse = `Critical: Project health is low (${contextData.project.health_score.delivery_confidence}%). AI Recommends: ${JSON.stringify(contextData.project.health_score.ai_recommendations)}`;
    } else if (contextData?.project?.budget_tracking?.utilized_budget > contextData?.project?.budget_tracking?.approved_budget) {
        generatedResponse = `Critical: The project is currently over budget. Utilized: ${contextData.project.budget_tracking.utilized_budget}.`;
    }

    // You could also execute AutomationRules automatically based on the LLM's structured output.

    return NextResponse.json({ 
        success: true, 
        response: generatedResponse,
        contextUsed: contextData?.project_name ? true : false
    });

  } catch (error: any) {
    console.error("AI Copilot Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI query" }, { status: 500 });
  }
}
