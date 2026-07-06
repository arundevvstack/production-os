import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { JobDispatcher } from "@/lib/production/providers/JobDispatcher";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId },
      include: {
        ProductionAIProvider: true
      },
      orderBy: { created_at: "desc" },
      take: 50
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("Jobs GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    
    // Ensure required fields
    if (!body.provider_id || !body.asset_type || !body.model_name) {
      return NextResponse.json({ error: "Missing required job fields" }, { status: 400 });
    }

    const jobId = crypto.randomUUID();
    const newJob = await prisma.productionAIJob.create({
      data: {
        id: jobId,
        project_id: projectId,
        provider_id: body.provider_id,
        asset_type: body.asset_type,
        model_name: body.model_name,
        scene_id: body.scene_id || null,
        shot_id: body.shot_id || null,
        prompt_set_id: body.prompt_set_id || null,
        status: "Queued",
        created_by: "system", // usually from auth session
        metadata: body.options || {},
        updated_at: new Date()
      }
    });

    // Fire & Forget job execution for MVP 
    // In production, this would go into a message queue (e.g., BullMQ or Inngest)
    JobDispatcher.dispatchJob(jobId).catch(err => {
      console.error(`Async Job ${jobId} Failed:`, err);
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error: any) {
    console.error("Jobs POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
