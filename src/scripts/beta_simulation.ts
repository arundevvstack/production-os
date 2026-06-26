import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
  console.log("Starting Beta Workflow Simulation...");

  // Assume user exists
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found.");

  const projects = [
    { name: "Fashion Campaign", type: "COMMERCIAL" },
    { name: "Restaurant Advertisement", type: "COMMERCIAL" },
    { name: "Luxury Product Commercial", type: "COMMERCIAL" },
    { name: "Documentary", type: "DOCUMENTARY" },
    { name: "Real Estate Promotion", type: "COMMERCIAL" },
  ];

  for (const p of projects) {
    console.log(`\nSimulating: ${p.name}`);
    
    // 1. Create Project
    const project = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        project_name: p.name,
        company_id: user.company_id,
        project_ref: `PRJ-${Math.floor(Math.random() * 1000)}`,
        status: "ACTIVE",
        updated_at: new Date(),
      }
    });

    // 2. Create Storyboard & Scene
    const storyboard = await prisma.productionStoryboard.create({
      data: { 
        id: crypto.randomUUID(),
        project_id: project.id,
        script_id: crypto.randomUUID(),
        updated_at: new Date(),
      }
    });

    const scene = await prisma.productionScene.create({
      data: {
        id: crypto.randomUUID(),
        storyboard_id: storyboard.id,
        scene_number: 1,
        title: "Opening Sequence",
        status: "IN_PROGRESS",
        updated_at: new Date(),
      }
    });

    // 3. Create Shot
    const shot = await prisma.productionShot.create({
      data: {
        id: crypto.randomUUID(),
        scene_id: scene.id,
        shot_number: "1A",
        status: "IN_PROGRESS",
        updated_at: new Date(),
      }
    });

    // 4. Create Prompt Set
    const promptSet = await prisma.productionPromptSet.create({
      data: {
        id: crypto.randomUUID(),
        shot_id: shot.id,
        image_prompt: `High-quality cinematic shot for ${p.name}.`,
        negative_prompt: "blurry, low quality",
        updated_at: new Date(),
      }
    });

    // 5. Simulate Generation & Asset Creation
    const asset = await prisma.productionAsset.create({
      data: {
        id: crypto.randomUUID(),
        project_id: project.id,
        scene_id: scene.id,
        shot_id: shot.id,
        type: "Image",
        updated_at: new Date(),
      }
    });

    // 6. Approve Asset
    await prisma.productionAssetVersion.create({
      data: {
        id: crypto.randomUUID(),
        asset_id: asset.id,
        version_number: 1,
        file_url: "https://example.com/asset.png",
        status: "Approved",
        provider_id: "OpenRouter",
        updated_at: new Date(),
      }
    });

    // 7. Graph Timeline Event
    await prisma.productionTimelineEvent.create({
      data: {
        id: crypto.randomUUID(),
        project_id: project.id,
        user_id: user.id,
        entity_type: "Asset",
        entity_id: asset.id,
        action: "APPROVED"
      }
    });

    console.log(`✅ Completed workflow for ${p.name}`);
  }

  console.log("\nAll simulations completed successfully.");
}

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
