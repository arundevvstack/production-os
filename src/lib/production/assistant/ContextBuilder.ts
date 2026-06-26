import prisma from "@/lib/prisma";
import { GraphEngine } from "./GraphEngine";

export interface AssistantContextParams {
  projectId: string;
  sceneId?: string | null;
  shotId?: string | null;
  assetId?: string | null;
}

export class ContextBuilder {
  static async buildSystemPrompt(params: AssistantContextParams): Promise<string> {
    const stats = await GraphEngine.getStatistics(params.projectId);
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        objectives: true,
        creative_memories: true,
        storyboard: {
          include: {
            scenes: {
              include: {
                shots: true
              }
            }
          }
        }
      }
    });

    if (!project) return "You are an AI Production Assistant. The current project could not be found.";

    let prompt = `You are the Production OS AI Assistant. You help producers create better productions. You do not replace existing workflows, you enhance them.\n\n`;
    
    prompt += `=== PROJECT CONTEXT ===\n`;
    prompt += `Project Name: ${project.name}\n`;
    prompt += `Description: ${project.description || 'N/A'}\n`;
    prompt += `Status: ${project.status}\n`;
    if (project.objectives && project.objectives.length > 0) {
      prompt += `Objectives: ${project.objectives.map((o: any) => o.title).join(', ')}\n`;
    }

    prompt += `\n=== CREATIVE INTELLIGENCE (GRAPH) ===\n`;
    prompt += `Total AI Jobs: ${stats.jobCount}\n`;
    prompt += `Total Generated Assets: ${stats.assetCount}\n`;
    prompt += `Asset Approval Rate: ${stats.approvalRate.toFixed(1)}%\n`;
    prompt += `Total Memory Profiles: ${stats.memoryCount}\n`;

    if (project.creative_memories && project.creative_memories.length > 0) {
      prompt += `\n=== CREATIVE MEMORY (KNOWLEDGE BASE) ===\n`;
      prompt += `These are reusable profiles that define the core consistency of the project.\n`;
      project.creative_memories.forEach((mem: any) => {
        prompt += `- ${mem.type}: ${mem.name}\n`;
        prompt += `  Description: ${mem.description || 'N/A'}\n`;
        prompt += `  Prompt Snippet: ${mem.prompt_snippet}\n`;
      });
    }

    if (project.storyboard) {
      prompt += `\n=== STORYBOARD ===\n`;
      prompt += `Total Scenes: ${project.storyboard.scenes.length}\n`;
      
      if (params.sceneId) {
        const currentScene = project.storyboard.scenes.find((s: any) => s.id === params.sceneId);
        if (currentScene) {
          prompt += `\n=== CURRENT SCENE ===\n`;
          prompt += `Scene Number: ${currentScene.scene_number}\n`;
          prompt += `Title: ${currentScene.title}\n`;
          prompt += `Description: ${currentScene.description || 'None'}\n`;
          prompt += `Mood: ${currentScene.mood || 'None'}\n`;
          prompt += `Status: ${currentScene.status}\n`;
          prompt += `Total Shots: ${currentScene.shots.length}\n`;
          
          if (params.shotId) {
            const currentShot = currentScene.shots.find((s: any) => s.id === params.shotId);
            if (currentShot) {
              prompt += `\n=== CURRENT SHOT ===\n`;
              prompt += `Shot Number: ${currentShot.shot_number}\n`;
              prompt += `Camera: ${currentShot.camera || 'None'}\n`;
              prompt += `Lens: ${currentShot.lens || 'None'}\n`;
              prompt += `Lighting: ${currentShot.lighting || 'None'}\n`;
              prompt += `Environment: ${currentShot.environment || 'None'}\n`;
              prompt += `Character: ${currentShot.character || 'None'}\n`;
            }
          }
        }
      }
    }

    prompt += `\n=== INSTRUCTIONS ===\n`;
    prompt += `- Answer the producer's questions based on the above context.\n`;
    prompt += `- You can suggest actions to the user in a JSON format at the very end of your response if they ask you to do something.\n`;
    prompt += `- Suggestable actions: {"action": "create_prompt"}, {"action": "create_shot"}, {"action": "create_job"}.\n`;
    prompt += `- Keep responses minimal, professional, and Apple-inspired.\n`;
    prompt += `- Do not leak API keys or internal database IDs in your response.\n`;

    return prompt;
  }
}
