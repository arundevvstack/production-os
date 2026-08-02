import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { scriptId } = body;

    if (!scriptId) {
      return NextResponse.json({ error: "scriptId is required" }, { status: 400 });
    }

    const script = await prisma.productionScript.findUnique({
      where: { id: scriptId },
      include: {
        Characters: true,
        Locations: true,
        Props: true
      }
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Delete existing breakdown data so re-analysis always works
    await Promise.all([
      prisma.productionCharacter.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionLocation.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionProp.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionVehicle.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionAnimal.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionVFX.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionAudio.deleteMany({ where: { script_id: scriptId } }),
      prisma.productionCostume.deleteMany({ where: { Project: { id: projectId } } }),
      prisma.productionMakeup.deleteMany({ where: { Project: { id: projectId } } }),
    ]);

    let jsonString = "";

    // Try AI extraction — fail explicitly on error (NO mock data fallback)
    try {
      // Bootstrap providers from .env if DB table is empty (first run fix)
      await ProviderManager.ensureProvidersBootstrapped();

      const provider = await prisma.productionAIProvider.findFirst({
        where: { is_enabled: true, supported_asset_types: { has: "Text" } }
      }) ?? await prisma.productionAIProvider.findFirst({
        where: { name: "Google GenAI" }
      });

      if (!provider) {
        throw new Error("No AI provider configured. Please set GEMINI_API_KEY in your .env file.");
      }

      const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
      const adapter = ProviderManager.getAdapter(provider.name);
      const modelToUse = provider.supported_models?.[0] || "gemini-2.5-flash";

      // 1. Language Detection
      const scriptContent = script.content || "";
      const langPrompt = `Detect the primary language of this script. Return ONLY the language name (e.g. English, Malayalam, Tamil, Hindi, Arabic, Mixed). Script: ${scriptContent.substring(0, 5000)}`;
      const langResponse = await adapter.submitJob(apiKey, modelToUse, langPrompt, { generationConfig: { temperature: 0.1 } });
      const detectedLanguage = (langResponse.textContent || "Unknown").trim();

      // 2. Extraction Prompt
      const systemPrompt = `You are an expert multilingual film production breakdown extraction engine. 
The detected primary language of the script is: ${detectedLanguage}.
Your task is to exhaustively extract EVERY SINGLE production element.

CRITICAL ENTERPRISE RULES:
1. ORIGINAL LANGUAGE PRESERVATION: NEVER translate, normalize, autocorrect, or modify spelling. The 'name' field MUST be extracted EXACTLY as it appears in the original script text.
2. TRANSLITERATION: For non-English names (e.g., Malayalam), store the transliteration ONLY inside 'metadata.latin_name'.
3. EXACT TEXT SPAN EXTRACTION: For every entity, you MUST extract the exact textual span where it first appears into 'metadata.source.raw_text', along with 'scene' and 'line' if available.
4. VALIDATION FLAGS: Provide 'metadata.validation' flags: 'low_confidence' (true/false), 'scene_header' (true/false if it sounds like a scene slug).
5. GENERIC NAME PROHIBITION: NEVER use generic placeholder names for characters. NEVER use:
   - 'another', 'a third', 'one subject', 'the Gen Z individuals', 'person', 'subject'
   - 'man', 'woman', 'boy', 'girl', 'male', 'female' as the PRIMARY name (these may only be used in descriptions)
   - 'character', 'lead character', 'supporting character', 'background character'
   - 'crowd', 'group', 'people', 'extras' as individual character entries (use the crowd entity if referenced in the script as a single group)
   If an entity appears in the script with only a generic descriptor (e.g. "another person"), mark it as 'importance: Background' and 'metadata.validation.low_confidence: true'. Do NOT promote it to a named character.
6. DESCRIPTION COMPLETENESS: Every Character entry MUST include all available physical attributes extracted from the script:
   - description: Full physical description from the script text
   - role: Their narrative function
   - metadata.appearance: Any visual appearance details
   - metadata.gender: If mentioned
   - metadata.age: If mentioned
   - metadata.costume: If mentioned in the script
7. SCENE HEADER PROTECTION: NEVER classify scene headings (e.g. INT., EXT., CUT TO, FADE IN, FADE OUT, MONTAGE, TITLE CARD) as Characters.
8. CATEGORY RESTRICTIONS: NEVER classify 'Explosion' as Character. NEVER classify 'Gunshot' as Prop. Use VFX and Audio respectively.
9. CLASSIFICATION MAP:
   - Characters: Characters, Crowd, Extras, Children, Stunts
   - Locations: Locations, Sets
   - Props: Props, Weapons, Food, Documents, Graphics, Set Dressing, Furniture, Special Equipment, Action Elements
   - Vehicles: Vehicles, Drone
   - VFXs: VFX, CG, Fire, Smoke, Rain, Water, Weather, Environment
   - Audios: SFX (e.g. Gunshot), Music, Background Music, Ambient Sound
   - Costumes: Costumes, Wardrobe
   - Makeups: Makeup, Hair, Blood
   - Lightings: Lighting
   - Cameras: Camera Equipment
   - Continuities: Continuity Notes

Output EXACTLY a JSON object with these arrays:
{
  "characters": [{ "name": "Exact Original String", "description": "...", "importance": "Lead|Supporting|Background|Crowd|Extras", "role": "...", "metadata": { "latin_name": "...", "language": "...", "aliases": [], "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false, "scene_header": false } } }],
  "locations": [{ "name": "Exact Original String", "description": "...", "type": "INT|EXT", "time_of_day": "DAY|NIGHT", "metadata": { "latin_name": "...", "language": "...", "aliases": [], "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false, "scene_header": true } } }],
  "props": [{ "name": "Exact Original String", "category": "Hero Prop|Weapon|Food|Document|Set Dressing|Furniture|Special Equipment|Action Element", "is_hero": true, "metadata": { "latin_name": "...", "aliases": [], "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "vehicles": [{ "name": "Exact Original String", "description": "...", "metadata": { "latin_name": "...", "aliases": [], "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "animals": [{ "name": "Exact Original String", "species": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "vfxs": [{ "name": "Exact Original String", "cgi": "...", "fire": "...", "explosions": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "audios": [{ "name": "Exact Original String", "sfx": "...", "music": "...", "dialogue": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "costumes": [{ "name": "Exact Original String", "outfit": "...", "accessories": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "makeups": [{ "name": "Exact Original String", "makeup_style": "...", "blood": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "lightings": [{ "name": "Exact Original String", "mood": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "cameras": [{ "name": "Exact Original String", "equipment": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }],
  "continuities": [{ "name": "Exact Original String", "notes": "...", "metadata": { "latin_name": "...", "source": { "scene": 1, "raw_text": "Exact Original String" }, "validation": { "low_confidence": false } } }]
}
Do not include any markdown fences or extra text, just raw JSON.`;

      const userPrompt = `Here is the script content to analyze:\n\n${script.content}`;

      const response = await adapter.submitJob(apiKey, modelToUse, systemPrompt + "\n\n" + userPrompt, {
        generationConfig: { responseMimeType: "application/json" }
      });
      if (!response.textContent) throw new Error("No response received from AI");

      jsonString = response.textContent.trim();
      // Strip markdown fences if present
      jsonString = jsonString.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    } catch (apiError: any) {
      // ROOT CAUSE FIX: Do NOT fall back to generic/mock characters.
      // If AI extraction fails, the extraction must fail explicitly.
      // Returning generic names like "Lead Character" / "Supporting Character" poisons
      // the entire downstream pipeline (Visual Bible, Character Manager, Image Generation).
      console.error("[BreakdownAnalyze] AI extraction failed — no fallback will be used:", apiError.message);
      return NextResponse.json({
        error: `AI extraction failed: ${apiError.message}. Please ensure Google GenAI provider is configured and the script has content.`,
        ai_error: true
      }, { status: 503 });
    }

    let extracted: any = {};
    try {
      extracted = JSON.parse(jsonString);
    } catch (e) {
      console.warn("Failed first pass of JSON parse, attempting to sanitize control characters...");
      try {
        let sanitized = '';
        let inString = false;
        let escapeNext = false;
        for (let i = 0; i < jsonString.length; i++) {
            const char = jsonString[i];
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
        extracted = JSON.parse(sanitized);
      } catch (e2: any) {
        console.error("Failed to parse Breakdown JSON even after sanitization", e2.message, "\nRAW:\n", jsonString);
        return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
      }
    }

    const scriptText = script.content || "";

    // QA Engine Validation function
    const performQA = (item: any) => {
      if (!item.metadata) item.metadata = {};
      if (!item.metadata.validation) item.metadata.validation = {};
      
      const originalText = item.name || "";
      const rawText = item.metadata.source?.raw_text || "";
      
      // Strict Spelling Validation: Compare exact Unicode
      if (rawText !== originalText || !scriptText.includes(originalText)) {
        item.metadata.validation.spelling_changed = true;
        item.metadata.validation.low_confidence = true;
        item.metadata.validation.needs_review = true;
        item.metadata.validation.reason = "Original Unicode mismatch. AI altered spelling or guessed string not in script.";
      }
      return item;
    };

    // Generic Deduplication & QA helper
    const deduplicate = (arr: any[]) => {
      if (!arr || !Array.isArray(arr)) return [];
      const map = new Map();
      arr.forEach((item: any) => {
        const key = (item.metadata?.latin_name || item.name || '').toLowerCase().trim();
        if (key) {
          if (map.has(key)) {
            const existing = map.get(key);
            existing.metadata.aliases = [...new Set([...(existing.metadata.aliases || []), item.name])];
            existing.metadata.validation.duplicate = true;
          } else {
            map.set(key, performQA(item));
          }
        }
      });
      return Array.from(map.values());
    };

    extracted.characters = deduplicate(extracted.characters);
    extracted.locations = deduplicate(extracted.locations);
    extracted.props = deduplicate(extracted.props);
    extracted.vehicles = deduplicate(extracted.vehicles);
    extracted.animals = deduplicate(extracted.animals);
    extracted.vfxs = deduplicate(extracted.vfxs);
    extracted.audios = deduplicate(extracted.audios);
    extracted.costumes = deduplicate(extracted.costumes);
    extracted.makeups = deduplicate(extracted.makeups);
    extracted.lightings = deduplicate(extracted.lightings);
    extracted.cameras = deduplicate(extracted.cameras);
    extracted.continuities = deduplicate(extracted.continuities);

    // ROOT CAUSE FIX: Generic Entity Filter
    // Detect and remove any character whose name is a generic placeholder that the
    // AI produced despite instructions. These names have zero visual identity and
    // would produce corrupt prompts and garbage images downstream.
    const GENERIC_CHARACTER_NAMES = new Set([
      'another', 'a third', 'one subject', 'subject', 'person', 'man', 'woman',
      'boy', 'girl', 'male', 'female', 'character', 'lead character', 'supporting character',
      'background character', 'extra', 'unnamed', 'unknown', 'unnamed character',
      'general elements', 'lead', 'supporting', 'crowd member', 'the gen z individuals',
      'gen z individuals', 'a second person', 'another person', 'third person',
      'first person', 'second person', 'a person', 'individual', 'subject one',
      'subject two', 'subject three', 'hero prop', 'primary location'
    ]);

    const beforeFilter = extracted.characters.length;
    extracted.characters = extracted.characters.filter((c: any) => {
      const nameLower = (c.name || '').toLowerCase().trim();
      if (GENERIC_CHARACTER_NAMES.has(nameLower)) {
        console.warn(`[BreakdownAnalyze] FILTERED generic character: "${c.name}" — not writing to database.`);
        return false;
      }
      // Also filter any single-word purely generic role descriptor
      if (/^(man|woman|boy|girl|child|adult|male|female|person|individual|character)$/i.test(nameLower)) {
        console.warn(`[BreakdownAnalyze] FILTERED generic role-as-name: "${c.name}" — not writing to database.`);
        return false;
      }
      return true;
    });
    if (beforeFilter !== extracted.characters.length) {
      console.warn(`[BreakdownAnalyze] Filtered ${beforeFilter - extracted.characters.length} generic character(s) from extraction.`);
    }

    // Write Characters — full metadata enrichment for downstream prompt pipeline
    if (extracted.characters.length > 0) {
      await prisma.productionCharacter.createMany({
        data: extracted.characters.map((c: any) => ({
          script_id: script.id,
          project_id: projectId,
          name: c.name || "Unknown",
          description: c.description || "",
          importance: c.importance || "Supporting",
          // Visual fields — these are consumed by buildCharacterPrompt() in Character Manager
          gender: c.metadata?.gender || c.gender || null,
          age: c.metadata?.age || c.age || null,
          personality: c.metadata?.personality || c.personality || null,
          metadata: {
            // Identity
            latin_name: c.metadata?.latin_name || null,
            role: c.role || c.metadata?.role || null,
            language: c.metadata?.language || 'Unknown',
            aliases: c.metadata?.aliases || [],
            source: c.metadata?.source || null,
            validation: c.metadata?.validation || { low_confidence: false },
            // Visual appearance — all available fields
            appearance: c.metadata?.appearance || c.appearance || null,
            face: c.metadata?.face || null,
            body: c.metadata?.body || null,
            hair: c.metadata?.hair || c.metadata?.hair_color || null,
            eyes: c.metadata?.eyes || c.metadata?.eye_color || null,
            skin: c.metadata?.skin || c.metadata?.skin_tone || null,
            ethnicity: c.metadata?.ethnicity || null,
            expression: c.metadata?.expression || null,
            pose: c.metadata?.pose || null,
            // Costume / wardrobe from AI extraction
            costume: c.metadata?.costume || c.metadata?.wardrobe || null,
            accessories: c.metadata?.accessories || null,
            // Narrative
            personality: c.metadata?.personality || c.personality || null,
            traits: c.metadata?.traits || null,
          }
        }))
      });
    }

    // Write Locations
    if (extracted.locations.length > 0) {
      await prisma.productionLocation.createMany({
        data: extracted.locations.map((l: any) => ({
          script_id: script.id,
          project_id: projectId,
          name: l.name || "Unknown",
          description: l.description || "",
          type: l.type || "INT",
          time_of_day: l.time_of_day || "DAY",
          metadata: { 
            latin_name: l.metadata?.latin_name || null,
            aliases: l.metadata?.aliases || [],
            source: l.metadata?.source || null,
            validation: l.metadata?.validation || { low_confidence: false }
          }
        }))
      });
    }

    // Write Props
    if (extracted.props.length > 0) {
      await prisma.productionProp.createMany({
        data: extracted.props.map((p: any) => ({
          script_id: script.id,
          project_id: projectId,
          name: p.name || "Unknown",
          category: p.category || "Set Dressing",
          is_hero: p.is_hero || false,
          continuity_notes: p.metadata ? JSON.stringify(p.metadata) : null,
        }))
      });
    }

    // Write Vehicles
    if (extracted.vehicles.length > 0) {
      await prisma.productionVehicle.createMany({
        data: extracted.vehicles.map((v: any) => ({
          script_id: script.id,
          project_id: projectId,
          name: v.name || "Unknown",
          description: v.metadata ? JSON.stringify(v.metadata) : (v.description || ""),
        }))
      });
    }

    // Write Animals
    if (extracted.animals.length > 0) {
      await prisma.productionAnimal.createMany({
        data: extracted.animals.map((a: any) => ({
          script_id: script.id,
          project_id: projectId,
          species: a.species || a.name || "Unknown",
          description: a.metadata ? JSON.stringify(a.metadata) : (a.description || ""),
        }))
      });
    }

    // Write VFX
    if (extracted.vfxs.length > 0) {
      await prisma.productionVFX.createMany({
        data: extracted.vfxs.map((v: any) => ({
          script_id: script.id,
          project_id: projectId,
          cgi: v.cgi || v.name || "",
          fire: v.fire || "",
          explosions: v.explosions || "",
          particles: v.metadata ? JSON.stringify(v.metadata) : null,
        }))
      });
    }

    // Write Audio
    if (extracted.audios.length > 0) {
      await prisma.productionAudio.createMany({
        data: extracted.audios.map((a: any) => ({
          script_id: script.id,
          project_id: projectId,
          sfx: a.sfx || a.name || "",
          music: a.music || "",
          dialogue: a.dialogue || "",
          ambience: a.metadata ? JSON.stringify(a.metadata) : null,
        }))
      });
    }

    // ROOT CAUSE FIX: Costumes and Makeups require a character ID in Prisma.
    // NEVER create a phantom "General Elements" character — it contaminates the Character Manager
    // and Visual Bible with a fake, non-visual entity.
    // Instead: link costume/makeup to the FIRST REAL extracted character.
    // If no real characters exist, skip costume/makeup insertion entirely.
    const firstRealChar = await prisma.productionCharacter.findFirst({
      where: {
        project_id: projectId,
        name: { not: "General Elements" }  // exclude any legacy phantom
      },
      orderBy: { created_at: "asc" }
    });

    if (extracted.costumes.length > 0 && firstRealChar) {
      await prisma.productionCostume.createMany({
        data: extracted.costumes.map((c: any) => ({
          project_id: projectId,
          character_id: firstRealChar.id,
          outfit: c.outfit || c.name || "Unknown",
          accessories: c.accessories || "",
          notes: c.metadata ? JSON.stringify(c.metadata) : null,
        }))
      });
    } else if (extracted.costumes.length > 0) {
      console.warn(`[BreakdownAnalyze] ${extracted.costumes.length} costumes skipped — no real characters extracted to link them to.`);
    }

    if (extracted.makeups.length > 0 && firstRealChar) {
      await prisma.productionMakeup.createMany({
        data: extracted.makeups.map((m: any) => ({
          project_id: projectId,
          character_id: firstRealChar.id,
          makeup_style: m.makeup_style || m.name || "Unknown",
          blood: m.blood || "",
          dirt: m.metadata ? JSON.stringify(m.metadata) : null,
        }))
      });
    } else if (extracted.makeups.length > 0) {
      console.warn(`[BreakdownAnalyze] ${extracted.makeups.length} makeups skipped — no real characters extracted to link them to.`);
    }

    if (extracted.lightings?.length > 0) {
      await prisma.productionLighting.createMany({
        data: extracted.lightings.map((l: any) => ({
          script_id: script.id,
          project_id: projectId,
          lighting_style: l.name || "Unknown",
          mood: l.mood || "",
          color_temp: l.metadata ? JSON.stringify(l.metadata) : null,
        }))
      });
    }

    if (extracted.cameras?.length > 0) {
      await prisma.productionCameraPlan.createMany({
        data: extracted.cameras.map((c: any) => ({
          script_id: script.id,
          project_id: projectId,
          camera_style: c.name || "Unknown",
          framing: c.metadata ? JSON.stringify(c.metadata) : null,
        }))
      });
    }

    if (extracted.continuities?.length > 0) {
      await prisma.productionContinuity.createMany({
        data: extracted.continuities.map((c: any) => ({
          project_id: projectId,
          entity_type: "Script",
          entity_id: script.id,
          notes: c.metadata ? JSON.stringify(c.metadata) : (c.notes || c.name || ""),
        }))
      });
    }

    // Revalidate both the breakdown page and the layout (which drives WorkflowEngine state)
    revalidatePath(`/projects/${projectId}/breakdown`);
    revalidatePath(`/projects/${projectId}`, "layout");

    const writtenCharacters = await prisma.productionCharacter.count({ where: { script_id: scriptId } });
    const writtenLocations = await prisma.productionLocation.count({ where: { script_id: scriptId } });
    const writtenProps = await prisma.productionProp.count({ where: { script_id: scriptId } });

    return NextResponse.json({
      success: true,
      message: "Breakdown extracted successfully",
      counts: { characters: writtenCharacters, locations: writtenLocations, props: writtenProps }
    });
  } catch (error: any) {
    console.error("[BreakdownAnalyze] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
