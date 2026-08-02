import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { IntelligenceEngine } from "@/lib/production/intelligence/IntelligenceEngine";

export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { shotId, updatedVersion } = body;

    if (!shotId || !updatedVersion) {
      return NextResponse.json({ error: "shotId and updatedVersion are required" }, { status: 400 });
    }

    const { 
      shot_type, camera_angle, lens, movement, character_blocking, reference_image_url,
      composition, frame_size, focus, lighting, fx
    } = updatedVersion;

    const data = {
      shot_type,
      camera_angle,
      lens,
      movement,
      composition,
      frame_size,
      focus,
      lighting,
      character_blocking,
      reference_image_url,
      fx
    };

    // Find latest version or create new one
    const existingVersions = await prisma.productionShotVersion.findMany({
      where: { shot_id: shotId },
      orderBy: { version_number: 'desc' },
      take: 1
    });

    let shotVersion;
    if (existingVersions.length > 0) {
      shotVersion = await prisma.productionShotVersion.update({
        where: { id: existingVersions[0].id },
        data
      });
    } else {
      shotVersion = await prisma.productionShotVersion.create({
        data: {
          shot_id: shotId,
          version_number: 1,
          ...data
        }
      });
    }

    // Update parent shot as well for some top-level fields
    await prisma.productionShot.update({
      where: { id: shotId },
      data: {
        camera: camera_angle,
        lens,
        movement,
        lighting
      }
    });

    // Background intelligent sync
    (async () => {
      try {
        await IntelligenceEngine.synchronizePackage(shotId, projectId);
      } catch(e) {
        console.error("Intelligence sync failed", e);
      }
    })();

    revalidatePath(`/projects/${projectId}`, 'layout');

    return NextResponse.json({ success: true, shotVersion });

  } catch (error: any) {
    console.error("Shot Edit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to edit shot" }, { status: 500 });
  }
}
