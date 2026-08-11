import prisma from "@/lib/prisma";
import { cache } from "react";

export interface WorkflowStage {
  id: string;
  title: string;
  href: string;
  icon: string;
  status: string;
  progress: number;
  locked: boolean;
  group: string;
}

export interface WorkflowState {
  currentStage: WorkflowStage;
  currentStageIndex: number;
  completedStages: WorkflowStage[];
  unlockedStages: WorkflowStage[];
  lockedStages: WorkflowStage[];
  nextStage: WorkflowStage | null;
  progress: number;
  remainingTasks: string[];
  completionReasons: Record<string, string[]>;
  stages: WorkflowStage[];
}

export class WorkflowEngine {
  static getWorkflowState = cache(async (projectId: string): Promise<WorkflowState> => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionScript: true,
        ProductionVisualBible: { include: { Versions: true } },
        // Versions MUST be included — storyboardProgress calculation depends on the content array
        ProductionStoryboard: { include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } } }
      }
    });

    if (!project) {
      const defaultStage = { id: 'workspace', title: 'Workspace', href: `/projects/${projectId}`, icon: "Briefcase", status: "Active", progress: 0, locked: false, group: 'Creative Development' };
      return {
        currentStage: defaultStage, currentStageIndex: 0, completedStages: [], unlockedStages: [defaultStage], lockedStages: [], nextStage: null, progress: 0, remainingTasks: [], completionReasons: {}, stages: [defaultStage]
      };
    }

    const [
      characterCount,
      locationCount,
      packageCount,
      assetCount,
      sceneCount,
      shotCount,
      promptCount
    ] = await Promise.all([
      prisma.productionCharacter.count({ where: { project_id: projectId } }),
      prisma.productionLocation.count({ where: { project_id: projectId } }),
      prisma.productionPackage.count({ where: { project_id: projectId } }),
      prisma.productionAsset.count({ where: { project_id: projectId, status: 'Completed' } }),
      project.ProductionStoryboard ? prisma.productionScene.count({ where: { storyboard_id: project.ProductionStoryboard.id } }) : Promise.resolve(0),
      project.ProductionStoryboard ? prisma.productionShot.count({ where: { ProductionScene: { storyboard_id: project.ProductionStoryboard.id } } }) : Promise.resolve(0),
      project.ProductionStoryboard ? prisma.productionPrompt.count({ where: { ProductionShot: { ProductionScene: { storyboard_id: project.ProductionStoryboard.id } } } }) : Promise.resolve(0)
    ]);

    // 1. Workspace
    let isWorkspaceComplete = false;
    try {
      const parsed = JSON.parse(project.project_ref || "{}");
      if (parsed.brief || parsed.notes || parsed.references) isWorkspaceComplete = true;
    } catch(e) {
      if (project.project_ref) isWorkspaceComplete = true;
    }

    // 2. Script
    const isScriptUnlocked = isWorkspaceComplete;
    const scriptExists = !!project.ProductionScript;
    const hasExtracted = characterCount > 0 || sceneCount > 0;
    const isScriptComplete = !!project.ProductionScript?.is_locked || hasExtracted;

    // 3. Breakdown — unlocks after extraction
    const isBreakdownUnlocked = hasExtracted;
    // Breakdown is considered reviewed/completed when the user creates a Visual Bible
    const isBreakdownComplete = !!project.ProductionVisualBible;

    // 4. Visual Bible
    const isVisualBibleUnlocked = isBreakdownUnlocked;
    let isVisualBibleComplete = false;
    if (project.ProductionVisualBible) {
      const v = project.ProductionVisualBible.Versions?.[0];
      if (v) {
        if (v.status === 'Approved') {
          isVisualBibleComplete = true;
        } else {
          try {
            const vbJson = typeof v.style_bible === 'string' ? JSON.parse(v.style_bible) : v.style_bible;
            if (vbJson && vbJson.style && vbJson.lighting && vbJson.camera && vbJson.mood) {
              isVisualBibleComplete = true;
            } else if (vbJson && typeof vbJson === 'object' && Object.keys(vbJson).length > 0) {
              isVisualBibleComplete = !!(vbJson.style?.look || vbJson.lighting?.style || vbJson.camera?.style || vbJson.mood?.overall);
            }
          } catch(e) {
            isVisualBibleComplete = !!v.style_bible;
          }
        }
      }
    }

    // 5. Character Manager
    const isCharUnlocked = isVisualBibleComplete;
    const isCharComplete = characterCount > 0;

    // 5.5 Location Manager
    const isLocationUnlocked = isVisualBibleComplete;
    const isLocationComplete = locationCount > 0;

    // 6. Storyboard
    const isStoryboardUnlocked = isCharComplete || isLocationComplete;
    let storyboardProgress = 0;
    if (project.ProductionStoryboard) {
      const v = (project.ProductionStoryboard as any).Versions?.[0];
      if (v && v.content) {
        try {
          const scenes = typeof v.content === 'string' ? JSON.parse(v.content) : v.content;
          if (Array.isArray(scenes) && scenes.length > 0) {
            const approved = scenes.filter((s: any) => s.is_approved).length;
            storyboardProgress = Math.round((approved / scenes.length) * 100);
          }
        } catch (e) {}
      }
    }
    // Storyboard is complete when 100% of scenes are approved.
    // FALLBACK: if production scenes already exist (were extracted), treat storyboard as complete
    // — the user already approved the storyboard and triggered extraction.
    const isStoryboardComplete =
      (storyboardProgress === 100 && project.ProductionStoryboard != null) ||
      sceneCount > 0;

    // 7. Scene Manager — unlocks when storyboard is complete
    const isSceneUnlocked = isStoryboardComplete;
    const isSceneComplete = sceneCount > 0;

    // 8. Shot Manager — unlocks when at least one production scene exists
    const isShotUnlocked = isSceneComplete;
    const isShotComplete = shotCount > 0;

    // 8.5 Production Intelligence
    const isIntelligenceUnlocked = isShotComplete;
    const isIntelligenceComplete = packageCount > 0 && packageCount >= shotCount;

    // 9. Prompt Library
    const isPromptUnlocked = isIntelligenceComplete;
    const isPromptComplete = promptCount > 0;

    // 10. Generation Studio
    const isGenUnlocked = isPromptComplete;
    const isGenComplete = assetCount > 0;

    // 11. Asset Library
    const isAssetUnlocked = isGenComplete;

    const stages: WorkflowStage[] = [
      { id: 'workspace', title: 'Workspace', href: `/projects/${project.id}`, icon: "Briefcase", status: isWorkspaceComplete ? "Completed" : "Active", progress: isWorkspaceComplete ? 100 : 0, locked: false, group: 'Creative Development' },
      { id: 'script', title: 'Script', href: `/projects/${project.id}/script`, icon: "FileText", status: isScriptComplete ? "Completed" : (isScriptUnlocked ? "Active" : "Locked"), progress: isScriptComplete ? 100 : 0, locked: !isScriptUnlocked, group: 'Creative Development' },
      { id: 'breakdown', title: 'Breakdown', href: `/projects/${project.id}/breakdown`, icon: "List", status: isBreakdownComplete ? "Completed" : (isBreakdownUnlocked ? "Active" : "Locked"), progress: isBreakdownComplete ? 100 : 0, locked: !isBreakdownUnlocked, group: 'Creative Development' },
      { id: 'visual_bible', title: 'Visual Bible', href: `/projects/${project.id}/visual-bible`, icon: "BookOpen", status: isVisualBibleComplete ? "Completed" : (isVisualBibleUnlocked ? "Active" : "Locked"), progress: isVisualBibleComplete ? 100 : 0, locked: !isVisualBibleUnlocked, group: 'Creative Development' },
      { id: 'characters', title: 'Character Manager', href: `/projects/${project.id}/characters`, icon: "Star", status: isCharComplete ? "Completed" : (isCharUnlocked ? "Active" : "Locked"), progress: isCharComplete ? 100 : 0, locked: !isCharUnlocked, group: 'Production' },
      { id: 'locations', title: 'Location Manager', href: `/projects/${project.id}/locations`, icon: "MapPin", status: isLocationComplete ? "Completed" : (isLocationUnlocked ? "Active" : "Locked"), progress: isLocationComplete ? 100 : 0, locked: !isLocationUnlocked, group: 'Production' },
      { id: 'storyboard', title: 'Storyboard', href: `/projects/${project.id}/storyboard`, icon: "Clapperboard", status: isStoryboardComplete ? "Completed" : (isStoryboardUnlocked ? "Active" : "Locked"), progress: isStoryboardComplete ? 100 : 0, locked: !isStoryboardUnlocked, group: 'Production' },
      { id: 'scenes', title: 'Scene Manager', href: `/projects/${project.id}/scenes`, icon: "ImageIcon", status: isSceneComplete ? "Completed" : (isSceneUnlocked ? "Active" : "Locked"), progress: isSceneComplete ? 100 : 0, locked: !isSceneUnlocked, group: 'Production' },
      { id: 'shots', title: 'Shot Manager', href: `/projects/${project.id}/shots`, icon: "Video", status: isShotComplete ? "Completed" : (isShotUnlocked ? "Active" : "Locked"), progress: isShotComplete ? 100 : 0, locked: !isShotUnlocked, group: 'Production' },
      { id: 'production_intelligence', title: 'Intelligence Engine', href: `/projects/${project.id}/intelligence`, icon: "Cpu", status: isIntelligenceComplete ? "Completed" : (isIntelligenceUnlocked ? "Active" : "Locked"), progress: isIntelligenceComplete ? 100 : 0, locked: !isIntelligenceUnlocked, group: 'Production' },
      { id: 'prompt_studio', title: 'Prompt Library', href: `/projects/${project.id}/prompts`, icon: "Wand2", status: isPromptComplete ? "Completed" : (isPromptUnlocked ? "Active" : "Locked"), progress: isPromptComplete ? 100 : 0, locked: !isPromptUnlocked, group: 'AI Studio' },
      { id: 'generation_studio', title: 'Generation Studio', href: `/projects/${project.id}/generation`, icon: "Sparkles", status: isGenComplete ? "Completed" : (isGenUnlocked ? "Active" : "Locked"), progress: isGenComplete ? 100 : 0, locked: !isGenUnlocked, group: 'AI Studio' },
      { id: 'asset_library', title: 'Asset Library', href: `/projects/${project.id}/assets`, icon: "Library", status: isAssetUnlocked ? "Active" : "Locked", progress: 0, locked: !isAssetUnlocked, group: 'AI Studio' }
    ];
    
    let foundActive = false;
    const finalStages = stages.map(s => {
      if (s.status === "Completed") return s;
      if (s.locked) return s;
      if (!foundActive) {
        foundActive = true;
        return { ...s, status: "Active" };
      }
      return { ...s, status: "Available" };
    });

    const completedStages = finalStages.filter(s => s.status === "Completed");
    const lockedStages = finalStages.filter(s => s.locked);
    const unlockedStages = finalStages.filter(s => !s.locked);
    
    const activeStageIndex = finalStages.findIndex(s => s.status === "Active");
    const currentStageIndex = activeStageIndex !== -1 ? activeStageIndex : (finalStages.length - 1);
    const currentStage = finalStages[currentStageIndex];
    
    let nextStage = null;
    if (activeStageIndex !== -1) {
      nextStage = currentStage;
    } else {
      // All completed or all locked (shouldn't happen with workspace)
      nextStage = finalStages.find(s => !s.locked && s.status !== "Completed") || null;
    }

    const progress = Math.round((completedStages.length / finalStages.length) * 100);

    const completionReasons: Record<string, string[]> = {};
    if (!isWorkspaceComplete) completionReasons['workspace'] = ["Project Brief, Notes or References required."];
    if (!isScriptComplete) completionReasons['script'] = ["Upload or generate a script, then extract the breakdown."];
    if (!isBreakdownComplete) completionReasons['breakdown'] = ["Review extracted elements and create a Visual Bible."];
    if (!isVisualBibleComplete) completionReasons['visual_bible'] = ["Define Style, Lighting, Camera, and Mood."];
    if (!isCharComplete) completionReasons['characters'] = ["Add at least one character."];
    if (!isStoryboardComplete) completionReasons['storyboard'] = ["Add at least one storyboard frame."];
    if (!isSceneComplete) completionReasons['scenes'] = ["Create at least one scene."];
    if (!isShotComplete) completionReasons['shots'] = ["Create at least one camera shot."];
    if (!isIntelligenceComplete) completionReasons['production_intelligence'] = ["Compile production intelligence packages for all shots."];
    if (!isPromptComplete) completionReasons['prompt_studio'] = ["Generate at least one prompt."];
    if (!isGenComplete) completionReasons['generation_studio'] = ["Successfully generate at least one image/video."];

    const remainingTasks = Object.values(completionReasons).flat();

    return {
      currentStage,
      currentStageIndex,
      completedStages,
      unlockedStages,
      lockedStages,
      nextStage,
      progress,
      remainingTasks,
      completionReasons,
      stages: finalStages
    };
  });
}
