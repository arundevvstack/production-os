export interface AgentContext {
  projectId: string;
  payload?: any;
}

export interface AgentResponse {
  agent_name: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  recommendations: any[];
  actions_taken: string[];
}

export abstract class ProductionAgent {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Agents only return structured JSON advice/actions based on the DB state.
   * They do not mutate the database directly.
   */
  abstract evaluate(context: AgentContext): Promise<AgentResponse>;
}
