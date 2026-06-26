import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Phase 3...");

  const project = await prisma.project.findFirst();
  if (!project) {
    console.log("No project found to seed Phase 3 against.");
    return;
  }

  // 1. Create Providers
  const providerMidjourney = await prisma.productionAIProvider.create({
    data: {
      name: "Midjourney",
      category: "Image",
      auth_type: "API_KEY",
      supported_asset_types: ["Image"],
      supported_models: ["v5", "v6", "niji"],
    }
  });

  const providerRunway = await prisma.productionAIProvider.create({
    data: {
      name: "Runway",
      category: "Video",
      auth_type: "API_KEY",
      supported_asset_types: ["Video"],
      supported_models: ["Gen-2", "Gen-3 Alpha"],
    }
  });

  const providerElevenLabs = await prisma.productionAIProvider.create({
    data: {
      name: "ElevenLabs",
      category: "Voice",
      auth_type: "API_KEY",
      supported_asset_types: ["Voice"],
      supported_models: ["Turbo v2.5", "Multilingual v2"],
    }
  });

  // 2. Get first scene and first shot to attach jobs to
  const firstScene = await prisma.productionScene.findFirst({
    where: { storyboard: { project_id: project.id } }
  });
  const firstShot = await prisma.productionShot.findFirst({
    where: { scene_id: firstScene?.id }
  });
  const firstPromptSet = await prisma.productionPromptSet.findFirst({
    where: { shot_id: firstShot?.id }
  });

  if (firstScene && firstShot && firstPromptSet) {
    // 3. Create a Dummy Job
    const job1 = await prisma.productionAIJob.create({
      data: {
        project_id: project.id,
        scene_id: firstScene.id,
        shot_id: firstShot.id,
        prompt_set_id: firstPromptSet.id,
        provider_id: providerMidjourney.id,
        asset_type: "Image",
        model_name: "v6",
        status: "Completed",
        priority: "High",
        created_by: project.company_id,
        started_at: new Date(Date.now() - 60000),
        completed_at: new Date(Date.now() - 30000),
      }
    });

    // 4. Create a Dummy Asset with version
    const asset1 = await prisma.productionAsset.create({
      data: {
        project_id: project.id,
        scene_id: firstScene.id,
        shot_id: firstShot.id,
        prompt_set_id: firstPromptSet.id,
        type: "Image",
        tags: ["cinematic", "approved"],
        versions: {
          create: {
            job_id: job1.id,
            version_number: 1,
            provider_id: providerMidjourney.id,
            model_name: "v6",
            file_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
            thumbnail_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80",
            notes: "Initial generation using v6."
          }
        }
      }
    });
    
    const version = await prisma.productionAssetVersion.findFirst({ where: { asset_id: asset1.id } });
    if (version) {
      await prisma.productionAsset.update({
        where: { id: asset1.id },
        data: { current_version_id: version.id }
      });
    }

    // 5. Create a running job
    await prisma.productionAIJob.create({
      data: {
        project_id: project.id,
        scene_id: firstScene.id,
        shot_id: firstShot.id,
        prompt_set_id: firstPromptSet.id,
        provider_id: providerRunway.id,
        asset_type: "Video",
        model_name: "Gen-3 Alpha",
        status: "Running",
        priority: "Normal",
        created_by: project.company_id,
        started_at: new Date(),
      }
    });
  }

  console.log("Phase 3 seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
