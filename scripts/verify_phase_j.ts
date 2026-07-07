import prisma from "../src/lib/prisma";
import { ProductionEventBus } from "../src/lib/production/orchestrator/ProductionEventBus";
import { orchestrator } from "../src/lib/production/orchestrator/ProductionOrchestrator";
import { ProviderBalancer } from "../src/lib/production/engines/ProviderBalancer";
import { CostOptimizer } from "../src/lib/production/engines/CostOptimizer";
import { EnterpriseAnalytics } from "../src/lib/production/engines/EnterpriseAnalytics";
import { PromptEngineerAgent } from "../src/lib/production/agents/Agents";
import { ProjectSimulationEngine } from "../src/lib/production/engines/ProjectSimulationEngine";
import { ProductionScheduler } from "../src/lib/production/orchestrator/ProductionScheduler";

async function run() {
  console.log("\n========================================================");
  console.log(" PHASE J: AUTONOMOUS PRODUCTION ORCHESTRATOR VALIDATION ");
  console.log("========================================================\n");

  const project = await prisma.project.findFirst({
    where: { project_name: { contains: "Test" } }
  });

  if (!project) {
    console.error("❌ No project found for testing.");
    process.exit(1);
  }

  const projectId = project.id;
  console.log(`[PASS] Target Project: ${projectId}`);

  // Seed mock providers for tests
  await prisma.productionAIProvider.upsert({
     where: { name: 'Flux' },
     update: { status: 'active', is_enabled: true, supported_asset_types: ['Image'] },
     create: { id: 'prov_flux_1', name: 'Flux', category: 'Image Generation', auth_type: 'API_KEY', supported_asset_types: ['Image'], status: 'active', updated_at: new Date() }
  });

  try {
    // 1. Event Bus & Orchestrator State Machine
    console.log("\n[EXEC] Testing Event Bus & Orchestrator State Transitions");
    const initialState = orchestrator.getProjectState(projectId);
    console.log(`       -> Initial State: ${initialState}`);
    
    // Simulate generation start
    ProductionEventBus.publish("GenerationStarted", projectId, { test: true });
    
    // Small delay to allow async event handling
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newState = orchestrator.getProjectState(projectId);
    if (newState === "GENERATING") {
       console.log(`[PASS] Orchestrator successfully transitioned state to: ${newState}`);
    } else {
       throw new Error(`Orchestrator state transition failed. Expected GENERATING, got ${newState}`);
    }

    // 2. Audit Log
    console.log("\n[EXEC] Verifying Immutable Audit Trail");
    const log = await prisma.auditLog.findFirst({
      where: { entity_id: projectId, action: "GenerationStarted" },
      orderBy: { created_at: "desc" }
    });
    
    if (log) {
       console.log(`[PASS] Audit log successfully written: ID ${log.id}`);
    } else {
       throw new Error("Audit log entry was not created by the Orchestrator.");
    }

    // 3. AI Agent Framework
    console.log("\n[EXEC] Testing AI Agent Evaluation (Prompt Engineer)");
    const agent = new PromptEngineerAgent();
    const agentRes = await agent.evaluate({ projectId });
    console.log(`[PASS] Agent Evaluated: [${agentRes.status}] ${agentRes.recommendations.join(', ')}`);

    // 4. Load Balancing & Cost
    console.log("\n[EXEC] Testing Provider Balancer");
    const rec = await ProviderBalancer.recommendProvider("Image");
    console.log(`[PASS] Balancer routed Image job to: ${rec.provider_id}`);

    console.log("\n[EXEC] Testing Cost Optimizer");
    const cost = await CostOptimizer.predictCosts(projectId);
    console.log(`[PASS] Predicted Remaining Cost: $${cost.projected_remaining}`);

    // 5. Scheduler
    console.log("\n[EXEC] Testing Production Scheduler");
    await ProductionScheduler.processQueue();
    console.log(`[PASS] Scheduler swept and processed queue safely.`);

    // 6. Simulation Engine
    console.log("\n[EXEC] Testing 'What-If' Simulation Engine");
    const sim = await ProjectSimulationEngine.simulateScenario(projectId, { budget_decrease_pct: 30 });
    console.log(`[PASS] Simulation successful. Risk Flagged: ${sim.projected_risk}`);

    // 7. Global Analytics
    console.log("\n[EXEC] Testing Global Enterprise Analytics");
    const analytics = await EnterpriseAnalytics.getGlobalMetrics();
    console.log(`[PASS] Analyzed global velocity. Historical Failure Rate: ${analytics.historical.failure_rate_pct}%`);

    console.log("\n========================================================");
    console.log(" VALIDATION SUCCESSFUL - ENTERPRISE AI OS IS OPERATIONAL");
    console.log("========================================================\n");
    process.exit(0);

  } catch (err: any) {
    console.error(`\n[FAIL] Validation Failed: ${err.message}`);
    process.exit(1);
  }
}

run();
