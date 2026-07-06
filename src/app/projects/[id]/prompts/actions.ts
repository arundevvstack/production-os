"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function generateShotPrompts(projectId: string, shotId: string) {
  // Fetch shot and related scene info
  const shot = await prisma.productionShot.findUnique({
    where: { id: shotId },
    include: {
      ProductionScene: {
        include: {
          ProductionStoryboard: true
        }
      }
    }
  });

  if (!shot || !shot.ProductionScene) {
    throw new Error("Shot or Scene not found");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) throw new Error("Project not found");
  
  const provider = await prisma.productionAIProvider.findFirst({
    where: { name: "OpenRouter" }
  });
  if (!provider) throw new Error("OpenRouter provider not found");

  const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
  const adapter = ProviderManager.getAdapter("OpenRouter");

  const systemPrompt = `You are an expert AI prompt engineer for film and video production.
Your task is to take the details of a specific shot and its scene, and generate highly detailed AI image, video, and character prompts.
Return ONLY a valid JSON object matching this schema, with no markdown formatting or extra text:
{
  "image_prompt": "string (A detailed midjourney/stable diffusion style prompt)",
  "video_prompt": "string (A detailed prompt for video generators like Sora/Runway focusing on motion)",
  "character_prompt": "string (A detailed prompt focusing on character appearance and styling)"
}`;

  const userPrompt = `
Scene Title: ${shot.ProductionScene.title}
Scene Description: ${shot.ProductionScene.description}

Shot Details:
Camera: ${shot.camera || 'Not specified'}
Movement: ${shot.movement || 'Not specified'}
Lens: ${shot.lens || 'Not specified'}
Environment: ${shot.environment || 'Not specified'}
Character: ${shot.character || 'Not specified'}

Generate the prompts based on these details.
`;

  try {
    const response = await adapter.submitJob(apiKey, "openai/gpt-4o", userPrompt, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const parsedData = JSON.parse(response.textContent || "{}");

    // Create or update Prompt Set
    const existingPrompts = await prisma.productionPrompt.findMany({
      where: { shot_id: shot.id }
    });

    let promptId;
    if (existingPrompts.length > 0) {
      promptId = existingPrompts[0].id;
    } else {
      const newPrompt = await prisma.productionPrompt.create({
        data: {
          id: require('crypto').randomUUID(),
          updated_at: new Date(),
          shot_id: shot.id,
          status: "Draft"
        }
      });
      promptId = newPrompt.id;
    }

    await prisma.productionPromptVersion.create({
      data: {
        id: require('crypto').randomUUID(),
        prompt_id: promptId,
        image_prompt: parsedData.image_prompt,
        video_prompt: parsedData.video_prompt,
        character_prompt: parsedData.character_prompt,
        environment_prompt: shot.environment || ""
      }
    });

    revalidatePath(`/projects/${projectId}/prompts`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to generate prompt:", error);
    throw new Error(error.message || "Failed to generate prompt");
  }
}
