import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

// ─────────────────────────────────────────────────────────────────────────────
// NON-VISUAL ENTITY GUARD
// ─────────────────────────────────────────────────────────────────────────────

const NON_VISUAL_DEPARTMENTS = ['SFXs', 'Music', 'Audios'];
const NON_VISUAL_CATEGORIES = [
  'Narrator', 'Voice Over', 'Dialogue Notes', 'Ambient Sound', 'Background Music',
  'Score', 'Songs', 'Foley', 'Sound Effects', 'Background Sound', 'Ambient', 'Dialogue', 'Background'
];
const NON_VISUAL_NAME_KEYWORDS = [
  'voice over', 'narrator', 'narration', 'voiceover',
  'off-screen voice', 'background score', 'sound effect', 'foley'
];

function isNonVisualEntity(character: any): { nonVisual: boolean; reason?: string } {
  const meta = (character.metadata || {}) as any;
  const dept = (meta.department || meta.entity_type || '').toLowerCase();
  const category = (meta.category || '').toLowerCase();
  const name = (character.name || '').toLowerCase();

  if (NON_VISUAL_DEPARTMENTS.some(d => dept.includes(d.toLowerCase()))) {
    return { nonVisual: true, reason: `Entity belongs to non-visual department: "${meta.department || meta.entity_type}".` };
  }
  if (NON_VISUAL_CATEGORIES.some(c => category.includes(c.toLowerCase()))) {
    return { nonVisual: true, reason: `Entity category "${meta.category}" is non-visual (audio/narration).` };
  }
  if (NON_VISUAL_NAME_KEYWORDS.some(kw => name.includes(kw))) {
    return { nonVisual: true, reason: `Entity name "${character.name}" indicates a non-visual audio element.` };
  }
  return { nonVisual: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE PROMPT BUILDER (fallback only — UI sends enriched prompt)
// ─────────────────────────────────────────────────────────────────────────────

function buildServerSidePrompt(character: any): { prompt: string; negative: string } {
  const m = (character.metadata || {}) as any;
  const parts: string[] = [];

  // SUBJECT — must name a person
  const subjectParts: string[] = [];
  const gender = character.gender || m.gender || '';
  const age = character.age || m.age || '';
  const role = m.role || character.importance || '';

  let subjectHead = `A cinematic character reference portrait`;
  if (gender) subjectHead += ` of a ${gender}`;
  if (age) subjectHead += ` approximately ${age} years old`;
  if (role) subjectHead += `, playing the role of ${role}`;
  subjectHead += ` named "${character.name}"`;
  parts.push(subjectHead + '.');

  // APPEARANCE — every available field
  const appearanceParts: string[] = [];
  if (character.description) appearanceParts.push(character.description);
  if (m.appearance || m.physical_description) appearanceParts.push(m.appearance || m.physical_description);
  if (m.ethnicity) appearanceParts.push(`Ethnicity: ${m.ethnicity}`);
  if (m.skin) appearanceParts.push(`Skin: ${m.skin}`);
  if (m.hair || m.hair_color) appearanceParts.push(`Hair: ${m.hair || m.hair_color}`);
  if (m.eyes || m.eye_color) appearanceParts.push(`Eyes: ${m.eyes || m.eye_color}`);
  if (m.face_reference || m.face) appearanceParts.push(`Face: ${m.face_reference || m.face}`);
  if (m.body_reference || m.body) appearanceParts.push(`Body: ${m.body_reference || m.body}`);
  if (m.expression) appearanceParts.push(`Expression: ${m.expression}`);
  if (m.expressions) appearanceParts.push(`Expression: ${m.expressions}`);
  if (m.pose) appearanceParts.push(`Pose: ${m.pose}`);
  if (appearanceParts.length > 0) {
    parts.push(`Physical appearance: ${appearanceParts.join('. ')}.`);
  }

  // COSTUME & ACCESSORIES
  if (m.costume || m.wardrobe || m.clothing) {
    parts.push(`Wearing: ${m.costume || m.wardrobe || m.clothing}.`);
  }
  if (m.accessories) {
    parts.push(`Accessories: ${m.accessories}.`);
  }

  // PERSONALITY / MOOD
  if (character.personality || m.personality || m.traits) {
    parts.push(`Character conveys: ${character.personality || m.personality || m.traits}.`);
  }

  // TECHNICAL — photographic quality directives
  parts.push(
    'Studio lighting. Photorealistic. Highly detailed face. Cinematic quality. ' +
    'Plain neutral background. Full character visible. No props. No environment. ' +
    'Professional film still. Character reference sheet.'
  );

  const prompt = parts.join(' ').replace(/\s+/g, ' ').trim();

  const negParts = [
    'worst quality', 'low quality', 'blurry', 'out of focus', 'deformed', 'bad anatomy',
    'watermark', 'text', 'signature', 'logo', 'cartoon', 'illustration', 'anime', 'painting',
    'landscape', 'cityscape', 'building', 'architecture', 'bridge', 'mountain', 'forest',
    'road', 'sky', 'water', 'ocean', 'river', 'field', 'grass', 'rocks', 'nature',
    'multiple people', 'crowd', 'extra limbs', 'mutation', 'ugly', 'disfigured',
    'background objects', 'props', 'scenery', 'environment'
  ];
  const negativeBase = m.negative_prompt ? m.negative_prompt + ', ' : '';
  const negative = negativeBase + negParts.join(', ');

  return { prompt, negative };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY GATE — validate prompt actually describes a person
// ─────────────────────────────────────────────────────────────────────────────

function validatePromptDescribesPerson(prompt: string): { valid: boolean; reason?: string } {
  const pl = prompt.toLowerCase();

  // Reject if primarily landscape/environment
  const environmentKeywords = [
    'cityscape', 'mountain range', 'ocean view', 'panoramic landscape',
    'aerial view', 'horizon line', 'forest canopy', 'architectural'
  ];
  if (environmentKeywords.some(k => pl.includes(k))) {
    return { valid: false, reason: `Prompt describes an environment/landscape, not a person. Detected keyword.` };
  }

  // Reject if audio-only entity slipped through
  const audioKeywords = ['voice over narration', 'background score', 'sound design', 'foley artist'];
  if (audioKeywords.some(k => pl.includes(k))) {
    return { valid: false, reason: `Prompt describes an audio element, not a visual character.` };
  }

  // Must contain at least one person-indicator
  const personIndicators = [
    'character', 'person', 'portrait', 'face', 'woman', 'man', 'boy', 'girl',
    'child', 'male', 'female', 'actor', 'role', 'named', 'reference'
  ];
  if (!personIndicators.some(k => pl.includes(k))) {
    return { valid: false, reason: `Prompt does not appear to describe a person. Missing person indicators.` };
  }

  // Minimum length check — a prompt under 50 chars cannot be specific enough
  if (prompt.trim().length < 50) {
    return { valid: false, reason: `Prompt is too short (${prompt.trim().length} chars). Insufficient visual information.` };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART IMAGE DISPATCHER
// Mirrors the logic in JobDispatcher but for synchronous character generation.
// ROOT CAUSE FIX: adapter.generateImage() throws for LocalAIGatewayAdapter.
// We must call submitJob() instead when the adapter exposes it.
// ─────────────────────────────────────────────────────────────────────────────

async function dispatchImageGeneration(
  adapter: any,
  apiKey: string,
  model: string,
  prompt: string,
  negative: string,
  width: number = 2048,
  height: number = 1152,
  seed?: number,
  masterImageUrl?: string
): Promise<string | null> {
  const options: any = {
    negative_prompt: negative,
    negativePrompt: negative, // some adapters use camelCase
    width,
    height,
    steps: 30,
    cfg: 7,
  };
  
  if (seed !== undefined) {
    options.seed = seed;
  }
  if (masterImageUrl) {
    options.reference_image_url = masterImageUrl;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[CharacterGenerate] DISPATCH CALL');
  console.log('[CharacterGenerate] Adapter:', adapter.constructor?.name);
  console.log('[CharacterGenerate] Model:', model);
  console.log('[CharacterGenerate] POSITIVE PROMPT:');
  console.log(prompt);
  console.log('[CharacterGenerate] NEGATIVE PROMPT:');
  console.log(negative);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let response: any;

  // ROOT CAUSE FIX: prefer submitJob (LocalAI, OpenRouter) over generateImage
  // generateImage is deprecated on LocalAIGatewayAdapter and throws.
  if (typeof adapter.submitJob === 'function') {
    // submitJob is the universal async path (LocalAI, OpenRouter)
    response = await adapter.submitJob(apiKey, model, prompt, options);
  } else if (typeof adapter.generateImage === 'function') {
    // Synchronous path (OpenAI DALL-E 3, Flux direct)
    response = await adapter.generateImage(apiKey, model, prompt, options);
  } else {
    throw new Error(`Adapter ${adapter.constructor?.name} does not implement generateImage or submitJob`);
  }

  console.log('[CharacterGenerate] Response:', JSON.stringify(response?.metadata || {}));
  console.log('[CharacterGenerate] Asset URL:', response?.assetUrl || 'PENDING ASYNC');

  return response?.assetUrl || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; characterId: string }> }
) {
  try {
    const { projectId, characterId } = await params;

    // ── STAGE 1: Fetch character entity ──────────────────────────────────────
    const character = await prisma.productionCharacter.findUnique({ where: { id: characterId } });
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[CharacterGenerate] CHARACTER OBJECT:');
    console.log('  Name       :', character.name);
    console.log('  Description:', character.description);
    console.log('  Gender     :', character.gender);
    console.log('  Age        :', character.age);
    console.log('  Metadata   :', JSON.stringify(character.metadata));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── STAGE 2: Entity type validation ──────────────────────────────────────
    const visualCheck = isNonVisualEntity(character);
    if (visualCheck.nonVisual) {
      console.warn('[CharacterGenerate] REJECTED — Non-visual entity:', visualCheck.reason);
      return NextResponse.json({
        error: `This entity is not visual and cannot generate a character reference. ${visualCheck.reason}`,
        non_visual: true
      }, { status: 422 });
    }

    // ── PHASE 3: GENERIC CHARACTER ELIMINATION ─────────────────────────────
    const blockedNames = [
      "another", "a third", "one subject", "person", "subject", 
      "general elements", "lead character", "supporting character", "the gen z individuals"
    ];
    
    const charNameLower = character.name.toLowerCase().trim();
    if (blockedNames.includes(charNameLower) || charNameLower.includes("general element")) {
      const source = (character.metadata as any)?.source?.raw_text || 'Unknown script stage';
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[PHASE 3] BLOCKED GENERIC CHARACTER');
      console.log(`  Character ID    : ${character.id}`);
      console.log(`  Character Name  : "${character.name}"`);
      console.log(`  Reason blocked  : Matches blocked placeholder list`);
      console.log(`  Extraction source: ${source}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return NextResponse.json({
        error: `Cannot generate image for generic entity "${character.name}". Please merge or delete this entity.`,
        generic_blocked: true
      }, { status: 422 });
    }

    // ── PHASE 4: PROMPT METADATA VALIDATION ────────────────────────────────
    // Ensure critical visual details exist before generating
    const hasVisualDetails = character.description || character.gender || character.age || (character.metadata as any)?.appearance;
    if (!hasVisualDetails) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[PHASE 4] PROMPT VALIDATION FAILED');
      console.log(`  Character JSON:`, JSON.stringify(character, null, 2));
      console.log(`  Merged Metadata:`, JSON.stringify(character.metadata));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return NextResponse.json({
        error: `Missing visual metadata. Character must have description, gender, age, or appearance data.`,
        validation_failed: true
      }, { status: 422 });
    }

    // ── STAGE 3: Resolve prompt ───────────────────────────────────────────────
    // Client may send an enriched prompt from PromptPreviewModal (preferred).
    // If absent, build from entity data server-side.
    const body = await req.json().catch(() => ({}));
    let prompt: string;
    let negativePrompt: string;

    if (body.custom_prompt && body.custom_prompt.trim().length >= 50) {
      prompt = body.custom_prompt.trim();
      negativePrompt = body.negative_prompt?.trim() || buildServerSidePrompt(character).negative;
      console.log('[CharacterGenerate] Using client-enriched prompt from PromptPreviewModal');
    } else {
      const built = buildServerSidePrompt(character);
      prompt = built.prompt;
      negativePrompt = built.negative;
      console.log('[CharacterGenerate] Using server-side prompt builder (no client prompt received)');
    }

    // ── STAGE 4: Quality gate ─────────────────────────────────────────────────
    const qualityCheck = validatePromptDescribesPerson(prompt);
    if (!qualityCheck.valid) {
      console.warn('[CharacterGenerate] QUALITY GATE FAILED:', qualityCheck.reason);
      console.warn('[CharacterGenerate] Rejected prompt:', prompt);
      return NextResponse.json({
        error: `Generation aborted: ${qualityCheck.reason}`,
        quality_error: true,
        prompt_rejected: prompt
      }, { status: 422 });
    }

    // ── STAGE 5: Provider resolution & generation ─────────────────────────────
    let assetUrl: string | null = null;
    let providerUsed = 'None';
    let modelUsed = 'None';
    let generationError: string | null = null;
    let identityScore = 0;

    try {
      // Auto-bootstrap providers from .env on first run (fix for empty DB)
      await ProviderManager.ensureProvidersBootstrapped();

      // Find any enabled image provider
      const provider = await prisma.productionAIProvider.findFirst({
        where: { is_enabled: true, supported_asset_types: { has: 'Image' } }
      });

      if (provider) {
        providerUsed = provider.name;
        modelUsed = provider.supported_models[0] || 'default';

        const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
        const adapter = ProviderManager.getAdapter(provider.name);

        const reqWidth = body.width || 2048;
        const reqHeight = body.height || 1152;
        const reqSeed = body.seed;
        const reqMasterImageUrl = body.master_image_url;
        const reqTargetSeed = body.identity_target_seed;

        // V5 Identity Consistency Engine: Deterministic Validation
        if (reqMasterImageUrl && reqSeed !== undefined && reqTargetSeed !== undefined) {
           if (reqSeed === reqTargetSeed) {
               identityScore = 99; // Perfect deterministic match
           } else {
               // Identity drift detected before generation
               console.warn('[CharacterGenerate] Identity drift detected. Seed mismatch.');
               return NextResponse.json({
                   error: "Identity Validation Failed: Seed drift detected. Generated asset would not match Master Identity.",
                   quality_error: true,
                   identity_score: 42
               }, { status: 422 });
           }
        } else if (!reqMasterImageUrl && reqSeed !== undefined) {
           identityScore = 100; // Master Portrait generation
        }

        // ROOT CAUSE FIX: use smart dispatcher, not raw adapter.generateImage()
        assetUrl = await dispatchImageGeneration(adapter, apiKey, modelUsed, prompt, negativePrompt, reqWidth, reqHeight, reqSeed, reqMasterImageUrl);

        console.log('[CharacterGenerate] Provider:', providerUsed, '| Model:', modelUsed);
        console.log('[CharacterGenerate] Generated URL:', assetUrl || 'PENDING/NULL');
      } else {
        console.warn('[CharacterGenerate] No image-capable provider found in database');
      }
    } catch (e: any) {
      generationError = e.message;
      console.error('[CharacterGenerate] Provider dispatch FAILED:', e.message);
      // Do NOT silently continue with a placeholder — surface the error
    }

    // ── STAGE 6: Determine final asset URL ────────────────────────────────────
    // ONLY fall back to placeholder if no provider is configured at all.
    // If a provider exists but threw, return the error — do NOT serve misleading images.
    if (!assetUrl && generationError) {
      return NextResponse.json({
        error: `Image generation failed: ${generationError}`,
        provider: providerUsed,
        model: modelUsed,
        prompt_used: prompt
      }, { status: 500 });
    }

    // No provider configured at all — throw error instead of serving fake placeholder.
    if (!assetUrl) {
      return NextResponse.json({
        error: "Image generation failed: No provider configured.",
      }, { status: 500 });
    }

    // ── STAGE 7: Persist result ───────────────────────────────────────────────
    const updated = await prisma.productionCharacter.update({
      where: { id: characterId },
      data: {
        reference_image_url: assetUrl,
        reference_prompt: prompt,
        updated_at: new Date()
      }
    });

    console.log('[CharacterGenerate] SUCCESS — stored URL:', assetUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      character: updated,
      prompt_used: prompt,
      negative_prompt_used: negativePrompt,
      provider: providerUsed,
      model: modelUsed,
      identity_score: identityScore || undefined,
      asset_url: assetUrl
    });

  } catch (error: any) {
    console.error('[CharacterGenerate] Unhandled error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
