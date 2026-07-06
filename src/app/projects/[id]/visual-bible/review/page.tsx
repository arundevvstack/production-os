import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VisualBibleViewer } from "../VisualBibleViewer";

export default async function VisualBibleReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { 
      ProductionVisualBible: { 
        include: {
          Versions: {
            orderBy: { version_number: 'desc' },
            take: 1
          }
        } 
      }
    }
  });

  if (!project) redirect(`/projects`);

  const visualBible = (project as any).ProductionVisualBible;
  const latestVersion = visualBible?.Versions?.[0] || null;

  if (!latestVersion) {
    return (
      <div className="p-12 text-center text-slate-500 italic border border-dashed rounded-xl m-6">
        No Visual Bible generated yet.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <VisualBibleViewer projectId={resolvedParams.id} version={latestVersion} readOnly={true} />
    </div>
  );
}