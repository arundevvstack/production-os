import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  try {
    const { projectId, jobId } = await params;

    const job = await prisma.productionAIJob.findUnique({
      where: { id: jobId, project_id: projectId },
      include: { ProductionAIProvider: true }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "Completed" || job.status === "Failed" || job.status === "Cancelled") {
      return NextResponse.json({ error: `Cannot cancel job in state: ${job.status}` }, { status: 400 });
    }

    // Call adapter cancel method if an external job ID exists
    if (job.external_job_id) {
      try {
        const apiKey = await ProviderManager.getDecryptedCredentials(job.provider_id);
        const adapter = ProviderManager.getAdapter(job.ProductionAIProvider.name);
        await adapter.cancelJob(apiKey, job.external_job_id);
      } catch (e: any) {
        console.warn(`Failed to cancel external job ${job.external_job_id}:`, e.message);
        // We still mark it cancelled locally even if provider cancel fails
      }
    }

    const updatedJob = await prisma.productionAIJob.update({
      where: { id: jobId },
      data: {
        status: "Cancelled",
        completed_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error("Job Cancel POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
