import prisma from "@/lib/prisma";

export class WorkflowEngine {
  /**
   * Calculates what stages are currently active and available
   * based on the progress of their dependencies.
   */
  static evaluateStageStatus(
    stageKey: 'script' | 'storyboard' | 'scene_workspace' | 'shot_list' | 'prompts',
    project: any // Passed from Prisma include
  ): { isLocked: boolean; status: string } {
    
    // For MVP, we are hard-coding the mappings to our 5 known stages
    // as defined in the DB models `is_approved` and `is_completed`
    // but exposing them via a unified Engine interface to prepare for dynamic workflows.
    
    switch (stageKey) {
      case 'script':
        return { 
          isLocked: false, 
          status: project.production_script?.is_locked ? "Approved" : "In Progress" 
        };
      
      case 'storyboard':
        const scriptLocked = project.production_script?.is_locked ?? false;
        return {
          isLocked: !scriptLocked,
          status: !scriptLocked ? "Blocked" : (project.production_storyboard?.is_completed ? "Completed" : "In Progress")
        };
        
      case 'scene_workspace':
        const storyboardCompleted2 = project.production_storyboard?.is_completed ?? false;
        return {
          isLocked: !storyboardCompleted2,
          status: !storyboardCompleted2 ? "Blocked" : "In Progress"
        };
        
      case 'shot_list':
        const storyboardCompleted = project.production_storyboard?.is_completed ?? false;
        return {
          isLocked: !storyboardCompleted,
          status: !storyboardCompleted ? "Blocked" : "In Progress"
        };
        
      case 'prompts':
        // Prompts become unlocked when Storyboard is completed in this MVP
        const sbCompleted = project.production_storyboard?.is_completed ?? false;
        return {
          isLocked: !sbCompleted,
          status: !sbCompleted ? "Blocked" : "In Progress"
        };
        
      default:
        return { isLocked: true, status: "Unknown" };
    }
  }

  static async autoUnlockNextStage(projectId: string) {
    // A background service that checks dependencies and creates the next stage 
    // records automatically (e.g. creating a blank storyboard when script is approved)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        production_script: true,
        production_storyboard: true,
      }
    });

    if (project?.production_script?.is_locked && !project.production_storyboard) {
      await prisma.productionStoryboard.create({
        data: { project_id: projectId, script_id: project.production_script.id }
      });
      // Also log activity
      await prisma.productionActivityEvent.create({
        data: {
          project_id: projectId,
          event_type: 'STAGE_UNLOCKED',
          description: 'Storyboard stage has been unlocked',
          actor_id: 'system'
        }
      });
    }
  }
}
