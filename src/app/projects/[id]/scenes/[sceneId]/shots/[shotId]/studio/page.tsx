import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StudioLayout } from "@/components/production/studio/StudioLayout";
import { ContextPanel } from "@/components/production/studio/ContextPanel";
import { GenerationWorkspace } from "@/components/production/studio/GenerationWorkspace";
import { VersionBrowser } from "@/components/production/studio/VersionBrowser";
import { GenerationConsole } from "@/components/production/studio/GenerationConsole";
import { GraphEngine } from "@/lib/production/intelligence/GraphEngine";

export default async function GenerationStudioPage({ 
  params 
}: { 
  params: Promise<{ id: string, sceneId: string, shotId: string }> 
}) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id }
  });

  const shot = await prisma.productionShot.findUnique({
    where: { id: resolvedParams.shotId },
    include: {
      ProductionScene: true,
      ProductionPrompt: {
        orderBy: { created_at: 'desc' },
        take: 1
      },
      ProductionAsset: {
        include: {
          ProductionAssetVersion: {
            orderBy: { created_at: 'desc' }
          }
        }
      },
      creative_memories: true
    }
  });

  if (!project || !shot) return notFound();

  // For the prototype, we assume one primary active prompt set per shot
  const activePromptSet = shot.ProductionPrompt?.[0] || null;

  const graphDependencies = await GraphEngine.getRelatedNodes("Shot", shot.id);

  return (
    <StudioLayout 
      contextPanel={<ContextPanel project={project} shot={shot as any} />}
      workspacePanel={<GenerationWorkspace projectId={project.id} shot={shot as any} promptSet={activePromptSet as any} graphDependencies={graphDependencies} />}
      historyPanel={<VersionBrowser assets={shot.ProductionAsset as any} />}
      consolePanel={<GenerationConsole projectId={project.id} shotId={shot.id} />}
    />
  );
}
