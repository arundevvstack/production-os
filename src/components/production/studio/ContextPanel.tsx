"use client";

import React from "react";
import { Info, Camera, Lightbulb, Image as ImageIcon, Map, Clapperboard } from "lucide-react";

export function ContextPanel({ project, shot }: { project: any, shot: any }) {
  const { scene } = shot;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Context</div>
        <h2 className="text-lg font-bold text-white leading-tight">
          S{scene.scene_number.toString().padStart(2, '0')} - Shot {shot.shot_number}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{project.project_name}</p>
      </div>

      {/* Scene Summary */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm mb-3">
          <Clapperboard className="h-4 w-4 text-blue-400" />
          Scene Details
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Title</div>
            <div className="text-sm text-slate-200">{scene.title}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Mood</div>
            <div className="text-sm text-slate-200">{scene.mood || "Not specified"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Objective</div>
            <div className="text-sm text-slate-200">{scene.objective || "Not specified"}</div>
          </div>
        </div>
      </div>

      {/* Shot Parameters */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm mb-3">
          <Camera className="h-4 w-4 text-emerald-400" />
          Shot Parameters
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Camera</div>
            <div className="text-sm text-slate-200">{shot.camera || "Not specified"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Lens</div>
            <div className="text-sm text-slate-200">{shot.lens || "Not specified"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Lighting</div>
            <div className="text-sm text-slate-200">{shot.lighting || "Not specified"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Environment</div>
            <div className="text-sm text-slate-200">{shot.environment || "Not specified"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Character</div>
            <div className="text-sm text-slate-200">{shot.character || "Not specified"}</div>
          </div>
        </div>
      </div>

      {/* References */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
            <ImageIcon className="h-4 w-4 text-purple-400" />
            References
          </div>
          <button className="text-xs text-blue-400 hover:underline">Manage</button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Mock placeholders since references aren't fully uploaded yet */}
          <div className="aspect-square bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-600 text-xs hover:border-slate-500 cursor-pointer transition">
            + Add
          </div>
          <div className="aspect-square bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-600 text-xs hover:border-slate-500 cursor-pointer transition">
            + Add
          </div>
        </div>
      </div>
    </div>
  );
}
