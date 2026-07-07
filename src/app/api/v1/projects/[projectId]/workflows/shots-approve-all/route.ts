import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionStoryboard: {
          include: {
            ProductionScene: {
              include: {
                ProductionShot: true
              }
            }
          }
        }
      }
    });

    if (!project || !project.ProductionStoryboard) {
      return NextResponse.json({ error: "No storyboard found" }, { status: 404 });
    }

    const scenes = project.ProductionStoryboard.ProductionScene;

    // Approve all shot versions
    for (const scene of scenes) {
      for (const shot of scene.ProductionShot) {
        await prisma.productionShotVersion.updateMany({
          where: { shot_id: shot.id },
          data: { status: "Approved" }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error approving all shots:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
