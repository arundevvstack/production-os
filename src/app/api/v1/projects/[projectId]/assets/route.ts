import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Extract query parameters for filtering if needed
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    
    let whereClause: any = { project_id: projectId };
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const assets = await prisma.productionAsset.findMany({
      where: whereClause,
      include: {
        ProductionAssetVersion: {
          orderBy: { version_number: "desc" },
          include: {
            ProductionAIJob: true
          }
        },
        ProductionScene: true,
        ProductionShot: true,
        ProductionPrompt: true
      },
      orderBy: { created_at: "desc" }
    });

    return NextResponse.json(assets);
  } catch (error: any) {
    console.error("Assets GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
