import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(req: Request, { params }: { params: any }) {
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

    if (!project || !project.ProductionStoryboard?.Versions?.[0]) {
      return NextResponse.json({ error: "Storyboard must be generated before Scene Workspace." }, { status: 400 });
    }

    const storyboard = project.ProductionStoryboard;
    const sbVersion = storyboard.Versions[0];
    const visualBible = project.ProductionVisualBible?.Versions?.[0];

    // Read the storyboard scenes
    const storyboardScenes = sbVersion.content as any[];

    if (!storyboardScenes || storyboardScenes.length === 0) {
      return NextResponse.json({ error: "Storyboard content is empty." }, { status: 400 });
    }

    const prompt = `
      You are a First Assistant Director and Production Manager.
      Take the following Approved Storyboard and Approved Visual Bible, and expand each storyboard frame into a highly detailed Production Scene.
      
      Approved Visual Bible:
      ${JSON.stringify(visualBible, null, 2)}
      
      Approved Storyboard:
      ${JSON.stringify(storyboardScenes, null, 2)}
      
      Output a strict JSON array of objects. Each object must represent a scene and contain:
      - scene_number (int)
      - title (string)
      - description (string - scene summary)
      - mood (string)
      - objective (string - scene goal)
      - scene_type (string - e.g., EXT, INT)
      - time_of_day (string)
      - location_ref (string - references to locations)
      - characters_ref (string - references to characters)
      - props_ref (string - references to props)
      - blocking_notes (string - character movement/action)
      - camera_notes (string - derived from visual bible)
    `;

    let scenesData: any[] = [];
    try {
      // Find any enabled text-capable provider (not just OpenAI)
      const provider = await prisma.productionAIProvider.findFirst({
        where: { is_enabled: true }
      });
      if (!provider) {
        return NextResponse.json({ error: "No AI provider configured. Please add an API key in Settings → AI Providers." }, { status: 503 });
      }

      const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
      const adapter = ProviderManager.getAdapter(provider.name);
      const modelToUse = provider.supported_models?.[0] || 'gemini-2.5-flash';
      const systemPrompt = "You return strictly valid JSON arrays of objects. No markdown formatting or code blocks outside the JSON.";
      
      const response = await adapter.submitJob(apiKey, modelToUse, systemPrompt + "\n\n" + prompt);
      if (!response.textContent) throw new Error("No response received from AI");
      scenesData = JSON.parse(response.textContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
    } catch (e: any) {
      // ROOT CAUSE FIX: Do NOT fall back to mock scene data.
      // Mock scenes ("Establish the setting and characters", "Characters move naturally")
      // have no relationship to the actual script or breakdown.
      // Surface the error explicitly so the user knows to check their provider config.
      console.error("[SceneGen] AI generation failed — no mock fallback:", e.message);
      return NextResponse.json({
        error: `Scene generation failed: ${e.message}. Please check your AI provider configuration in Settings → AI Providers.`,
        ai_error: true
      }, { status: 503 });
    }

    const createdScenes = await prisma.$transaction(async (tx) => {
      // Clear existing scenes to prevent duplication on multiple generations
      await tx.productionSceneVersion.deleteMany({
        where: { Scene: { storyboard_id: storyboard.id } }
      });
      await tx.productionScene.deleteMany({
        where: { storyboard_id: storyboard.id }
      });

      const results = [];
      for (const sData of scenesData) {
        // Create root scene
        const rootScene = await tx.productionScene.create({
          data: {
            storyboard_id: storyboard.id,
            scene_number: sData.scene_number || 1,
            title: sData.title || "Untitled",
            description: sData.description || "",
            mood: sData.mood || "",
            objective: sData.objective || "",
            notes: `Blocking: ${sData.blocking_notes || 'None'}\nCamera: ${sData.camera_notes || 'None'}`
          }
        });

        // Create initial version
        const version = await tx.productionSceneVersion.create({
          data: {
            scene_id: rootScene.id,
            scene_type: sData.scene_type || "",
            time_of_day: sData.time_of_day || "",
            location_ref: sData.location_ref || "",
            characters_ref: sData.characters_ref || "",
            props_ref: sData.props_ref || "",
            version_number: 1,
            status: "Draft"
          }
        });

        results.push(rootScene);
      }
      return results;
    }, { timeout: 30000 });

    return NextResponse.json({ success: true, count: createdScenes.length });

  } catch (error: any) {
    console.error("Scene Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
