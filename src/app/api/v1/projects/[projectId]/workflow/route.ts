import { NextRequest, NextResponse } from "next/server";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const stages = await WorkflowEngine.getProjectStages(projectId);
    return NextResponse.json({ stages });
  } catch (error: any) {
    console.error("Workflow API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
