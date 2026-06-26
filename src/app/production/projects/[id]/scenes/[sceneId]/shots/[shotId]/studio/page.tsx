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
  params: { id: string, sceneId: string, shotId: string } 
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });

  const shot = await prisma.productionShot.findUnique({
    where: { id: params.shotId },
    include: {
      scene: true,
      prompt_sets: {
        orderBy: { created_at: 'desc' },
        take: 1
      },
      assets: true,
      generated_assets: {
        include: {
          versions: {
            orderBy: { created_at: 'desc' }
          }
        }
      },
      creative_memories: true
    }
  });

  if (!project || !shot) return notFound();

  // For the prototype, we assume one primary active prompt set per shot
  const activePromptSet = shot.prompt_sets[0] || null;

  const graphDependencies = await GraphEngine.getRelatedNodes("Shot", shot.id);

  return (
    <StudioLayout 
      contextPanel={<ContextPanel project={project} shot={shot} />}
      workspacePanel={<GenerationWorkspace projectId={project.id} shot={shot} promptSet={activePromptSet} graphDependencies={graphDependencies} />}
      historyPanel={<VersionBrowser assets={shot.generated_assets} />}
      consolePanel={<GenerationConsole projectId={project.id} shotId={shot.id} />}
    />
  );
}
