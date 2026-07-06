import { EventEmitter } from "events";

export type ProductionEventType = 
  | "ProjectCreated" 
  | "StageStarted" 
  | "StageCompleted" 
  | "ReviewRequested" 
  | "ReviewApproved" 
  | "ReviewRejected" 
  | "GenerationStarted" 
  | "GenerationCompleted" 
  | "GenerationFailed" 
  | "BudgetExceeded" 
  | "DeadlineRisk" 
  | "ProviderOffline" 
  | "DeliveryCompleted";

export interface ProductionEvent {
  type: ProductionEventType;
  projectId: string;
  payload: any;
  timestamp: Date;
}

class EventBus extends EventEmitter {
  publish(type: ProductionEventType, projectId: string, payload: any = {}) {
    const event: ProductionEvent = {
      type,
      projectId,
      payload,
      timestamp: new Date()
    };
    this.emit(type, event);
    this.emit("*", event); // Wildcard for logger/orchestrator
  }

  subscribe(type: ProductionEventType | "*", listener: (event: ProductionEvent) => void) {
    this.on(type, listener);
  }
}

export const ProductionEventBus = new EventBus();
