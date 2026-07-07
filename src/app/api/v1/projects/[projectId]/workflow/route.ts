import { NextResponse } from "next/server";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const workflowState = await WorkflowEngine.getWorkflowState(projectId);
    return NextResponse.json(workflowState);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
