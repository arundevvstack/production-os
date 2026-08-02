"use client";

import React, { useState, useTransition } from "react";
import { ImagePlay, Activity, Wand2, Users, MapPin, Settings2, Save, ChevronDown, ChevronUp, Image as ImageIcon, Camera } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { CopyAllButton } from "./CopyAllButton";
import { RegeneratePromptButton } from "./RegeneratePromptButton";
import { ApprovePromptButton } from "./ApprovePromptButton";
import { updatePromptVersion } from "./actions";

export function PromptCard({ version, shot, projectId }: { version: any, shot: any, projectId: string }) {
  const [isPending, startTransition] = useTransition();
  
  // State for editable textareas
  const [imagePrompt, setImagePrompt] = useState(version?.image_prompt || "");
  const [negativePrompt, setNegativePrompt] = useState(version?.negative_prompt || "");
  
  // State for Generation Specs
  const initialSpecs = version?.provider_parameters?.generation_specs || {
    model: "FLUX Dev",
    provider: "replicate",
    workflow: "txt2img",
    width: 1920,
    height: 1080,
    aspect_ratio: "16:9",
    steps: 30,
    cfg: 3.5,
    sampler: "DPM++ 2M Karras",
    scheduler: "Karras",
    seed: "Auto",
    output_format: "PNG",
    quality: "standard"
  };
  
  const [specs, setSpecs] = useState(initialSpecs);
  
  // Accordion states
  const [cameraOpen, setCameraOpen] = useState(true);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);

  const isApproved = version?.status === "Approved";
  const cameraSpecs = version?.provider_parameters?.camera_specs || {};

  const handleSave = () => {
    startTransition(async () => {
      await updatePromptVersion(version.id, projectId, {
        image_prompt: imagePrompt,
        negative_prompt: negativePrompt,
        generation_specs: specs
      });
    });
  };

  const handleSpecChange = (key: string, val: string | number) => {
    setSpecs((prev: any) => ({ ...prev, [key]: val }));
  };

  return (
    <div className={`relative group bg-white border ${isApproved ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-200/60'} rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl`}>
      {/* Header */}
      <div className={`p-5 flex items-center justify-between ${isApproved ? 'bg-gradient-to-r from-emerald-900 to-emerald-950' : 'bg-gradient-to-r from-slate-900 to-slate-950'} text-slate-100 border-b border-white/10`}>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest ${isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-slate-300'}`}>
            SHOT ID {shot.shot_number}
          </div>
          <h3 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Master Generation Prompt
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave} 
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Saving...' : 'Save Edits'}
          </button>
          <CopyAllButton version={{...version, image_prompt: imagePrompt, negative_prompt: negativePrompt}} />
          <RegeneratePromptButton versionId={version.id} projectId={projectId} />
        </div>
      </div>
      
      {/* 1. Master Image Prompt & 2. Negative Prompt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 bg-slate-100">
        <div className="p-5 bg-white rounded-l-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <ImagePlay className="w-4 h-4" /> Master Image Prompt
            </div>
          </div>
          <textarea 
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="w-full text-sm font-mono text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Cinematic prompt..."
          />
        </div>

        <div className="p-5 bg-white rounded-r-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-4 h-4" /> Negative Prompt
            </div>
          </div>
          <textarea 
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full text-sm font-mono text-rose-700/80 leading-relaxed bg-rose-50/50 p-4 rounded-xl border border-rose-100 min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            placeholder="negative exclusions..."
          />
        </div>
      </div>

      {/* 3. Camera & Cinematography */}
      <div className="border-t border-slate-200/60">
        <button 
          onClick={() => setCameraOpen(!cameraOpen)} 
          className="w-full px-6 py-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <Camera className="w-4 h-4 text-indigo-500" />
            Camera & Cinematography
          </div>
          {cameraOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {cameraOpen && (
          <div className="p-6 bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Shot Type", value: cameraSpecs.shot_type },
              { label: "Lens", value: cameraSpecs.lens },
              { label: "Camera Angle", value: cameraSpecs.camera_angle },
              { label: "Camera Height", value: cameraSpecs.camera_height },
              { label: "Camera Distance", value: cameraSpecs.camera_distance },
              { label: "Movement", value: cameraSpecs.movement },
              { label: "Composition", value: cameraSpecs.composition },
              { label: "Framing", value: cameraSpecs.framing },
              { label: "Focus", value: cameraSpecs.focus },
            ].map(field => (
              <div key={field.label} className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.label}</label>
                <div className="text-sm font-semibold text-slate-800">{field.value || "—"}</div>
              </div>
            ))}
            {cameraSpecs.notes && (
              <div className="col-span-2 md:col-span-4 flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Notes</label>
                <div className="text-sm text-slate-700">{cameraSpecs.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Generation Specs */}
      <div className="border-t border-slate-200/60">
        <button 
          onClick={() => setSpecsOpen(!specsOpen)} 
          className="w-full px-6 py-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            Generation Specs
          </div>
          {specsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {specsOpen && (
          <div className="p-6 bg-white grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { label: "Model", key: "model", type: "text" },
              { label: "Aspect Ratio", key: "aspect_ratio", type: "text" },
              { label: "Width", key: "width", type: "number" },
              { label: "Height", key: "height", type: "number" },
              { label: "Steps", key: "steps", type: "number" },
              { label: "CFG Scale", key: "cfg", type: "number" },
              { label: "Sampler", key: "sampler", type: "text" },
              { label: "Scheduler", key: "scheduler", type: "text" },
              { label: "Seed", key: "seed", type: "text" },
              { label: "Output Format", key: "output_format", type: "text" }
            ].map(field => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                <input 
                  type={field.type}
                  value={specs[field.key] || ''}
                  onChange={(e) => handleSpecChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Reference Context */}
      <div className="border-t border-slate-200/60">
        <button 
          onClick={() => setContextOpen(!contextOpen)} 
          className="w-full px-6 py-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <Wand2 className="w-4 h-4 text-indigo-500" />
            Reference Context Injected
          </div>
          {contextOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {contextOpen && (
          <div className="px-6 py-4 bg-white flex flex-wrap items-center gap-4 text-xs text-slate-600">
            {version?.provider_parameters?.visual_bible_applied && (
              <span className="flex items-center gap-1.5 bg-slate-50 border px-3 py-1.5 rounded-lg shadow-sm font-medium"><Wand2 className="w-4 h-4 text-indigo-500"/> Visual Bible</span>
            )}
            {version?.provider_parameters?.characters_used?.length > 0 && (
              <span className="flex items-center gap-1.5 bg-slate-50 border px-3 py-1.5 rounded-lg shadow-sm font-medium"><Users className="w-4 h-4 text-indigo-500"/> Characters: {version.provider_parameters.characters_used.join(", ")}</span>
            )}
            {version?.provider_parameters?.locations_used?.length > 0 && (
              <span className="flex items-center gap-1.5 bg-slate-50 border px-3 py-1.5 rounded-lg shadow-sm font-medium"><MapPin className="w-4 h-4 text-indigo-500"/> Locations: {version.provider_parameters.locations_used.join(", ")}</span>
            )}
            {(!version?.provider_parameters?.visual_bible_applied && (!version?.provider_parameters?.characters_used || version?.provider_parameters?.characters_used?.length === 0) && (!version?.provider_parameters?.locations_used || version?.provider_parameters?.locations_used?.length === 0)) && (
              <span className="text-slate-400 italic">No external references matched</span>
            )}
          </div>
        )}
      </div>

      {/* 6. Image References */}
      <div className="border-t border-slate-200/60">
        <button 
          onClick={() => setRefsOpen(!refsOpen)} 
          className="w-full px-6 py-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            Image References
          </div>
          {refsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {refsOpen && (
          <div className="px-6 py-6 bg-white">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500">
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              <p className="font-medium">Drag & Drop Image References Here</p>
              <p className="text-xs text-slate-400 mt-1">Supports Future ControlNet & IP Adapter workflows</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Approval */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-t border-slate-100">
        <div className="flex items-center gap-6 text-xs font-bold text-slate-500 tracking-wide">
          {isApproved ? (
            <span className="text-emerald-500 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
              <Activity className="w-4 h-4" /> APPROVED
            </span>
          ) : (
            <span className="text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              STATUS: DRAFT
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ApprovePromptButton versionId={version.id} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
