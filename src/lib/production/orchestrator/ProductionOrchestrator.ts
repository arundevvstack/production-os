import { ProductionEventBus, ProductionEvent } from "./ProductionEventBus";
import prisma from "@/lib/prisma";

export type ProductionState = 
  | "IDLE" 
  | "READY" 
  | "GENERATING" 
  | "WAITING_REVIEW" 
  | "BLOCKED" 
  | "FAILED" 
  | "DELIVERING" 
  | "COMPLETED";

export class ProductionOrchestrator {
  private static instance: ProductionOrchestrator;
  private projectStates: Map<string, ProductionState> = new Map();

  private constructor() {
    this.initializeSubscriptions();
  }

  public static getInstance(): ProductionOrchestrator {
    if (!ProductionOrchestrator.instance) {
      ProductionOrchestrator.instance = new ProductionOrchestrator();
    }
    return ProductionOrchestrator.instance;
  }

  private initializeSubscriptions() {
    ProductionEventBus.subscribe("*", async (event: ProductionEvent) => {
      await this.handleEvent(event);
      await this.logToAuditTrail(event);
    });
  }

  private async handleEvent(event: ProductionEvent) {
    const currentState = this.projectStates.get(event.projectId) || "IDLE";
    let nextState = currentState;

    switch (event.type) {
      case "GenerationStarted":
        nextState = "GENERATING";
        break;
      case "ReviewRequested":
        nextState = "WAITING_REVIEW";
        break;
      case "GenerationFailed":
      case "ProviderOffline":
        nextState = "FAILED";
        break;
      case "BudgetExceeded":
      case "DeadlineRisk":
        nextState = "BLOCKED";
        break;
      case "DeliveryCompleted":
        nextState = "COMPLETED";
        break;
    }

    if (nextState !== currentState) {
      this.projectStates.set(event.projectId, nextState);
    }
  }

  private async logToAuditTrail(event: ProductionEvent) {
    // Write immutable log
    await prisma.auditLog.create({
      data: {
        id: "evt_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        action: event.type,
        entity_type: "Project",
        entity_id: event.projectId,
        after_state: { state: this.projectStates.get(event.projectId), payload: event.payload },
        created_at: event.timestamp
      }
    });
  }

  public getProjectState(projectId: string): ProductionState {
    return this.projectStates.get(projectId) || "IDLE";
  }

  public forceState(projectId: string, state: ProductionState) {
     this.projectStates.set(projectId, state);
  }
}

// Export singleton instance
export const orchestrator = ProductionOrchestrator.getInstance();
