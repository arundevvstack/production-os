import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { versionId, updatedVersion } = body;

    if (!versionId || !updatedVersion) {
      return NextResponse.json({ error: "versionId and updatedVersion are required" }, { status: 400 });
    }

    const { shot_type, camera_angle, lens, movement, character_blocking, reference_image_url } = updatedVersion;

    const shotVersion = await prisma.productionShotVersion.update({
      where: { id: versionId },
      data: {
        shot_type,
        camera_angle,
        lens,
        movement,
        character_blocking,
        reference_image_url
      }
    });

    revalidatePath(`/projects/${projectId}`, 'layout');

    return NextResponse.json({ success: true, shotVersion });

  } catch (error: any) {
    console.error("Shot Edit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to edit shot" }, { status: 500 });
  }
}
