"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function ApproveBreakdownButton({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleApproveAndGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/visual-bible-gen`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to generate Visual Bible");
      
      toast({
        title: "Breakdown Approved",
        description: "Visual Bible generation started successfully.",
      });
      
      // Force refresh of the sidebar state
      router.refresh();
      // Redirect to the Visual Bible page
      router.push(`/projects/${projectId}/visual-bible`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleApproveAndGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Approve & Generate Visual Bible
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}