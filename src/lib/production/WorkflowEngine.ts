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
        title: 'Project Workspace',
        href: `/projects/${project.id}`,
        icon: "Briefcase",
        status: "Active",
        progress: 100,
        locked: false,
        group: 'Production'
      },
      {
        id: 'generation_studio',
        title: 'Generation Studio',
        href: `/projects/${project.id}/generation`,
        icon: "Sparkles",
        status: "Active",
        progress: 100,
        locked: false,
        group: 'Production'
      },
      {
        id: 'prompt_studio',
        title: 'Prompt Library',
        href: `/projects/${project.id}/prompts`,
        icon: "Wand2",
        status: "Active",
        progress: 100,
        locked: false,
        group: 'Production'
      },
      {
        id: 'asset_library',
        title: 'Asset Library',
        href: `/projects/${project.id}/assets`,
        icon: "Library",
        status: "Active",
        progress: 100,
        locked: false,
        group: 'Production'
      }
    ];
  });
}
