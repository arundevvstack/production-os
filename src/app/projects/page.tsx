import React from "react";
import prisma from "@/lib/prisma";
import { NewProjectButton } from "./new-project-button";
import { ProjectGridClient } from "./ProjectGridClient";

export default async function ProductionProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Projects</h1>
          <p className="text-slate-500 mt-2">Manage your creative production workflow.</p>
        </div>
        <NewProjectButton />
      </div>

      <ProjectGridClient projects={projects} />
    </div>
  );
}
