const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("No company found to attach workflow template to.");
    return;
  }

  const aiVideoRules = {
    groups: [
      {
        id: "pre-production",
        title: "PRE-PRODUCTION",
        items: [
          { title: "Script", url_pattern: "/production/projects/{projectId}/script", icon: "FileText", stageKey: "script", dependsOn: [] },
          { title: "Storyboard", url_pattern: "/production/projects/{projectId}/storyboard", icon: "LayoutGrid", stageKey: "storyboard", dependsOn: ["script"] },
          { title: "Scene Workspace", url_pattern: "/production/projects/{projectId}/scenes", icon: "Clapperboard", stageKey: "scene_workspace", dependsOn: ["storyboard"] },
          { title: "Shot List", url_pattern: "/production/projects/{projectId}/shots", icon: "Camera", stageKey: "shot_list", dependsOn: ["scene_workspace"] }
        ]
      },
      {
        id: "ai-production",
        title: "AI PRODUCTION",
        items: [
          { title: "Prompt Studio", url_pattern: "/production/projects/{projectId}/prompts", icon: "Sparkles", stageKey: "prompts", dependsOn: ["shot_list"] },
          { title: "Generation Studio", url_pattern: "/production/projects/{projectId}/generation", icon: "Wand2", stageKey: "generation", dependsOn: ["prompts"] },
          { title: "Asset Library", url_pattern: "/production/projects/{projectId}/assets", icon: "Folder", stageKey: "assets", dependsOn: [] }
        ]
      },
      {
        id: "post-production",
        title: "POST PRODUCTION",
        items: [
          { title: "Video Edit", url_pattern: "/production/projects/{projectId}/edit", icon: "Scissors", stageKey: "video_edit", dependsOn: ["generation"] },
          { title: "Audio", url_pattern: "/production/projects/{projectId}/audio", icon: "Music", stageKey: "audio", dependsOn: ["video_edit"] },
          { title: "QA Review", url_pattern: "/production/projects/{projectId}/qa", icon: "CheckCircle", stageKey: "qa", dependsOn: ["audio"] },
          { title: "Delivery", url_pattern: "/production/projects/{projectId}/delivery", icon: "Package", stageKey: "delivery", dependsOn: ["qa"] }
        ]
      }
    ]
  };

  // Upsert the Template
  const template = await prisma.workflowTemplate.create({
    data: {
      name: "AI Video Commercial",
      trigger: "MANUAL",
      company_id: company.id,
      rules: aiVideoRules
    }
  });
  console.log("Created Workflow Template:", template.id);

  // Attach stages to existing projects if they don't have them
  const projects = await prisma.project.findMany({
    include: { ProjectStage: true }
  });

  for (const project of projects) {
    if (project.ProjectStage.length === 0) {
      console.log(`Seeding stages for project: ${project.id}`);
      let order = 0;
      for (const group of aiVideoRules.groups) {
        for (const item of group.items) {
          await prisma.projectStage.create({
            data: {
              project_id: project.id,
              name: item.stageKey,
              order: order++,
              status: "pending"
            }
          });
        }
      }
    }
  }

  console.log("Seeding complete.");
  await prisma.$disconnect();
}
run();
