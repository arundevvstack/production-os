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

  const getGradient = (name: string) => {
    const colors = [
      'from-red-500 to-orange-500',
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-500',
      'from-rose-500 to-red-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-xl flex items-center justify-between shadow-sm">
          <span className="text-red-700 font-medium">
            {selectedIds.length} project(s) selected
          </span>
          <button 
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition shadow-md hover:shadow-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => {
          const isSelected = selectedIds.includes(project.id);
          return (
            <div 
              key={project.id} 
              className={`group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border ${isSelected ? 'border-red-500 ring-4 ring-red-500/20' : 'border-slate-200/50 dark:border-slate-800/50'} shadow-md hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Checkbox (Absolute) */}
              <div 
                className="absolute top-4 left-4 z-20 bg-black/30 backdrop-blur-md rounded-md p-1 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); toggleSelect(project.id); }}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => {}} // Handled by parent div
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer pointer-events-none"
                />
              </div>

              {/* Clickable Area */}
              <div className="cursor-pointer flex flex-col flex-1" onClick={() => router.push(`/projects/${project.id}`)}>
                {/* Thumbnail Header */}
                <div className="w-full h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {project.thumbnailUrl ? (
                    <img 
                      src={project.thumbnailUrl} 
                      alt={project.project_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getGradient(project.project_name)} opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 flex items-center justify-center`}>
                      <Folder className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {/* Overlay shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 right-3 flex gap-2 pointer-events-none">
                    <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> {project.status}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mb-1">{project.project_name}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5" /> {project.assets_count || 0} Assets
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center">
                      Open Workspace <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-3xl text-slate-500">
            <Folder className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold">No active projects found.</h3>
            <p className="text-sm font-medium">Create a new project to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
