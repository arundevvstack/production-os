import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        ProductionAssetVersion: {
          include: {
            ProductionAsset: true
          }
        }
      }
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("Jobs API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
