"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export function GenerateIntelligenceButton({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/intelligence/generate`, {
        method: 'POST'
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to generate packages.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating packages.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
    >
      {isGenerating ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Compiling Graph...</>
      ) : (
        <><Play className="w-4 h-4 fill-current" /> Compile All Packages</>
      )}
    </button>
  );
}
