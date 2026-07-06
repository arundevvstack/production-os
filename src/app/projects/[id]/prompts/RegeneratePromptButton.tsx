"use client";

import React, { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { regeneratePromptVersion } from "./actions";
import { useToast } from "@/hooks/use-toast";

export function RegeneratePromptButton({ versionId, projectId }: { versionId: string, projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      await regeneratePromptVersion(versionId, projectId);
      toast({
        title: "Prompt Regenerated",
        description: "The prompt has been regenerated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate prompt",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleRegenerate}
      disabled={isGenerating}
      title="Regenerate Prompt"
      className="p-2 bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors focus:outline-none disabled:opacity-50"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
    </button>
  );
}
