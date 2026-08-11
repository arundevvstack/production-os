import React from "react";
import prisma from "@/lib/prisma";
import { NewProjectButton } from "./new-project-button";
import { ProjectGridClient } from "./ProjectGridClient";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function ProductionProjectsPage() {
  const projectsRaw = await prisma.project.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      ProductionAsset: {
        select: {
          id: true,
          type: true,
          ProductionAssetVersion: {
            where: { is_current: true },
            select: { file_url: true }
          }
        }
      }
    }
  });

  const projects = projectsRaw.map(project => {
    let thumbnailUrl = null;
    const imageAssets = project.ProductionAsset.filter(a => a.type === 'Image' || a.type === 'Master_Portrait');
    for (const asset of imageAssets) {
      if (asset.ProductionAssetVersion && asset.ProductionAssetVersion.length > 0 && asset.ProductionAssetVersion[0].file_url) {
        thumbnailUrl = asset.ProductionAssetVersion[0].file_url;
        break;
      }
    }
    return {
      ...project,
      thumbnailUrl,
      assets_count: project.ProductionAsset.length
    };
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden bg-background">
        <div className="relative p-10 w-full h-[100dvh] overflow-x-hidden overflow-y-auto font-body text-foreground">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Active Projects</h1>
              <p className="text-muted-foreground mt-2">Manage your creative production workflow.</p>
            </div>
            <NewProjectButton />
          </div>

          <ProjectGridClient projects={projects} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
