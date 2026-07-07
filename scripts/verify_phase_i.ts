import prisma from "../src/lib/prisma";
import { ProductionHealthEngine } from "../src/lib/production/engines/ProductionHealthEngine";
import { TimelineEngine } from "../src/lib/production/engines/TimelineEngine";
import { ContinuityEngine } from "../src/lib/production/engines/ContinuityEngine";
import { BudgetEngine } from "../src/lib/production/engines/BudgetEngine";
import { AdvisorEngine } from "../src/lib/production/engines/AdvisorEngine";

async function runValidation() {
  console.log("=================================================");
  console.log(" PHASE I: AI CREATIVE DIRECTOR RUNTIME VALIDATION ");
  console.log("=================================================");

  try {
    const project = await prisma.project.findFirst();
    if (!project) throw new Error("No projects found in DB");
    console.log(`[PASS] Selected Project: ${project.id}`);

    console.log("\n[EXEC] Running Production Health Engine");
    const health = await ProductionHealthEngine.evaluateProject(project.id);
    console.log(`[PASS] Health Score Calculated: ${health.overall_score}/100`);
    console.log(`       - Assets Metric: ${health.metrics.generation}`);

    console.log("\n[EXEC] Running Timeline Engine");
    const timeline = await TimelineEngine.evaluateTimeline(project.id);
    console.log(`[PASS] Timeline Risk: ${timeline.status}, Bottleneck: ${timeline.bottleneck || "None"}`);

    console.log("\n[EXEC] Running Continuity Engine");
    const continuity = await ContinuityEngine.evaluateContinuity(project.id);
    console.log(`[PASS] Continuity Risks Detected: ${continuity.length}`);

    console.log("\n[EXEC] Running Budget Engine");
    const budget = await BudgetEngine.evaluateBudget(project.id);
    console.log(`[PASS] Budget Tracked: $${budget.total_spent} (Risk: ${budget.risk_level})`);

    console.log("\n[EXEC] Running Advisor Engine");
    const advice = await AdvisorEngine.generateAdvice(project.id);
    console.log(`[PASS] Generated ${advice.length} AI Recommendations`);
    advice.forEach(a => console.log(`       -> [${a.type.toUpperCase()}] ${a.message}`));

    console.log("\n[EXEC] Creating Executive Report via Log");
    const report = await prisma.productionLog.create({
      data: {
        id: "rep_val_" + Date.now(),
        project_id: project.id,
        type: "Executive_Report",
        date: new Date(),
        content: {
           health: health.overall_score,
           recommendations: advice.length,
           budget: budget.total_spent
        }
      }
    });
    console.log(`[PASS] Successfully persisted Executive Report to DB (ID: ${report.id})`);

    // Cleanup report
    await prisma.productionLog.delete({ where: { id: report.id } });
    console.log(`[PASS] Cleaned up test report`);

    console.log("\n=================================================");
    console.log(" VALIDATION SUCCESSFUL - ALL AI ENGINES VERIFIED ");
    console.log("=================================================");

  } catch (error) {
    console.error("\n[FAIL] Validation Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runValidation();
