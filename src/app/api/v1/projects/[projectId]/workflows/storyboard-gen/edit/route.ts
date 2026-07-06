import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { sceneIndex, updatedScene } = await req.json();

    if (typeof sceneIndex !== 'number' || !updatedScene) {
      return NextResponse.json({ error: "Missing sceneIndex or updatedScene payload" }, { status: 400 });
    }

    const projectId = params.projectId;

    // Get the latest storyboard version
    const storyboardVersion = await prisma.productionStoryboardVersion.findFirst({
      where: { 
        storyboard: { project_id: projectId } 
      },
      orderBy: { created_at: 'desc' }
    });

    if (!storyboardVersion || !storyboardVersion.content) {
      return NextResponse.json({ error: "No storyboard found" }, { status: 404 });
    }

    // Parse the content
    let scenes = [];
    if (typeof storyboardVersion.content === 'string') {
      scenes = JSON.parse(storyboardVersion.content);
    } else {
      scenes = storyboardVersion.content as any[];
    }

    if (sceneIndex < 0 || sceneIndex >= scenes.length) {
      return NextResponse.json({ error: "Invalid scene index" }, { status: 400 });
    }

    // Apply the updates to the scene
    scenes[sceneIndex] = {
      ...scenes[sceneIndex],
      title: updatedScene.title,
      scene_summary: updatedScene.scene_summary,
      environment_description: updatedScene.environment_description,
      character_placement: updatedScene.character_placement,
      camera_angle: updatedScene.camera_angle,
      lighting_plan: updatedScene.lighting_plan
    };

    // Save back to database
    await prisma.productionStoryboardVersion.update({
      where: { id: storyboardVersion.id },
      data: {
        content: scenes
      }
    });

    return NextResponse.json({ success: true, scene: scenes[sceneIndex] });
  } catch (error: any) {
    console.error("Error editing scene:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
