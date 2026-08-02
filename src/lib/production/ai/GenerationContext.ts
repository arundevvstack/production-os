import { ShotMetadata } from "../metadata/ShotMetadata";

export interface GenerationContext {
  workspace: any;
  visualBible: any;
  characters: any[];
  locations: any[];
  scene: any;
  shotMetadata: ShotMetadata;
  generationSpecs: any;
  references: any;
}

export interface ProviderPayload {
  prompt: string;
  negative_prompt: string;
  generation_specs: any;
  camera_specs?: any;
  generation_context: GenerationContext;
  references: any;
  // Extra fields that PromptCompiler historically produced for ProductionPromptVersion
  video_prompt?: string;
  camera_motion_prompt?: string;
  voice_prompt?: string | null;
  narration_prompt?: string | null;
  dialogue_prompt?: string | null;
  music_prompt?: string | null;
  background_score_prompt?: string | null;
  sound_design_prompt?: string | null;
  foley_prompt?: string | null;
  thumbnail_prompt?: string | null;
  poster_prompt?: string | null;
  provider_parameters?: any;
}

/**
 * Factory function to construct a canonical GenerationContext.
 * This ensures that filtering of characters and locations happens outside the PromptCompiler.
 */
export function buildGenerationContext(
  workspace: any,
  visualBible: any,
  allCharacters: any[],
  allLocations: any[],
  scene: any,
  shotMetadata: ShotMetadata,
  generationSpecs: any,
  references: any
): GenerationContext {
  
  // Filter active characters based on shot blocking
  const characterBlocking = shotMetadata.blocking?.blocking || "";
  const activeCharacters = characterBlocking
    ? allCharacters.filter(c => characterBlocking.toLowerCase().includes(c.name.toLowerCase()))
    : [];

  // Filter active locations based on scene description or title
  const activeLocations = allLocations.filter(l => 
    (scene.title && scene.title.toLowerCase().includes(l.name.toLowerCase())) ||
    (scene.description && scene.description.toLowerCase().includes(l.name.toLowerCase()))
  );

  return {
    workspace,
    visualBible,
    characters: activeCharacters,
    locations: activeLocations,
    scene,
    shotMetadata,
    generationSpecs,
    references
  };
}
