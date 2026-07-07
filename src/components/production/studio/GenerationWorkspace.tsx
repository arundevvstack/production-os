"use client";

import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, Video, Mic, Music, Layout, Play, Loader2, Brain, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";

// Infer type for shot with included relations based on the page.tsx fetch
type ShotWithRelations = Prisma.ProductionShotGetPayload<{
  include: {
    creative_memories: true;
    ProductionAsset: {
      include: {
        ProductionAssetVersion: true;
      };
    };
    ProductionPromptSet: true;
  };
}>;

export function GenerationWorkspace({ 
  projectId, 
  shot, 
  promptSet, 
  graphDependencies 
}: { 
  projectId: string; 
  shot: ShotWithRelations; 
  promptSet: any; 
  graphDependencies?: any 
}) {
  const [prompt, setPrompt] = useState(promptSet?.image_prompt || "");
  const [negativePrompt, setNegativePrompt] = useState(promptSet?.negative_prompt || "");
  const [assetType, setAssetType] = useState("Image");
  const [provider, setProvider] = useState("OpenRouter");
  const [model, setModel] = useState("anthropic/claude-3.5-sonnet:beta");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const activeMemories = shot.creative_memories || [];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Auto-Inject Memory
    const memoryInjection = activeMemories.map((m: any) => m.prompt_snippet).join("\n");
    const finalPrompt = memoryInjection ? `${memoryInjection}\n\n${prompt}` : prompt;

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/jobs/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: shot.scene_id,
          shotId: shot.id,
          promptSetId: promptSet?.id,
          providerId: provider, // Note: The route expects provider_id (UUID), this UI currently uses provider string. 
          modelName: model,
          assetType,
          prompt: finalPrompt
        })
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
          throw new Error(await res.text());
      }
      if (!contentType.includes("application/json")) {
          throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
      }
      
      router.refresh();
    } catch (e) {
      alert("Error starting generation");
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  const assetTypes = [
    { id: "Image", icon: ImageIcon, active: true },
    { id: "Video", icon: Video, active: false },
    { id: "Voice", icon: Mic, active: false },
    { id: "Music", icon: Music, active: false },
    { id: "Text", icon: Layout, active: true } 
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">

      <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-8">
        
        {/* Asset Type Selector */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          {assetTypes.map(t => (
            <button
              key={t.id}
              onClick={() => t.active && setAssetType(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                assetType === t.id 
                  ? 'bg-blue-600 text-white' 
                  : t.active 
                    ? 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white' 
                    : 'bg-slate-900/50 text-slate-600 cursor-not-allowed'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.id}
            </button>
          ))}
        </div>

        {/* Provider & Model Selection */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
            >
              {/* Note: This should be dynamically loaded in the future. */}
              <option value="b11cb3ab-90df-4f4c-bc31-011293a985e5">OpenRouter (Default)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="anthropic/claude-3.5-sonnet:beta">Claude 3.5 Sonnet (Text)</option>
              <option value="openai/gpt-4o">GPT-4o (Text)</option>
            </select>
          </div>
        </div>

        {/* Memory Injection Panel */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
              <Brain className="h-4 w-4 text-pink-400" />
              Active Memory Profiles
            </div>
          </div>
          
          {activeMemories.length === 0 ? (
            <div className="text-xs text-slate-500 italic">No creative memory attached. Prompt will rely entirely on manual input.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeMemories.map((mem: any) => (
                <div key={mem.id} className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2">
                  <span className="font-bold">{mem.name}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{mem.type}</span>
                </div>
              ))}
            </div>
          )}
          {activeMemories.length > 0 && (
            <div className="mt-3 text-[10px] text-pink-400/70 uppercase tracking-wider font-bold">
              * Attached memories will be automatically injected into your prompt invisibly.
            </div>
          )}
        </div>

        {/* Prompt Editors */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
              <span>Main Prompt</span>
              <button className="text-blue-400 hover:underline flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Enhance
              </button>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the action or shot specifics..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-4 min-h-[160px] focus:outline-none focus:border-blue-500 transition resize-none placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Negative Prompt</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to exclude (e.g. blurry, text, distortion)..."
              className="w-full bg-slate-900/50 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:border-blue-500 transition resize-none placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Graph Dependencies UI */}
        {graphDependencies && graphDependencies.edges && graphDependencies.edges.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-500" /> Creative Graph Dependencies
            </div>
            <div className="flex flex-wrap gap-2">
              {graphDependencies.edges.map((edge: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded text-xs text-slate-300">
                  <span className="text-emerald-500 font-mono text-[10px] uppercase">{edge.relationship}</span>
                  <span className="font-bold">{edge.targetLabel}</span>
                  <span className="text-slate-500">({edge.targetType})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Generate Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-4 rounded-xl font-bold transition shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" fill="currentColor" />}
            {isGenerating ? "GENERATING..." : "GENERATE ASSET"}
          </button>
        </div>
      </div>
    </div>
  );
}
