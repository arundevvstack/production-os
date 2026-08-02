import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionScript: {
          include: {
            Characters: true,
            Locations: true,
            Props: true,
            CameraPlans: true,
            Lightings: true,
            ArtDirections: true,
            Audios: true,
            VFXs: true
          }
        }
      }
    });

    if (!project || !project.ProductionScript) {
      return NextResponse.json({ error: "No script found." }, { status: 404 });
    }

    const script = project.ProductionScript;
    const breakdown = {
      characters: script.Characters,
      locations: script.Locations,
      props: script.Props,
      camera: script.CameraPlans,
      lighting: script.Lightings,
      artDirection: script.ArtDirections,
      audio: script.Audios,
      vfx: script.VFXs
    };

    const prompt = `
      You are an expert Production Designer, Cinematographer, and Creative Director.
      Consume this Approved Production Breakdown and generate a highly detailed AI Visual Bible.
      
      Approved Elements:
      ${JSON.stringify(breakdown, null, 2)}
      
      Output a strict JSON object with these keys (each an array or detailed object as appropriate):
      - style_bible: { overall_style, genre, mood, color_language, contrast, texture, realism_level, rendering_style, reference_directors }
      - character_bible: [ { character_name, profile, visual_description, age, ethnicity, body_type, hair, skin_tone, wardrobe_concept } ]
      - location_bible: [ { location_name, architecture, lighting, weather, time_of_day, mood, color_palette, textures } ]
      - prop_bible: [ { prop_name, material, condition, brand, usage } ]
      - costume_bible: [ { costume_name, character, layers, fabric, material, color_palette } ]
      - cinematography_bible: { global_camera_style, lens_package, movement_language, aspect_ratio, film_emulation, motion_blur }
      - lighting_bible: { lighting_style, key_light, fill, back, practicals, temperature, exposure, mood }
      - art_direction_bible: { architecture, furniture, textures, brand_language, visual_identity }
      - audio_bible: { music_style, ambience, dialogue_style, foley }
      - vfx_bible: { fire, smoke, dust, particles, green_screen }
    `;

    // Find any enabled provider (prefer Google GenAI, fallback to any enabled)
    const provider = await prisma.productionAIProvider.findFirst({
      where: { is_enabled: true }
    }) ?? await prisma.productionAIProvider.findFirst({ where: { name: "Google GenAI" } });

    if (!provider) {
      return NextResponse.json({
        error: "No AI provider configured. Please add an API key in Settings → AI Providers.",
        ai_error: true
      }, { status: 503 });
    }

    // Credential retrieval — fail loudly if missing (no silent empty-string fallback)
    const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
    const adapter = ProviderManager.getAdapter(provider.name);
    const modelToUse = provider.supported_models?.[0] || 'gemini-2.5-flash';

    const systemPrompt = "You return strictly valid JSON objects. No markdown formatting or code blocks outside the JSON.";
    
    let response;
    try {
      response = await adapter.submitJob(apiKey, modelToUse, systemPrompt + "\n\n" + prompt, {
        generationConfig: { responseMimeType: "application/json" }
      });
    } catch (e: any) {
      // ROOT CAUSE FIX: Do NOT fall back to hardcoded mock Visual Bible data.
      // The mock contained hardcoded characters ("Krishna", "Father") from a sample project
      // which contaminated the Visual Bible and downstream Character Manager for EVERY project.
      // If AI generation fails, return a clear error so the user knows to check their API key.
      console.error("Visual Bible Gen failed — no mock fallback will be used:", e.message);
      return NextResponse.json({
        error: `Visual Bible generation failed: ${e.message}. Please check your Google GenAI API key in Settings → AI Providers.`,
        ai_error: true
      }, { status: 503 });
    }

    if (!response.textContent) throw new Error("No response received from AI");

    let bibleData: any = {};
    const rawJson = response.textContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    try {
      bibleData = JSON.parse(rawJson);
    } catch (e) {
      console.warn("Failed first pass of JSON parse, attempting to sanitize control characters...");
      try {
        // More robust parsing: If responseMimeType fails or isn't supported, 
        // we can try to sanitize literal newlines INSIDE strings using a state machine.
        let sanitized = '';
        let inString = false;
        let escapeNext = false;
        for (let i = 0; i < rawJson.length; i++) {
            const char = rawJson[i];
            if (inString) {
                if (escapeNext) { sanitized += char; escapeNext = false; }
                else if (char === '\\') { sanitized += char; escapeNext = true; }
                else if (char === '"') { sanitized += char; inString = false; }
                else if (char === '\n') { sanitized += '\\n'; }
                else if (char === '\r') { sanitized += '\\r'; }
                else if (char === '\t') { sanitized += '\\t'; }
                else { sanitized += char; }
            } else {
                if (char === '"') { inString = true; sanitized += char; }
                else { sanitized += char; }
            }
        }
        bibleData = JSON.parse(sanitized);
      } catch (e2: any) {
        console.error("Failed to parse Visual Bible JSON even after sanitization", e2.message, "\nRAW:\n", response.textContent);
        return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
      }
    }

    const visualBible = await prisma.$transaction(async (tx) => {
      const vb = await tx.productionVisualBible.upsert({
        where: { project_id: projectId },
        create: {
          project_id: projectId,
          script_id: script.id
        },
        update: {}
      });

      await tx.productionVisualBibleVersion.create({
        data: {
          visual_bible_id: vb.id,
          style_bible: bibleData.style_bible,
          character_bible: bibleData.character_bible,
          location_bible: bibleData.location_bible,
          prop_bible: bibleData.prop_bible,
          costume_bible: bibleData.costume_bible,
          cinematography_bible: bibleData.cinematography_bible,
          lighting_bible: bibleData.lighting_bible,
          art_direction_bible: bibleData.art_direction_bible,
          audio_bible: bibleData.audio_bible,
          vfx_bible: bibleData.vfx_bible,
          status: "Draft",
          version_number: 1
        }
      });

      return vb;
    });

    return NextResponse.json({ success: true, visualBible });

  } catch (error: any) {
    console.error("Visual Bible Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
