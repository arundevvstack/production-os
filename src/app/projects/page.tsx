import React from "react";
import prisma from "@/lib/prisma";
import { NewProjectButton } from "./new-project-button";
import Link from "next/link";
import { Folder, ArrowRight } from "lucide-react";

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link 
            key={project.id} 
            href={`/projects/${project.id}`}
            className="group block border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Folder className="h-5 w-5 text-slate-600 group-hover:text-black transition" />
              </div>
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                {project.status.toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-lg">{project.project_name}</h3>
            <div className="mt-6 flex items-center text-sm font-medium text-slate-500 group-hover:text-black transition">
              Open Workspace
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl text-slate-500">
            No active projects found.
          </div>
        )}
      </div>
    </div>
  );
}
