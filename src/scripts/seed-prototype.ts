import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DP Production OS MVP v1.1...");

  // Clean old
  await prisma.productionWorkflowTemplate.deleteMany();
  await prisma.project.deleteMany({ where: { project_name: "Luxury Watch Campaign" }});

  // Create minimal Company
  const company = await prisma.company.findFirst() || await prisma.company.create({
    data: {
      name: "DP Production Studio",
      onboardingStatus: "completed",
    },
  });

  // Create Workflow Template
  const template = await prisma.productionWorkflowTemplate.create({
    data: {
      name: "Standard AI Production",
      is_default: true,
      stages: {
        create: [
          { name: "Script", order_index: 1 },
          { name: "Storyboard", order_index: 2 },
          { name: "Shot List", order_index: 3 },
          { name: "Prompt Studio", order_index: 4 }
        ]
      }
    }
  });

  // Create Project
  const project = await prisma.project.create({
    data: {
      company_id: company.id,
      project_name: "Luxury Watch Campaign",
      project_type: "Standard AI Production",
      status: "active",
    },
  });

  // Log Activity
  await prisma.productionActivityEvent.create({
    data: { project_id: project.id, event_type: 'PROJECT_CREATED', description: 'Project was created', actor_id: 'Admin' }
  });

  // Create Script
  const script = await prisma.productionScript.create({
    data: {
      project_id: project.id,
      version: 2,
      content: "EXT. CITY STREET - NIGHT\n\nRain slicks the streets. The glow of neon reflects in the puddles.\n\nA man in a tailored suit checks his LUXURY WATCH. The time is exactly 12:00 AM.",
      is_approved: true,
      is_locked: true,
      status: 'Completed',
      completion_pct: 100,
      assigned_to: 'Alex Writer',
      start_date: new Date(Date.now() - 86400000 * 5)
    },
  });

  await prisma.productionActivityEvent.create({
    data: { project_id: project.id, event_type: 'SCRIPT_LOCKED', description: 'Script approved and locked', actor_id: 'Creative Director' }
  });

  // Create Storyboard
  const storyboard = await prisma.productionStoryboard.create({
    data: {
      project_id: project.id,
      script_id: script.id,
      is_completed: false,
      status: 'In Progress',
      completion_pct: 40,
      assigned_to: 'Sarah Board',
      start_date: new Date(Date.now() - 86400000 * 2)
    },
  });

  // Create 5 Scenes
  const sceneDescriptions = [
    "Atmospheric establishing shots and hero product reveal.",
    "Close up on the watch mechanism ticking.",
    "Man walks out of the shadows, neon reflecting off the crystal.",
    "Fast cut montage of the city lights.",
    "Final product shot with logo lockup."
  ];

  for (let i = 1; i <= 5; i++) {
      const scene = await prisma.productionScene.create({
      data: {
        storyboard_id: storyboard.id,
        scene_number: i,
        title: `Scene 0${i} - ${i === 1 ? 'Night City' : i === 5 ? 'Logo Lockup' : 'Action'}`,
        description: sceneDescriptions[i-1],
        duration: "00:03",
        mood: i === 1 ? "Dark, Atmospheric, Moody" : "Cinematic",
        objective: "Establish brand tone",
        status: i <= 2 ? 'Completed' : 'In Progress',
        completion_pct: i <= 2 ? 100 : 20
      },
    });

    // Create References for Scene
    await prisma.productionReference.create({
      data: {
        scene_id: scene.id,
        title: "Moodboard Reference",
        type: "Image",
        uploader_id: "Creative Director"
      }
    });

    // Create Scene Asset Placeholder
    await prisma.productionAssetPlaceholder.create({
      data: {
        scene_id: scene.id,
        type: "Background",
        status: i === 1 ? "Approved" : "Pending",
        notes: "Needs to be very dark and rainy.",
        assigned_to: "AI Generator"
      }
    });

    // Create 4 Shots per Scene (20 total)
    for (let j = 1; j <= 4; j++) {
      const shot = await prisma.productionShot.create({
        data: {
          scene_id: scene.id,
          shot_number: (i - 1) * 4 + j,
          camera: "ARRI Alexa 35",
          movement: j === 1 ? "Static" : j === 2 ? "Slow Pan" : "Push In",
          lens: "35mm Prime",
          environment: "Cyberpunk City Street",
          character: "Man in Suit",
          lighting: "Neon Pink and Blue",
          duration: "00:02",
        },
      });

      // Create Prompt Set for Shot
      await prisma.productionPromptSet.create({
        data: {
          shot_id: shot.id,
          image_prompt: `High-quality cinematic shot, rainy city night, neon reflections, sharp focus.`,
          video_prompt: `Camera pushes in slowly on the subject, rain falling, moody lighting.`,
          character_prompt: `Man, 30s, sharp jawline, wearing an expensive tailored dark navy suit.`,
          status: i === 1 ? "Approved" : "Draft",
          completion_pct: i === 1 ? 100 : 10
        },
      });

      // Create Shot Asset Placeholder
      await prisma.productionAssetPlaceholder.create({
        data: {
          shot_id: shot.id,
          scene_id: scene.id,
          type: "Video",
          status: "Pending",
          notes: "Generate using Gen-3 Alpha"
        }
      });
    }
  }

  // --- PHASE 3 SEEDING ---

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
    where: { storyboard_id: storyboard.id }
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
        created_by: project.company_id, // Dummy user ID using company ID for now
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
    
    // Update Asset with current version ID
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

  console.log("Seeding complete! Project ID:", project.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
