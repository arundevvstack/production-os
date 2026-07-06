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

export async function approvePromptVersion(versionId: string, projectId: string) {
  await prisma.productionPromptVersion.update({
    where: { id: versionId },
    data: { status: "Approved" }
  });
  revalidatePath(`/projects/${projectId}/prompts`);
}

export async function approveAllPrompts(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ProductionStoryboard: { 
        include: { 
          ProductionScene: {
            include: {
              ProductionShot: {
                include: {
                  ProductionPrompt: { include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } } }
                }
              }
            }
          }
        } 
      }
    }
  });

  if (!project) throw new Error("Project not found");

  const allShots = project.ProductionStoryboard?.ProductionScene.flatMap((s: any) => s.ProductionShot) || [];
  const latestVersionIds = allShots.flatMap((shot: any) => 
    shot.ProductionPrompt.map((p: any) => p.Versions[0]?.id)
  ).filter(Boolean);

  if (latestVersionIds.length > 0) {
    await prisma.productionPromptVersion.updateMany({
      where: { id: { in: latestVersionIds } },
      data: { status: "Approved" }
    });
  }

  revalidatePath(`/projects/${projectId}/prompts`);
}

export async function updatePromptVersion(versionId: string, projectId: string, data: any) {
  await prisma.productionPromptVersion.update({
    where: { id: versionId },
    data: {
      image_prompt: data.image_prompt,
      video_prompt: data.video_prompt,
      camera_prompt: data.camera_prompt,
      lighting_prompt: data.lighting_prompt,
      environment_prompt: data.environment_prompt,
      negative_prompt: data.negative_prompt,
      aspect_ratio: data.aspect_ratio
    }
  });
  revalidatePath(`/projects/${projectId}/prompts`);
}

export async function regeneratePromptVersion(versionId: string, projectId: string) {
  const version = await prisma.productionPromptVersion.findUnique({
    where: { id: versionId },
    include: { ProductionPrompt: { include: { ProductionShot: { include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } } } } } }
  });

  if (!version || !version.ProductionPrompt) throw new Error("Prompt not found");

  const shot = version.ProductionPrompt.ProductionShot;
  const shotVersion = shot.Versions[0];
  if (!shotVersion) throw new Error("Shot version not found");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { ProductionVisualBible: { include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } } } }
  });

  const visualBible = project?.ProductionVisualBible?.Versions?.[0];

  const provider = await prisma.productionAIProvider.findFirst({ where: { name: "Google GenAI" } });
  if (!provider) throw new Error("Provider not configured");

  let apiKey = "";
  try { apiKey = await ProviderManager.getDecryptedCredentials(provider.id); } catch(e) {}
  
  let pData: any = {};
  if (apiKey) {
    const adapter = ProviderManager.getAdapter(provider.name);
    const prompt = `
      You are an AI Prompt Engineer.
      Approved Visual Bible: ${JSON.stringify({ 
        cinematography: visualBible?.cinematography_bible, 
        lighting: visualBible?.lighting_bible,
        style: visualBible?.style_bible,
        color: visualBible?.art_direction_bible 
      })}
      Approved Shot: ${JSON.stringify(shotVersion)}
      
      Output strict JSON: image_prompt, video_prompt, character_prompt, environment_prompt, lighting_prompt, camera_prompt, negative_prompt, model_rec, aspect_ratio.
    `;
    const response = await adapter.submitJob(apiKey, "gemini-2.5-flash", "Return strict JSON.", prompt);
    try {
      pData = JSON.parse(response.textContent?.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim() || "{}");
    } catch(e) {}
  }

  if (!pData.image_prompt) {
    pData = {
      image_prompt: "Cinematic medium shot of a glowing Gen-Z model applying skincare, soft morning light, hyper-real, 35mm lens.",
      video_prompt: "Slow push-in on a confident Gen-Z model softly applying skincare, serene mood, photorealistic skin textures.",
      character_prompt: "Confident, radiant Gen-Z individual with luminous skin and natural texture hair.",
      environment_prompt: "Minimalist studio, large windows, sheer curtains, soft daylight.",
      lighting_prompt: "Soft diffused daylight, large 12x12 silk wrap, negative fill.",
      camera_prompt: "35mm prime lens, smooth floating camera, shallow depth of field.",
      negative_prompt: "CGI, plastic skin, unnatural lighting, oversaturated, messy background.",
      model_rec: "runway-gen3",
      aspect_ratio: "16:9"
    };
  }

  await prisma.productionPromptVersion.update({
    where: { id: versionId },
    data: {
      image_prompt: pData.image_prompt || "",
      video_prompt: pData.video_prompt || "",
      character_prompt: pData.character_prompt || "",
      environment_prompt: pData.environment_prompt || "",
      lighting_prompt: pData.lighting_prompt || "",
      camera_prompt: pData.camera_prompt || "",
      negative_prompt: pData.negative_prompt || "",
      model_rec: pData.model_rec || "runway-gen3",
      aspect_ratio: pData.aspect_ratio || "16:9"
    }
  });

  revalidatePath(`/projects/${projectId}/prompts`);
}
