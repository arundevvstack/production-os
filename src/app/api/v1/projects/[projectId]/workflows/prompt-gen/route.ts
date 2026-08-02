import { NextResponse } from "next/server";
import { PromptCompiler } from "@/lib/production/ai/PromptCompiler";
import { buildGenerationContext } from "@/lib/production/ai/GenerationContext";
import { deserializeShotMetadata } from "@/lib/production/metadata/ShotMetadata";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { shotId } = body;

    let shotIds = [];

    if (shotId) {
      shotIds.push(shotId);
    } else {
      // If no shotId, generate for all shots
      const shots = await prisma.productionShot.findMany({
        where: { ProductionScene: { ProductionStoryboard: { project_id: projectId } } }
      });
      shotIds = shots.map(s => s.id);
    }

    const results = [];
    for (const sid of shotIds) {
      
      // 1. Fetch Package Data
      const pkg = await prisma.productionPackage.findUnique({
        where: { shot_id: sid },
        include: {
          Versions: {
            orderBy: { version_number: 'desc' },
            take: 1
          }
        }
      });

      if (!pkg || pkg.Versions.length === 0) {
        throw new Error(`No compiled ProductionPackage found for shot ${sid}. Prompt Library requires Intelligence Engine sync.`);
      }

      const packageData: any = pkg.Versions[0].compiled_data;

      // 2. Build canonical Generation Context
      const shotMetadata = deserializeShotMetadata(packageData.shot);
      
      const generationContext = buildGenerationContext(
        packageData.project,
        packageData.visualBible,
        packageData.characters || [],
        packageData.locations || [],
        packageData.scene,
        shotMetadata,
        null, // Default generation specs will be created
        null // No extra references for now
      );

      // 3. Compile Provider Payload
      const compiledPayload = await PromptCompiler.compileFromContext(generationContext);

      // 4. Upsert Prompt and create new Prompt Version
      let prompt = await prisma.productionPrompt.findFirst({
        where: { shot_id: sid }
      });

      if (!prompt) {
        prompt = await prisma.productionPrompt.create({
          data: {
            shot_id: sid,
            status: "Generated"
          }
        });
      }

      const latestVersion = await prisma.productionPromptVersion.findFirst({
        where: { prompt_id: prompt.id },
        orderBy: { version_number: 'desc' }
      });

      const nextVersion = latestVersion ? latestVersion.version_number + 1 : 1;

      const newVersion = await prisma.productionPromptVersion.create({
        data: {
          prompt_id: prompt.id,
          version_number: nextVersion,
          image_prompt: compiledPayload.prompt,
          video_prompt: compiledPayload.video_prompt,
          camera_motion_prompt: compiledPayload.camera_motion_prompt,
          voice_prompt: compiledPayload.voice_prompt,
          narration_prompt: compiledPayload.narration_prompt,
          dialogue_prompt: compiledPayload.dialogue_prompt,
          music_prompt: compiledPayload.music_prompt,
          background_score_prompt: compiledPayload.background_score_prompt,
          sound_design_prompt: compiledPayload.sound_design_prompt,
          foley_prompt: compiledPayload.foley_prompt,
          thumbnail_prompt: compiledPayload.thumbnail_prompt,
          poster_prompt: compiledPayload.poster_prompt,
          negative_prompt: compiledPayload.negative_prompt,
          provider_parameters: compiledPayload.provider_parameters || undefined,
          status: "Draft"
        }
      });

      results.push(newVersion);
    }

    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    console.error("Prompt Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate prompts" }, { status: 500 });
  }
}
