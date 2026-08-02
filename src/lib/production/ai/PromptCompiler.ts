import { GenerationContext, ProviderPayload } from "./GenerationContext";

export class PromptCompiler {
  
  static async compileFromContext(context: GenerationContext): Promise<ProviderPayload> {
    const { scene, shotMetadata, visualBible, characters, locations, generationSpecs, references } = context;
    
    // 1. Extract Styles from Visual Bible
    const vb = visualBible || {};
    const style = vb.style_bible?.look;
    const globalLighting = vb.lighting_bible?.style;

    const metadata = shotMetadata;

    // 3. Build Cinematic Prompt Dynamically
    const parts: string[] = [];
    
    // Core Style & Quality
    parts.push("A breathtaking cinematic masterpiece, 8k resolution, highly detailed, photorealistic.");
    if (style) {
      parts.push(`Overall visual style is ${style}.`);
    }

    // Camera & Lens
    if (metadata.camera.shotType || metadata.camera.lens || metadata.camera.angle || metadata.camera.composition || metadata.camera.framing || metadata.camera.focus) {
      const cam = [
        metadata.camera.shotType,
        metadata.camera.framing && `${metadata.camera.framing} framing`,
        metadata.camera.angle && `${metadata.camera.angle} angle`,
        metadata.camera.height && `${metadata.camera.height} height`,
        metadata.camera.distance && `${metadata.camera.distance} distance`,
        metadata.camera.lens && `shot on ${metadata.camera.lens} lens`,
        metadata.camera.focus && `${metadata.camera.focus} focus`,
        metadata.camera.composition && `${metadata.camera.composition} composition`
      ].filter(Boolean).join(", ");
      parts.push(`Captured as a ${cam}.`);
    }

    // Environment & Setting
    if (locations.length > 0 || scene?.description) {
      const locNames = locations.map(l => l.name).join(" and ");
      const setting = locNames ? `The setting is ${locNames}` : `The environment is detailed`;
      parts.push(`${setting}. ${scene?.description || ""}`);
    }

    // Characters & Action
    if (characters.length > 0) {
      const charDesc = characters.map(c => 
        `${c.name} (${c.description || "a person"}${c.outfit ? `, wearing ${c.outfit}` : ""})`
      ).join(" and ");
      parts.push(`The scene features ${charDesc}.`);
    }

    const characterBlocking = metadata.blocking.blocking;
    if (characterBlocking) {
      parts.push(`${characterBlocking}.`);
    }

    // Lighting & Mood
    const shotLighting = metadata.lighting.lighting || globalLighting;
    const mood = metadata.lighting.mood || scene?.mood;
    if (shotLighting || mood) {
      const lightDesc = shotLighting ? `The lighting is ${shotLighting}` : "";
      const moodDesc = mood ? `creating a ${mood} atmosphere` : "";
      parts.push([lightDesc, moodDesc].filter(Boolean).join(", ") + ".");
    }

    // Assemble image prompt
    const image_prompt = parts.join(" ").replace(/\s+/g, " ").trim();
    
    // Video prompt
    const motion = metadata.camera.movement ? `Camera movement is ${metadata.camera.movement}.` : "The camera is static.";
    const video_prompt = `${image_prompt} ${motion} Cinematic motion blur, fluid dynamics.`;

    const camera_motion_prompt = metadata.camera.movement ? `Camera Movement: ${metadata.camera.movement}` : "";

    // Default negative prompt
    const negative_prompt = "(worst quality, low quality:1.4), deformed, blurry, bad anatomy, bad lighting, text, watermark, signature, cartoon, illustration, amateur, poorly drawn";

    // Reconstruct the ProviderPayload
    return {
      prompt: image_prompt,
      negative_prompt,
      generation_specs: generationSpecs || {
        model: "FLUX Dev",
        provider: "replicate",
        workflow: "txt2img",
        width: 1920,
        height: 1080,
        aspect_ratio: "16:9",
        steps: 30,
        cfg: 3.5,
        sampler: "DPM++ 2M Karras",
        scheduler: "Karras",
        seed: "Auto",
        output_format: "PNG",
        quality: "standard"
      },
      camera_specs: {
        shot_type: metadata.camera.shotType,
        lens: metadata.camera.lens,
        camera_angle: metadata.camera.angle,
        camera_height: metadata.camera.height,
        camera_distance: metadata.camera.distance,
        movement: metadata.camera.movement,
        composition: metadata.camera.composition,
        framing: metadata.camera.framing,
        focus: metadata.camera.focus,
        notes: metadata.references.notes
      },
      generation_context: context,
      references: references || {},
      
      // Legacy Extra Fields generated for the current DB structure
      video_prompt,
      camera_motion_prompt,
      voice_prompt: null,
      narration_prompt: null,
      dialogue_prompt: scene?.scene_number ? `Dialogue for scene ${scene.scene_number}` : null,
      music_prompt: mood ? `Cinematic score, mood: ${mood}.` : null,
      background_score_prompt: mood ? `Cinematic score, mood: ${mood}.` : null,
      sound_design_prompt: `Atmospheric sound design for ${scene?.scene_type || 'interior'}.`,
      foley_prompt: characterBlocking ? `Foley sounds for ${characterBlocking}` : null,
      thumbnail_prompt: image_prompt,
      poster_prompt: `Cinematic movie poster. ${image_prompt}`,
      provider_parameters: {
        characters_used: characters.map(c => c.name),
        locations_used: locations.map(l => l.name),
        visual_bible_applied: !!style,
        camera_specs: {
          shot_type: metadata.camera.shotType,
          lens: metadata.camera.lens,
          camera_angle: metadata.camera.angle,
          camera_height: metadata.camera.height,
          camera_distance: metadata.camera.distance,
          movement: metadata.camera.movement,
          composition: metadata.camera.composition,
          framing: metadata.camera.framing,
          focus: metadata.camera.focus,
          notes: metadata.references.notes
        },
        generation_specs: generationSpecs || {
          model: "FLUX Dev",
          provider: "replicate",
          workflow: "txt2img",
          width: 1920,
          height: 1080,
          aspect_ratio: "16:9",
          steps: 30,
          cfg: 3.5,
          sampler: "DPM++ 2M Karras",
          scheduler: "Karras",
          seed: "Auto",
          output_format: "PNG",
          quality: "standard"
        }
      }
    };
  }
}
