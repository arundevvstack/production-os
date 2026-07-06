import { NextRequest, NextResponse } from "next/server";
import { ProductionHealthEngine } from "@/lib/production/engines/ProductionHealthEngine";
import { TimelineEngine } from "@/lib/production/engines/TimelineEngine";
import { ContinuityEngine } from "@/lib/production/engines/ContinuityEngine";
import { BudgetEngine } from "@/lib/production/engines/BudgetEngine";
import { AdvisorEngine } from "@/lib/production/engines/AdvisorEngine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Execute all intelligence engines concurrently
    const [health, timeline, continuity, budget, advice] = await Promise.all([
      ProductionHealthEngine.evaluateProject(projectId),
      TimelineEngine.evaluateTimeline(projectId),
      ContinuityEngine.evaluateContinuity(projectId),
      BudgetEngine.evaluateBudget(projectId),
      AdvisorEngine.generateAdvice(projectId)
    ]);

    // Aggregate into a single intelligence payload
    const payload = {
      project_id: projectId,
      generated_at: new Date().toISOString(),
      health,
      timeline,
      continuity_risks: continuity,
      budget,
      recommendations: advice
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("AI Director GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
