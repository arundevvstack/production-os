"use client";

import React, { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { approveAllPrompts } from "./actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function ApproveAllPromptsButton({ projectId, hasUnapproved }: { projectId: string, hasUnapproved: boolean }) {
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!hasUnapproved) return null;

  const handleApproveAll = async () => {
    setIsApproving(true);
    try {
      await approveAllPrompts(projectId);
      toast({
        title: "All Prompts Approved",
        description: "All generated prompts have been approved.",
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve all prompts",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <button 
      onClick={handleApproveAll}
      disabled={isApproving}
      className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold text-sm hover:bg-emerald-100 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
      Approve All Prompts
    </button>
  );
}
