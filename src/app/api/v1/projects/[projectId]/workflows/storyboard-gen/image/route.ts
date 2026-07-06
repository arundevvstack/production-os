import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { sceneIndex } = body;

    if (sceneIndex === undefined) {
      return NextResponse.json({ error: "sceneIndex is required" }, { status: 400 });
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
    const scene = scenes[sceneIndex];

    if (!scene) {
      return NextResponse.json({ error: "Scene not found at index." }, { status: 404 });
    }

    const prompt = scene.visual_description || scene.scene_summary || scene.title;

    // Use Pollinations AI (Free, no API key required)
    // We add a random seed so that "Regenerate Image" always produces a fresh variant
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", cinematic storyboard sketch style, highly detailed")}?width=800&height=450&nologo=true&seed=${seed}`;

    // Update the scene object with the new image URL
    scenes[sceneIndex] = {
      ...scene,
      image_url: imageUrl
    };

    // Save back to database
    await prisma.productionStoryboardVersion.update({
      where: { id: storyboardVersion.id },
      data: {
        content: scenes
      }
    });

    return NextResponse.json({ success: true, image_url: imageUrl });

  } catch (error: any) {
    console.error("Storyboard Image Gen Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 });
  }
}