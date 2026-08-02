export interface ShotMetadata {
  camera: {
    shotType: string;
    angle: string;
    lens: string;
    height: string;
    distance: string;
    movement: string;
    framing: string;
    composition: string;
    focus: string;
  };
  lighting: {
    lighting: string;
    mood: string;
  };
  blocking: {
    action: string;
    blocking: string;
  };
  references: {
    thumbnail: string;
    notes: string;
  };
}

export const createEmptyShotMetadata = (): ShotMetadata => ({
  camera: {
    shotType: "",
    angle: "",
    lens: "",
    height: "",
    distance: "",
    movement: "",
    framing: "",
    composition: "",
    focus: "",
  },
  lighting: {
    lighting: "",
    mood: "",
  },
  blocking: {
    action: "",
    blocking: "",
  },
  references: {
    thumbnail: "",
    notes: "",
  }
});

/**
 * Deserializes a Prisma ProductionShotVersion into the canonical ShotMetadata object.
 * Maps top-level strings and extracts JSON data seamlessly from the `fx` column.
 */
export const deserializeShotMetadata = (version: any): ShotMetadata => {
  const metadata = createEmptyShotMetadata();
  if (!version) return metadata;

  // Top level Prisma schema mapping
  metadata.camera.shotType = version.shot_type || "";
  metadata.camera.angle = version.camera_angle || "";
  metadata.camera.lens = version.lens || "";
  metadata.camera.movement = version.movement || "";
  metadata.camera.composition = version.composition || "";
  metadata.camera.framing = version.frame_size || "";
  metadata.camera.focus = version.focus || "";
  
  metadata.lighting.lighting = version.lighting || "";
  metadata.blocking.blocking = version.character_blocking || "";
  
  // Storage Implementation: `fx` JSON field mapping
  if (version.fx) {
    try {
      const fxData = JSON.parse(version.fx);
      metadata.camera.height = fxData.camera_height || "";
      metadata.camera.distance = fxData.camera_distance || "";
      metadata.lighting.mood = fxData.mood || "";
      metadata.blocking.action = fxData.action || "";
      metadata.references.notes = fxData.notes || "";
      // Fallback for fields stored in fx during migration
      if (!metadata.blocking.blocking && fxData.blocking) {
        metadata.blocking.blocking = fxData.blocking;
      }
    } catch (e) {
      console.warn("Failed to parse fx data in deserializeShotMetadata", e);
    }
  }

  return metadata;
};

/**
 * Serializes the canonical ShotMetadata object back into a Partial Prisma object,
 * safely grouping extended metadata into the `fx` column JSON structure.
 */
export const serializeShotMetadata = (metadata: ShotMetadata): any => {
  const fxData = {
    camera_height: metadata.camera.height,
    camera_distance: metadata.camera.distance,
    mood: metadata.lighting.mood,
    action: metadata.blocking.action,
    notes: metadata.references.notes,
  };

  return {
    shot_type: metadata.camera.shotType,
    camera_angle: metadata.camera.angle,
    lens: metadata.camera.lens,
    movement: metadata.camera.movement,
    composition: metadata.camera.composition,
    frame_size: metadata.camera.framing,
    focus: metadata.camera.focus,
    lighting: metadata.lighting.lighting,
    character_blocking: metadata.blocking.blocking,
    fx: JSON.stringify(fxData)
  };
};
