"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, ArrowRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProjectGridClient({ projects }: { projects: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected project(s)?`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch("/api/v1/projects/batch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      
      if (!res.ok) throw new Error("Failed to delete projects");
      
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <span className="text-red-700 font-medium">
            {selectedIds.length} project(s) selected
          </span>
          <button 
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const isSelected = selectedIds.includes(project.id);
          return (
            <div 
              key={project.id} 
              className={`relative block border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition ${isSelected ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            >
              <div className="absolute top-4 left-4 z-10">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleSelect(project.id)}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>

              <Link href={`/projects/${project.id}`} className="block pl-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Folder className="h-5 w-5 text-slate-600 transition" />
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                    {project.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-lg truncate" title={project.project_name}>{project.project_name}</h3>
                <div className="mt-6 flex items-center text-sm font-medium text-slate-500 hover:text-black transition">
                  Open Workspace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </Link>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl text-slate-500">
            No active projects found.
          </div>
        )}
      </div>
    </div>
  );
}
