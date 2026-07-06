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
            ProductionScene: {
              include: {
                Versions: { orderBy: { version_number: 'desc' }, take: 1 },
                ProductionShot: {
                  include: {
                    Versions: { orderBy: { version_number: 'desc' }, take: 1 }
                  }
                }
              }
            }
          }
        },
        ProductionVisualBible: {
          include: {
            Versions: { orderBy: { version_number: 'desc' }, take: 1 }
          }
        }
      }
    });

    const storyboard = project?.ProductionStoryboard;
    const scenes = storyboard?.ProductionScene;
    
    if (!project || !scenes || scenes.length === 0) {
      return NextResponse.json({ error: "Scenes must be generated before Prompt Planning." }, { status: 400 });
    }

    const visualBible = project.ProductionVisualBible?.Versions?.[0];
    let provider = await prisma.productionAIProvider.findFirst({ where: { name: "Google GenAI" } });
    if (!provider) {
        throw new Error("Google GenAI provider not configured in system.");
    }

    const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
    const adapter = ProviderManager.getAdapter(provider.name);
    
    // Flatten shots
    const allShots = scenes.flatMap((s: any) => s.ProductionShot);
    const shotsToProcess = allShots.slice(0, 3); // For demo, process first 3

    const createdPrompts = [];

    for (const shot of shotsToProcess) {
      const shotVersion = shot.Versions[0];
      if (!shotVersion) continue;

      const prompt = `
        You are an AI Prompt Engineer for cinematic video generation.
        Take this Approved Shot and Approved Visual Bible, and generate the ultimate AI Prompts to be sent to image/video generators.
        
        Approved Visual Bible:
        ${JSON.stringify({ 
          cinematography: visualBible?.cinematography_bible, 
          lighting: visualBible?.lighting_bible,
          style: visualBible?.style_bible,
          color: visualBible?.art_direction_bible 
        }, null, 2)}
        
        Approved Shot:
        ${JSON.stringify(shotVersion, null, 2)}
        
        Output a strict JSON object (NOT an array) representing the prompt configuration:
        - image_prompt (string - highly detailed descriptive prompt)
        - video_prompt (string - prompt for motion/video generators like Runway Gen-3)
        - character_prompt (string)
        - environment_prompt (string)
        - lighting_prompt (string)
        - camera_prompt (string)
        - negative_prompt (string - what to avoid)
        - model_rec (string - recommended model e.g., 'midjourney', 'runway-gen3', 'luma')
        - aspect_ratio (string)
      `;

      const systemPrompt = "You return strictly valid JSON objects. No markdown formatting or code blocks outside the JSON.";
      const response = await adapter.submitJob(apiKey, "gemini-2.5-flash", systemPrompt + "\n\n" + prompt);

      if (!response.textContent) {
        console.error("No response received from AI");
        continue;
      }

      let pData: any = {};
      try {
        pData = JSON.parse(response.textContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
      } catch (e) {
        console.error("Failed to parse Prompt JSON", e, response.textContent);
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const rootPrompt = await tx.productionPrompt.create({
          data: {
            shot_id: shot.id,
            status: "Draft",
          }
        });

        await tx.productionPromptVersion.create({
          data: {
            prompt_id: rootPrompt.id,
            image_prompt: pData.image_prompt || "",
            video_prompt: pData.video_prompt || "",
            character_prompt: pData.character_prompt || "",
            environment_prompt: pData.environment_prompt || "",
            lighting_prompt: pData.lighting_prompt || "",
            camera_prompt: pData.camera_prompt || "",
            negative_prompt: pData.negative_prompt || "",
            model_rec: pData.model_rec || "runway-gen3",
            aspect_ratio: pData.aspect_ratio || "16:9",
            version_number: 1,
            status: "Draft"
          }
        });
        createdPrompts.push(rootPrompt);
      });
    }

    return NextResponse.json({ success: true, prompts_created: createdPrompts.length });

  } catch (error: any) {
    console.error("Prompt Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
