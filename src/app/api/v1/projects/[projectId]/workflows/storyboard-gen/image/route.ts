import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";
import { AssetResolutionEngine } from "@/lib/production/intelligence/AssetResolutionEngine";

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
        },
        ProductionVisualBible: {
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
    
    // Extract Visual Bible context
    const visualBibleVersion = project?.ProductionVisualBible?.Versions?.[0];
    let vbContext = "";
    if (visualBibleVersion && visualBibleVersion.style_bible) {
      try {
        const vbJson = typeof visualBibleVersion.style_bible === 'string' 
           ? JSON.parse(visualBibleVersion.style_bible) 
           : visualBibleVersion.style_bible;
           
        const style = vbJson.style?.look || "";
        const lighting = vbJson.lighting?.style || "";
        const camera = vbJson.camera?.style || "";
        const mood = vbJson.mood?.overall || "";
        
        const arr = [style, lighting, camera, mood].filter(Boolean);
        if (arr.length > 0) {
           vbContext = arr.join(", ") + ", ";
        }
      } catch(e) {}
    }

    const prompt = scene.visual_description || scene.scene_summary || scene.title;

    // INTELLIGENT ASSET REUSE: Check if a character is mentioned in the prompt
    // and has an existing Action Pose or compatible asset to reuse.
    const allCharacters = await prisma.productionCharacter.findMany({
      where: { project_id: projectId }
    });

    let reusedImageUrl = null;
    const promptLower = prompt.toLowerCase();
    
    // Find the first character mentioned in the prompt
    const mentionedChar = allCharacters.find(c => promptLower.includes(c.name.toLowerCase()));
    
    if (mentionedChar) {
      const resolution = AssetResolutionEngine.resolveAsset(mentionedChar, 'Action Pose');
      if (resolution.assetUrl) {
        reusedImageUrl = resolution.assetUrl;
      } else if (mentionedChar.reference_image_url) {
        // Last resort legacy fallback if no assets dictionary exists at all, but engine handles metadata.assets
        if (!(mentionedChar.metadata as any)?.assets) {
           reusedImageUrl = mentionedChar.reference_image_url;
        }
      }
    }

    let imageUrl = reusedImageUrl;

    if (!imageUrl) {
      // Use Pollinations AI (Free, no API key required)
      let w = 1280;
      let h = 720;
      if (project?.aspect_ratio === "9:16") {
        w = 720;
        h = 1280;
      }
      
      // We add a random seed so that "Regenerate Image" always produces a fresh variant
      const seed = Math.floor(Math.random() * 1000000);
      const finalPrompt = `${prompt}, ${vbContext}masterpiece, best quality, highly detailed, perfect faces, anatomically correct, photorealistic, cinematic lighting, 8k`;
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${w}&height=${h}&model=flux-realism&enhance=true&nologo=true&seed=${seed}`;
    }

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

    revalidatePath(`/projects/${projectId}/storyboard`);
    return NextResponse.json({ success: true, image_url: imageUrl });

  } catch (error: any) {
    console.error("Storyboard Image Gen Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 });
  }
}