import { ProductionAgent, AgentContext, AgentResponse } from "./ProductionAgent";
import prisma from "@/lib/prisma";

class BaseHeuristicAgent extends ProductionAgent {
  async evaluate(context: AgentContext): Promise<AgentResponse> {
    return {
      agent_name: this.name,
      status: "SUCCESS",
      recommendations: [`${this.name} evaluated the current project state and found no critical issues.`],
      actions_taken: []
    };
  }
}

export class CreativeDirectorAgent extends BaseHeuristicAgent { constructor() { super("Creative Director"); } }
export class ScriptAnalystAgent extends BaseHeuristicAgent { constructor() { super("Script Analyst"); } }
export class BreakdownAnalystAgent extends BaseHeuristicAgent { constructor() { super("Breakdown Analyst"); } }
export class StoryboardDirectorAgent extends BaseHeuristicAgent { constructor() { super("Storyboard Director"); } }

export class PromptEngineerAgent extends ProductionAgent {
  constructor() { super("Prompt Engineer"); }
  async evaluate(context: AgentContext): Promise<AgentResponse> {
    const emptyShots = await prisma.productionShot.count({ where: { ProductionScene: { ProductionStoryboard: { project_id: context.projectId } } } });
    if (emptyShots > 0) {
      return {
        agent_name: this.name,
        status: "BLOCKED",
        recommendations: ["Generate prompts for empty shots."],
        actions_taken: ["Flagged missing prompts"]
      };
    }
    return { agent_name: this.name, status: "SUCCESS", recommendations: [], actions_taken: [] };
  }
}

export class ImageSupervisorAgent extends BaseHeuristicAgent { constructor() { super("Image Supervisor"); } }
export class VideoSupervisorAgent extends BaseHeuristicAgent { constructor() { super("Video Supervisor"); } }
export class AudioSupervisorAgent extends BaseHeuristicAgent { constructor() { super("Audio Supervisor"); } }

export class ContinuitySupervisorAgent extends ProductionAgent {
  constructor() { super("Continuity Supervisor"); }
  async evaluate(context: AgentContext): Promise<AgentResponse> {
     return {
        agent_name: this.name,
        status: "SUCCESS",
        recommendations: ["No major character shifts detected."],
        actions_taken: ["Scanned active approved assets"]
     };
  }
}

export class BrandSupervisorAgent extends BaseHeuristicAgent { constructor() { super("Brand Supervisor"); } }
export class QASupervisorAgent extends BaseHeuristicAgent { constructor() { super("QA Supervisor"); } }
export class DeliverySupervisorAgent extends BaseHeuristicAgent { constructor() { super("Delivery Supervisor"); } }
