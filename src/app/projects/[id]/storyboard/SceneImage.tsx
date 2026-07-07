"use client";

import React, { useState } from "react";
import { RefreshCw, ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SceneImage({ scene, projectId, sceneIndex, readOnly = false }: { scene: any, projectId: string, sceneIndex: number, readOnly?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/storyboard-gen/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIndex })
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      router.refresh(); // Refresh the page to get the updated scene data
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("Failed to generate image. Please check your OpenAI API key in settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  const hasImage = !!scene.image_url;

  return (
    <div className="aspect-video bg-slate-100 border-b flex items-center justify-center relative overflow-hidden group">
      {hasImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={scene.image_url} 
          alt={scene.title} 
          className="w-full h-full object-cover transition duration-300"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
          <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Render</span>
        </div>
      )}
      
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex gap-2 shadow-sm">
        <span>SCENE {scene.scene_number}</span>
      </div>
      {scene.ai_confidence && (
        <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          {scene.ai_confidence}% AI Match
        </div>
      )}

      {/* Hover Overlay with Regenerate button */}
      {/* Only show the hover regenerate button if not in readOnly mode */}
      {!readOnly && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
          <button 
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:scale-105 transition transform disabled:opacity-80 disabled:scale-100"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Regenerate Image</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}