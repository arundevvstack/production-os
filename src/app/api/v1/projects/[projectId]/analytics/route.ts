import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Aggregate Jobs
    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId },
      select: {
        id: true,
        status: true,
        provider_id: true,
        started_at: true,
        completed_at: true,
      }
    });

    const totalJobs = jobs.length;
    const failedJobs = jobs.filter(j => j.status === 'Failed').length;
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
    
    // Average Generation Time
    const jobsWithDuration = jobs.filter(j => j.started_at && j.completed_at);
    const avgGenTimeMs = jobsWithDuration.length > 0
      ? jobsWithDuration.reduce((acc, j) => acc + (j.completed_at!.getTime() - j.started_at!.getTime()), 0) / jobsWithDuration.length
      : 0;

    // Aggregate Assets
    const assets = await prisma.productionAsset.findMany({
      where: { project_id: projectId },
      select: {
        id: true,
        status: true,
      }
    });

    const totalAssets = assets.length;
    const approvedAssets = assets.filter(a => a.status === 'Approved').length;
    const approvalRate = totalAssets > 0 ? (approvedAssets / totalAssets) * 100 : 0;

    // Usage by Provider
    const providerUsage = jobs.reduce((acc: any, job) => {
      if (!acc[job.provider_id]) acc[job.provider_id] = 0;
      acc[job.provider_id]++;
      return acc;
    }, {});

    return NextResponse.json({
      totalJobs,
      completedJobs,
      failedJobs,
      failureRate,
      avgGenTimeSeconds: avgGenTimeMs / 1000,
      totalAssets,
      approvedAssets,
      approvalRate,
      providerUsage
    });
  } catch (error: any) {
    console.error("Analytics GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
