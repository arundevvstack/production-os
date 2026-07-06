import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { sceneIndex, approved } = body;

    if (sceneIndex === undefined || approved === undefined) {
      return NextResponse.json({ error: "sceneIndex and approved are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionStoryboard: {
          include: {
            Versions: {
              orderBy: { version_number: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const storyboardVersion = project?.ProductionStoryboard?.Versions?.[0];
    if (!storyboardVersion) {
      return NextResponse.json({ error: "Storyboard version not found." }, { status: 404 });
    }

    let scenes = storyboardVersion.content as any[];
    
    if (!scenes[sceneIndex]) {
      return NextResponse.json({ error: "Scene not found at index." }, { status: 404 });
    }

    // Toggle the approval status for this specific scene
    scenes[sceneIndex].is_approved = approved;

    // Check if ALL scenes are approved to update the master status
    const allApproved = scenes.every((s: any) => s.is_approved === true);
    const newStatus = allApproved ? 'approved' : 'draft';

    // Save back to database
    await prisma.productionStoryboardVersion.update({
      where: { id: storyboardVersion.id },
      data: {
        content: scenes,
        status: newStatus
      }
    });

    if (newStatus === 'approved') {
      await prisma.productionStoryboard.update({
        where: { id: project.ProductionStoryboard.id },
        data: { is_completed: true }
      });
    } else {
      await prisma.productionStoryboard.update({
        where: { id: project.ProductionStoryboard.id },
        data: { is_completed: false }
      });
    }

    return NextResponse.json({ success: true, allApproved });

  } catch (error: any) {
    console.error("Storyboard Approve Error:", error);
    return NextResponse.json({ error: error.message || "Failed to approve scene" }, { status: 500 });
  }
}