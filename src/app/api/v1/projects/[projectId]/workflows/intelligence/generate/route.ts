import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { IntelligenceEngine } from "@/lib/production/intelligence/IntelligenceEngine";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    // Find all shots for the project
    const shots = await prisma.productionShot.findMany({
      where: {
        ProductionScene: {
          ProductionStoryboard: {
            project_id: projectId
          }
        }
      }
    });

    const results = [];
    for (const shot of shots) {
      const packageData = await IntelligenceEngine.synchronizePackage(shot.id, projectId);
      results.push(packageData);
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error("Intelligence Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate packages" }, { status: 500 });
  }
}
