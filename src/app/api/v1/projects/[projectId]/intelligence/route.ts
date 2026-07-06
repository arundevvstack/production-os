import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Fetch all data needed for Intelligence dashboard
    const [
      scripts,
      characters,
      locations,
      props,
      visualBible,
      storyboard,
      assets,
      jobs,
      references,
      assetPlaceholders,
    ] = await Promise.all([
      prisma.productionScript.count({ where: { project_id: projectId } }),
      prisma.productionCharacter.count({ where: { project_id: projectId } }),
      prisma.productionLocation.count({ where: { project_id: projectId } }),
      prisma.productionProp.count({ where: { project_id: projectId } }),
      prisma.productionVisualBible.findFirst({ where: { project_id: projectId }, include: { Versions: { take: 1, orderBy: { version_number: 'desc' } } } }),
      prisma.productionStoryboard.findFirst({
        where: { project_id: projectId },
        include: {
          ProductionScene: {
            include: {
              ProductionShot: {
                include: { ProductionPrompt: true }
              }
            }
          }
        }
      }),
      prisma.productionAsset.findMany({ where: { project_id: projectId }, select: { id: true, status: true, type: true } }),
      prisma.productionAIJob.findMany({ where: { project_id: projectId } }),
      prisma.productionReference.count(),
      prisma.productionAssetPlaceholder.count(),
    ]);

    // Compute Job Health
    const runningJobs = jobs.filter(j => j.status === 'Running').length;
    const queuedJobs = jobs.filter(j => j.status === 'Queued').length;
    const failedJobs = jobs.filter(j => j.status === 'Failed').length;
    const failureRate = jobs.length > 0 ? Math.round((failedJobs / jobs.length) * 100) : 0;

    // Compute Health Score
    let score = 0;
    const suggestions: Array<{ id: string; type: string; message: string; category: string; target?: string }> = [];

    if (scripts > 0) score += 20; else suggestions.push({ id: 's1', type: 'WARNING', message: 'No script uploaded yet', category: 'Script' });
    if (characters > 0) score += 10; else suggestions.push({ id: 's2', type: 'INFO', message: 'No characters in breakdown', category: 'Breakdown' });
    if (locations > 0) score += 10; else suggestions.push({ id: 's3', type: 'INFO', message: 'No locations in breakdown', category: 'Breakdown' });
    if (visualBible) score += 15; else suggestions.push({ id: 's4', type: 'WARNING', message: 'Visual Bible not yet generated', category: 'Visual Bible' });
    if (storyboard) score += 15; else suggestions.push({ id: 's5', type: 'WARNING', message: 'Storyboard not yet generated', category: 'Storyboard' });
    if (assets.length > 0) score += 15; else suggestions.push({ id: 's6', type: 'INFO', message: 'No assets generated yet', category: 'Generation' });
    if (failureRate < 10) score += 15;

    const healthStatus = score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 40 ? 'Needs Attention' : 'Critical';

    // Scene Readiness
    const sceneReadiness = (storyboard?.ProductionScene || []).map((scene: any) => {
      const shots = scene.ProductionShot || [];
      const prompts = shots.flatMap((s: any) => s.ProductionPrompt || []);
      const blockers: string[] = [];
      if (shots.length === 0) blockers.push('No shots planned');
      if (prompts.length === 0) blockers.push('No prompts generated');
      const status = blockers.length === 0 ? 'Ready' : shots.length > 0 ? 'Almost Ready' : 'Planning';
      return {
        id: scene.id,
        scene_number: scene.scene_number,
        title: scene.title || `Scene ${scene.scene_number}`,
        status,
        blockers,
      };
    });

    // Asset Coverage
    const approvedAssets = assets.filter(a => a.status === 'Approved').length;
    const assetCoverage = {
      total: assets.length,
      approved: approvedAssets,
      coveragePercent: assets.length > 0 ? Math.round((approvedAssets / assets.length) * 100) : 0,
    };

    // Missing items
    const missingItems = {
      prompts: storyboard ? (storyboard.ProductionScene || []).flatMap((s: any) => (s.ProductionShot || []).flatMap((sh: any) => sh.ProductionPrompt || [])).length === 0 ? 1 : 0 : 1,
      ProductionReference: references,
      assetPlaceholders,
    };

    const data = {
      healthScore: score,
      healthStatus,
      suggestions,
      sceneReadiness,
      jobHealth: {
        running: runningJobs,
        queued: queuedJobs,
        failureRate,
      },
      assetCoverage,
      missingItems,
    };

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Intelligence API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
