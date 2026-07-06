import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const projectId = params.projectId;

    // Get the root storyboard
    const storyboard = await prisma.productionStoryboard.findFirst({
      where: { project_id: projectId }
    });

    if (!storyboard) {
      return NextResponse.json({ error: "No storyboard found" }, { status: 404 });
    }

    // Approve all scene versions
    const scenes = await prisma.productionScene.findMany({
      where: { storyboard_id: storyboard.id }
    });

    for (const scene of scenes) {
      await prisma.productionSceneVersion.updateMany({
        where: { scene_id: scene.id },
        data: { status: "Approved" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error approving all scenes:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
