import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { provider_id, asset_type, model_name, options } = body;

    const newJob = await prisma.productionAIJob.create({
      data: {
        id: require('crypto').randomUUID(),
        project_id: projectId,
        provider_id,
        asset_type,
        model_name,
        metadata: options,
        created_by: "system",
        status: "Queued",
        updated_at: new Date()
      }
    });

    // Simulate async processing (normally handled by a separate queue worker)
    setTimeout(async () => {
      try {
        await prisma.productionAIJob.update({
          where: { id: newJob.id },
          data: { status: "Running", started_at: new Date(), updated_at: new Date() }
        });
        
        // Simulate generation delay
        await new Promise(r => setTimeout(r, 4000));
        
        await prisma.productionAIJob.update({
          where: { id: newJob.id },
          data: { status: "Completed", completed_at: new Date(), updated_at: new Date() }
        });
      } catch (e) {
        console.error("Job processing failed", e);
      }
    }, 1000);

    return NextResponse.json(newJob);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
