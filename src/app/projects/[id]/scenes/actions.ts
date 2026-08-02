"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { IntelligenceEngine } from "@/lib/production/intelligence/IntelligenceEngine";

export async function updateSceneAction(sceneId: string, projectId: string, formData: FormData) {
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const mood = formData.get("mood")?.toString();
  const notes = formData.get("notes")?.toString();
  const duration = formData.get("duration")?.toString();

  await prisma.productionScene.update({
    where: { id: sceneId },
    data: {
      title,
      description,
      mood,
      notes,
      duration,
      updated_at: new Date()
    }
  });

  // Background intelligent sync
  (async () => {
    try {
      const shots = await prisma.productionShot.findMany({ where: { scene_id: sceneId } });
      for (const s of shots) {
        await IntelligenceEngine.synchronizePackage(s.id, projectId);
      }
    } catch(e) {
      console.error("Intelligence sync failed", e);
    }
  })();

  revalidatePath(`/projects/${projectId}/scenes`);
  return { success: true };
}

export async function updateSceneStatusAction(sceneId: string, projectId: string, status: string) {
  await prisma.productionScene.update({
    where: { id: sceneId },
    data: { status }
  });
  revalidatePath(`/projects/${projectId}/scenes`);
}

export async function reorderSceneAction(sceneId: string, projectId: string, direction: 'up' | 'down') {
  const scene = await prisma.productionScene.findUnique({ where: { id: sceneId } });
  if (!scene) return;

  const targetNumber = direction === 'up' ? scene.scene_number - 1 : scene.scene_number + 1;
  
  const targetScene = await prisma.productionScene.findFirst({
    where: { storyboard_id: scene.storyboard_id, scene_number: targetNumber }
  });

  if (targetScene) {
    await prisma.$transaction([
      prisma.productionScene.update({ where: { id: sceneId }, data: { scene_number: -1 } }),
      prisma.productionScene.update({ where: { id: targetScene.id }, data: { scene_number: scene.scene_number } }),
      prisma.productionScene.update({ where: { id: sceneId }, data: { scene_number: targetNumber } })
    ]);
    revalidatePath(`/projects/${projectId}/scenes`);
  }
}
