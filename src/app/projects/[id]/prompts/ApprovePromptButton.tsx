"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { approvePromptVersion } from "./actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function ApprovePromptButton({ versionId, projectId }: { versionId: string, projectId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approvePromptVersion(versionId, projectId);
      toast({
        title: "Prompt Approved",
        description: "The prompt has been approved for Generation Studio.",
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve prompt",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <button 
      onClick={handleApprove}
      disabled={isApproving}
      className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-sm hover:bg-emerald-100 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      Approve Prompt
    </button>
  );
}
