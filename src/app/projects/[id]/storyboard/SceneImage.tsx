"use client";

import React, { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AssetCard } from "@/components/production/ui/AssetCard";

export function SceneImage({
  scene,
  projectId,
  sceneIndex,
  readOnly = false,
  aspectRatio,
}: {
  scene: any;
  projectId: string;
  sceneIndex: number;
  readOnly?: boolean;
  aspectRatio?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch(
        `/api/v1/projects/${projectId}/workflows/storyboard-gen/image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneIndex }),
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert(
        "Failed to generate image. Please check your AI provider configuration."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const hasImage = !!scene.image_url;

  const badgeOverlay = (
    <>
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
        SCENE {scene.scene_number}
      </div>
      {scene.ai_confidence && (
        <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          {scene.ai_confidence}% AI Match
        </div>
      )}
    </>
  );

  const hoverOverlay = !readOnly && (
    <button
      onClick={handleRegenerate}
      disabled={isGenerating}
      className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:scale-105 transition transform disabled:opacity-80 disabled:scale-100"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" /> Regenerate Image
        </>
      )}
    </button>
  );

  return (
    <AssetCard 
      assetUrl={scene.image_url}
      status={isGenerating ? "Generating" : (hasImage ? "Completed" : "Pending")}
      badgeOverlay={badgeOverlay}
      hoverOverlay={hoverOverlay}
      className="border-0 shadow-none rounded-none"
      aspectRatio={aspectRatio}
    />
  );
}