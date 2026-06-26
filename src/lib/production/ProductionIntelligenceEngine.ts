export interface Suggestion {
  id: string;
  type: 'WARNING' | 'ERROR' | 'INFO';
  category: 'PROMPT' | 'ASSET' | 'JOB' | 'SCENE' | 'WORKFLOW';
  message: string;
  target?: string;
  targetId?: string;
}

export interface SceneReadiness {
  id: string;
  scene_number: number;
  title: string;
  status: 'Ready' | 'Almost Ready' | 'Planning' | 'Blocked';
  score: number;
  blockers: string[];
}

export interface IntelligenceReport {
  healthScore: number;
  healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  suggestions: Suggestion[];
  sceneReadiness: SceneReadiness[];
  jobHealth: {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    failureRate: number;
  };
  assetCoverage: {
    required: number;
    generated: number;
    approved: number;
    missing: number;
    coveragePct: number;
  };
  missingItems: {
    prompts: number;
    references: number;
    assetPlaceholders: number;
  };
}

export class ProductionIntelligenceEngine {
  
  static evaluate(projectData: any): IntelligenceReport {
    const suggestions: Suggestion[] = [];
    const scenesReadiness: SceneReadiness[] = [];
    
    let totalScore = 100;
    
    // Safety check
    if (!projectData) {
      return this.emptyReport();
    }

    const script = projectData.production_script;
    const storyboard = projectData.production_storyboard;
    const scenes = storyboard?.scenes || [];
    const jobs = projectData.production_ai_jobs || [];
    const allAssets = projectData.production_assets || [];

    // --- Job Health ---
    const jobStats = {
      total: jobs.length,
      queued: jobs.filter((j: any) => j.status === 'Queued').length,
      running: jobs.filter((j: any) => j.status === 'Running').length,
      completed: jobs.filter((j: any) => j.status === 'Completed').length,
      failed: jobs.filter((j: any) => j.status === 'Failed').length,
      failureRate: 0,
    };
    if (jobStats.total > 0) {
      jobStats.failureRate = Math.round((jobStats.failed / jobStats.total) * 100);
    }
    
    if (jobStats.failed > 0) {
      suggestions.push({
        id: `job-failed-${Date.now()}`,
        type: 'ERROR',
        category: 'JOB',
        message: `${jobStats.failed} AI Job(s) failed.`,
      });
      totalScore -= (jobStats.failed * 5); // penalty
    }

    // --- Missing Items Scanner & Asset Coverage ---
    let missingPrompts = 0;
    let missingReferences = 0;
    let missingPlaceholders = 0;

    let requiredAssets = 0;
    let generatedAssets = allAssets.length;
    let approvedAssets = allAssets.filter((a: any) => a.status === 'Approved' || a.tags?.includes('approved')).length;

    scenes.forEach((scene: any) => {
      let sceneScore = 100;
      let sceneBlockers: string[] = [];
      let scenePromptsCount = 0;
      let sceneShotsCount = scene.shots?.length || 0;

      // Check references
      if (!scene.references || scene.references.length === 0) {
        missingReferences++;
        sceneScore -= 20;
        sceneBlockers.push('Missing Reference Images');
        suggestions.push({
          id: `missing-ref-scene-${scene.id}`,
          type: 'WARNING',
          category: 'SCENE',
          message: `Scene ${scene.scene_number} has no Reference Images.`,
          target: `Scene ${scene.scene_number}`,
          targetId: scene.id
        });
      }

      // Check shots and prompts
      scene.shots?.forEach((shot: any) => {
        // Asset Placeholders
        const placeholders = shot.assets || [];
        requiredAssets += placeholders.length;
        if (placeholders.length === 0) {
          missingPlaceholders++;
        }

        const promptSet = shot.prompt_sets?.[0];
        if (!promptSet) {
          missingPrompts++;
          sceneScore -= 20;
          sceneBlockers.push(`Shot ${shot.shot_number} missing Prompt Set`);
          suggestions.push({
            id: `missing-prompt-shot-${shot.id}`,
            type: 'WARNING',
            category: 'PROMPT',
            message: `Shot ${shot.shot_number} in Scene ${scene.scene_number} has no Prompt Set.`,
            target: `Shot ${shot.shot_number}`,
            targetId: shot.id
          });
        } else {
          scenePromptsCount++;
          // Prompt Quality Indicators
          if (!promptSet.image_prompt && !promptSet.video_prompt) {
            sceneScore -= 10;
            sceneBlockers.push(`Shot ${shot.shot_number} prompt empty`);
          } else {
            // Basic metadata checks
            if (promptSet.image_prompt && promptSet.image_prompt.length < 20) {
              suggestions.push({
                id: `short-prompt-${shot.id}`,
                type: 'INFO',
                category: 'PROMPT',
                message: `Image Prompt for Shot ${shot.shot_number} is very short. Consider adding detail.`,
                target: `Shot ${shot.shot_number}`
              });
            }
            if (!promptSet.camera_prompt) {
              suggestions.push({
                id: `missing-camera-${shot.id}`,
                type: 'INFO',
                category: 'PROMPT',
                message: `Shot ${shot.shot_number} has no Camera Prompt.`,
                target: `Shot ${shot.shot_number}`
              });
            }
            if (!promptSet.lighting_prompt) {
              suggestions.push({
                id: `missing-lighting-${shot.id}`,
                type: 'INFO',
                category: 'PROMPT',
                message: `Shot ${shot.shot_number} has no Lighting Prompt.`,
                target: `Shot ${shot.shot_number}`
              });
            }
          }
        }
      });

      if (sceneShotsCount === 0) {
        sceneScore -= 30;
        sceneBlockers.push(`No shots defined`);
      }

      // Evaluate Scene Status
      let sceneStatus: 'Ready' | 'Almost Ready' | 'Planning' | 'Blocked' = 'Planning';
      if (sceneScore === 100 && sceneShotsCount > 0) {
        sceneStatus = 'Ready';
      } else if (sceneScore >= 70 && sceneShotsCount > 0) {
        sceneStatus = 'Almost Ready';
      } else if (sceneScore < 50) {
        sceneStatus = 'Blocked';
      }

      scenesReadiness.push({
        id: scene.id,
        scene_number: scene.scene_number,
        title: scene.title,
        status: sceneStatus,
        score: sceneScore,
        blockers: sceneBlockers
      });
      
      // Global impact
      if (sceneStatus === 'Blocked') totalScore -= 10;
      if (sceneStatus === 'Planning') totalScore -= 5;
    });

    // Coverage
    let missingAssets = Math.max(0, requiredAssets - generatedAssets);
    let coveragePct = requiredAssets === 0 ? 0 : Math.round((generatedAssets / requiredAssets) * 100);

    // Global workflow score impact
    if (!script?.is_approved) totalScore -= 20;
    if (!storyboard?.is_completed) totalScore -= 10;
    
    totalScore = Math.max(0, Math.min(100, totalScore));

    let healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical' = 'Good';
    if (totalScore >= 90) healthStatus = 'Excellent';
    else if (totalScore >= 70) healthStatus = 'Good';
    else if (totalScore >= 40) healthStatus = 'Needs Attention';
    else healthStatus = 'Critical';

    return {
      healthScore: totalScore,
      healthStatus,
      suggestions,
      sceneReadiness: scenesReadiness,
      jobHealth: jobStats,
      assetCoverage: {
        required: requiredAssets,
        generated: generatedAssets,
        approved: approvedAssets,
        missing: missingAssets,
        coveragePct
      },
      missingItems: {
        prompts: missingPrompts,
        references: missingReferences,
        assetPlaceholders: missingPlaceholders
      }
    };
  }

  static emptyReport(): IntelligenceReport {
    return {
      healthScore: 0,
      healthStatus: 'Critical',
      suggestions: [],
      sceneReadiness: [],
      jobHealth: { total: 0, queued: 0, running: 0, completed: 0, failed: 0, failureRate: 0 },
      assetCoverage: { required: 0, generated: 0, approved: 0, missing: 0, coveragePct: 0 },
      missingItems: { prompts: 0, references: 0, assetPlaceholders: 0 }
    };
  }
}
