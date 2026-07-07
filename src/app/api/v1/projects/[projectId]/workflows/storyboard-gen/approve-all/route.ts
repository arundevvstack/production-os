import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

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
    
    // Set all scenes to approved
    scenes.forEach((s: any) => s.is_approved = true);

    // Save back to database
    await prisma.productionStoryboardVersion.update({
      where: { id: storyboardVersion.id },
      data: {
        content: scenes,
        status: 'approved'
      }
    });

    await prisma.productionStoryboard.update({
      where: { id: project!.ProductionStoryboard!.id },
      data: { is_completed: true }
    });

    revalidatePath(`/projects/${projectId}`, 'layout');

    return NextResponse.json({ success: true, allApproved: true });

  } catch (error: any) {
    console.error("Storyboard Approve All Error:", error);
    return NextResponse.json({ error: error.message || "Failed to approve all scenes" }, { status: 500 });
  }
}
