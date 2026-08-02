import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    if (!project || !project.ProductionStoryboard) {
      return NextResponse.json({ error: "No storyboard found for this project" }, { status: 404 });
    }

    const storyboardId = project.ProductionStoryboard.id;
    const latestVersion = project.ProductionStoryboard.Versions[0];

    if (!latestVersion || !latestVersion.content) {
      return NextResponse.json({ error: "Storyboard has no content" }, { status: 400 });
    }

    const scenes = latestVersion.content as any[];
    const approvedScenes = scenes.filter(s => s.is_approved);

    if (approvedScenes.length === 0) {
      return NextResponse.json({ error: "No approved scenes to extract" }, { status: 400 });
    }

    // Process extraction idempotently
    let extractedScenesCount = 0;
    let extractedShotsCount = 0;

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < approvedScenes.length; i++) {
        const sceneData = approvedScenes[i];
        const sceneNumber = i + 1;

        let dbScene = await tx.productionScene.findFirst({
          where: {
            storyboard_id: storyboardId,
            scene_number: sceneNumber,
          }
        });

        const scenePayload = {
          storyboard_id: storyboardId,
          scene_number: sceneNumber,
          title: sceneData.title || `Scene ${sceneNumber}`,
          description: sceneData.visual_description || sceneData.scene_summary || "",
          mood: sceneData.mood || "",
          notes: sceneData.environment_description || "",
        };

        if (dbScene) {
          dbScene = await tx.productionScene.update({
            where: { id: dbScene.id },
            data: scenePayload
          });
        } else {
          dbScene = await tx.productionScene.create({
            data: scenePayload
          });
        }
        extractedScenesCount++;

        let dbShot = await tx.productionShot.findFirst({
          where: {
            scene_id: dbScene.id,
            shot_number: 1
          }
        });

        const shotPayload = {
          scene_id: dbScene.id,
          shot_number: 1,
          camera: sceneData.camera_angle || "Wide Shot",
          character: sceneData.character_placement || "",
          lighting: sceneData.lighting_plan || "",
        };

        if (dbShot) {
          await tx.productionShot.update({
            where: { id: dbShot.id },
            data: shotPayload
          });
        } else {
          await tx.productionShot.create({
            data: shotPayload
          });
        }
        extractedShotsCount++;
      }
    });

    return NextResponse.json({
      message: "Extraction successful",
      extractedScenes: extractedScenesCount,
      extractedShots: extractedShotsCount
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
