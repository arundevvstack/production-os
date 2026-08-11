import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allScenes = await prisma.productionScene.findMany({
    orderBy: { created_at: 'asc' }
  });

  const seen = new Set<string>();
  let deletedCount = 0;

  for (const scene of allScenes) {
    const key = `${scene.storyboard_id}-${scene.scene_number}`;
    if (seen.has(key)) {
      // It's a duplicate, delete the version and the scene
      await prisma.productionSceneVersion.deleteMany({
        where: { scene_id: scene.id }
      });
      await prisma.productionScene.delete({
        where: { id: scene.id }
      });
      deletedCount++;
      console.log(`Deleted duplicate scene_number ${scene.scene_number} for storyboard ${scene.storyboard_id}`);
    } else {
      seen.add(key);
    }
  }

  console.log(`Finished. Deleted ${deletedCount} duplicate scenes.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
