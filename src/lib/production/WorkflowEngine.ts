import prisma from "@/lib/prisma";
import { cache } from "react";

export interface WorkflowStage {
  id: string;
  title: string;
  href: string;
  icon: string;
  status: string;
  progress: number;
  locked: boolean;
  group: string;
}

export class WorkflowEngine {
  /**
   * Retrieves all 20 enterprise workflow stages for a given project.
   */
  static getProjectStages = cache(async (projectId: string): Promise<WorkflowStage[]> => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionScript: true,
        ProductionVisualBible: { include: { Versions: true } },
        ProductionStoryboard: true
      }
    });

    if (!project) return [];

    const isScriptApproved = project.ProductionScript?.is_approved || false;
    const isScriptLocked = project.ProductionScript?.is_locked || false;
    
    const isBreakdownCompleted = project.ProductionVisualBible ? true : false; 
    const isVisualBibleApproved = project.ProductionVisualBible?.Versions?.[0]?.status === "Approved" || false;
    const isStoryboardCompleted = project.ProductionStoryboard?.is_completed || false;
    
    let isSceneCompleted = false;
    let isShotCompleted = false;
    let isPromptCompleted = false;

    if (project.ProductionStoryboard) {
      const sbId = project.ProductionStoryboard.id;
      const [sceneCount, shotCount, promptCount] = await Promise.all([
        prisma.productionScene.count({ where: { storyboard_id: sbId } }),
        prisma.productionShot.count({ where: { ProductionScene: { storyboard_id: sbId } } }),
        prisma.productionPrompt.count({ where: { ProductionShot: { ProductionScene: { storyboard_id: sbId } } } })
      ]);
      
      isSceneCompleted = sceneCount > 0;
      isShotCompleted = shotCount > 0;
      isPromptCompleted = promptCount > 0;
    }

    const determineStatus = (isCompleted: boolean, isLocked: boolean) => {
      if (isLocked) return "Blocked";
      if (isCompleted) return "Completed";
      return "In Progress";
    };

    return [
      {
        id: 'overview',
        title: 'Project',
        href: `/projects/${project.id}`,
        icon: "Info",
        status: "Active",
        progress: 100,
        locked: false,
        group: 'General'
      },
      {
        id: 'requirement',
        title: 'Requirement (Optional)',
        href: `/projects/${project.id}/requirement`,
        icon: "Briefcase",
        status: "Completed",
        progress: 100,
        locked: false,
        group: 'Pre Production'
      },
      {
        id: 'script',
        title: 'Script',
        href: `/projects/${project.id}/script`,
        icon: "FileText",
        status: isScriptApproved ? "Completed" : "In Progress",
        progress: isScriptApproved ? 100 : 0,
        locked: false,
        group: 'Pre Production'
      },
      {
        id: 'ai_breakdown',
        title: 'AI Breakdown',
        href: `/projects/${project.id}/breakdown`,
        icon: "List",
        status: determineStatus(isBreakdownCompleted, false),
        progress: isBreakdownCompleted ? 100 : 0,
        locked: false,
        group: 'Pre Production'
      },
      {
        id: 'production_breakdown_review',
        title: 'Production Breakdown Review',
        href: `/projects/${project.id}/breakdown/review`,
        icon: "CheckCircle",
        status: determineStatus(isBreakdownCompleted, !isBreakdownCompleted),
        progress: isBreakdownCompleted ? 100 : 0,
        locked: !isBreakdownCompleted,
        group: 'Pre Production'
      },
      {
        id: 'visual_bible',
        title: 'Visual Bible',
        href: `/projects/${project.id}/visual-bible`,
        icon: "BookOpen",
        status: determineStatus(isVisualBibleApproved, !isBreakdownCompleted),
        progress: isVisualBibleApproved ? 100 : 0,
        locked: !isBreakdownCompleted,
        group: 'Visual Planning'
      },
      {
        id: 'visual_bible_review',
        title: 'Visual Bible Review',
        href: `/projects/${project.id}/visual-bible/review`,
        icon: "CheckCircle",
        status: determineStatus(isVisualBibleApproved, !isVisualBibleApproved),
        progress: isVisualBibleApproved ? 100 : 0,
        locked: !isVisualBibleApproved,
        group: 'Visual Planning'
      },
      {
        id: 'storyboard',
        title: 'Storyboard',
        href: `/projects/${project.id}/storyboard`,
        icon: "ImageIcon",
        status: determineStatus(isStoryboardCompleted, !isVisualBibleApproved),
        progress: isStoryboardCompleted ? 100 : 0,
        locked: !isVisualBibleApproved,
        group: 'Visual Planning'
      },
      {
        id: 'storyboard_review',
        title: 'Storyboard Review',
        href: `/projects/${project.id}/storyboard/review`,
        icon: "CheckCircle",
        status: determineStatus(isStoryboardCompleted, !isStoryboardCompleted),
        progress: isStoryboardCompleted ? 100 : 0,
        locked: !isStoryboardCompleted,
        group: 'Visual Planning'
      },
      {
        id: 'scenes',
        title: 'Scenes',
        href: `/projects/${project.id}/scenes`,
        icon: "Clapperboard",
        status: determineStatus(isSceneCompleted, !isStoryboardCompleted),
        progress: isSceneCompleted ? 100 : 0,
        locked: !isStoryboardCompleted,
        group: 'Scene Planning'
      },
      {
        id: 'scene_review',
        title: 'Scene Review',
        href: `/projects/${project.id}/scenes/review`,
        icon: "CheckCircle",
        status: determineStatus(isSceneCompleted, !isSceneCompleted),
        progress: isSceneCompleted ? 100 : 0,
        locked: !isSceneCompleted,
        group: 'Scene Planning'
      },
      {
        id: 'shot_planner',
        title: 'Shot Planner',
        href: `/projects/${project.id}/shots`,
        icon: "Video",
        status: determineStatus(isShotCompleted, !isSceneCompleted),
        progress: isShotCompleted ? 100 : 0,
        locked: !isSceneCompleted,
        group: 'Scene Planning'
      },
      {
        id: 'shot_review',
        title: 'Shot Review',
        href: `/projects/${project.id}/shots/review`,
        icon: "CheckCircle",
        status: determineStatus(isShotCompleted, !isShotCompleted),
        progress: isShotCompleted ? 100 : 0,
        locked: !isShotCompleted,
        group: 'Scene Planning'
      },
      {
        id: 'prompt_studio',
        title: 'Prompt Studio',
        href: `/projects/${project.id}/prompts`,
        icon: "Wand2",
        status: determineStatus(isPromptCompleted, !isShotCompleted),
        progress: isPromptCompleted ? 100 : 0,
        locked: !isShotCompleted,
        group: 'Prompt Engineering'
      },
      {
        id: 'prompt_review',
        title: 'Prompt Review',
        href: `/projects/${project.id}/prompts/review`,
        icon: "CheckCircle",
        status: determineStatus(isPromptCompleted, !isPromptCompleted),
        progress: isPromptCompleted ? 100 : 0,
        locked: !isPromptCompleted,
        group: 'Prompt Engineering'
      },
      {
        id: 'generation_studio',
        title: 'Generation Studio',
        href: `/projects/${project.id}/generation`,
        icon: "Sparkles",
        status: determineStatus(false, !isPromptCompleted),
        progress: 0,
        locked: !isPromptCompleted,
        group: 'Generation'
      },
      {
        id: 'ai_asset_review',
        title: 'AI Asset Review',
        href: `/projects/${project.id}/assets/review`,
        icon: "Star",
        status: determineStatus(false, true),
        progress: 0,
        locked: true,
        group: 'Review'
      },
      {
        id: 'asset_library',
        title: 'Asset Library',
        href: `/projects/${project.id}/assets`,
        icon: "Library",
        status: determineStatus(false, true),
        progress: 0,
        locked: true,
        group: 'Review'
      },
      {
        id: 'editing',
        title: 'Editing',
        href: `/projects/${project.id}/editing`,
        icon: "PlayCircle",
        status: "Blocked",
        progress: 0,
        locked: true,
        group: 'Delivery'
      },
      {
        id: 'delivery',
        title: 'Delivery',
        href: `/projects/${project.id}/delivery`,
        icon: "UploadCloud",
        status: "Blocked",
        progress: 0,
        locked: true,
        group: 'Delivery'
      }
    ];
  });
}
