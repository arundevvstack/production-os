import { z } from "zod";

export const ProductionPackageSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
  }),
  script: z.object({
    id: z.string().optional(),
    content: z.string().optional(),
  }),
  scene: z.object({
    id: z.string(),
    scene_number: z.number(),
    title: z.string(),
    description: z.string().nullable().optional(),
    time_of_day: z.string().nullable().optional(),
    scene_type: z.string().nullable().optional(),
    mood: z.string().nullable().optional(),
  }),
  shot: z.object({
    id: z.string(),
    shot_number: z.number(),
    shot_type: z.string().nullable().optional(),
    camera_angle: z.string().nullable().optional(),
    lens: z.string().nullable().optional(),
    movement: z.string().nullable().optional(),
    lighting: z.string().nullable().optional(),
    character_blocking: z.string().nullable().optional(),
  }),
  visualBible: z.object({
    style_bible: z.any().optional(),
    character_bible: z.any().optional(),
    location_bible: z.any().optional(),
    lighting_bible: z.any().optional(),
  }),
  characters: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable().optional(),
      reference_image_url: z.string().nullable().optional(),
      outfit: z.string().nullable().optional(),
    })
  ),
  locations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable().optional(),
    })
  ),
  continuity: z.array(
    z.object({
      notes: z.string(),
    })
  )
});

export type ProductionPackageType = z.infer<typeof ProductionPackageSchema>;
