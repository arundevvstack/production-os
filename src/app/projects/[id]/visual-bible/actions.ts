"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateVisualBibleVersion(projectId: string, versionId: string, data: any) {
  try {
    await prisma.productionVisualBibleVersion.update({
      where: { id: versionId },
      data: {
        style_bible: data.style_bible,
        character_bible: data.character_bible,
        location_bible: data.location_bible,
        prop_bible: data.prop_bible,
        costume_bible: data.costume_bible,
        cinematography_bible: data.cinematography_bible,
        lighting_bible: data.lighting_bible,
        art_direction_bible: data.art_direction_bible,
        audio_bible: data.audio_bible,
        vfx_bible: data.vfx_bible
      }
    });

    revalidatePath(`/projects/${projectId}/visual-bible`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveVisualBible(projectId: string, versionId: string) {
  try {
    await prisma.productionVisualBibleVersion.update({
      where: { id: versionId },
      data: { status: "Approved" }
    });
    
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}