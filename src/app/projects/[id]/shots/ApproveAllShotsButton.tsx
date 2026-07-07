"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ApproveAllShotsButton({ projectId }: { projectId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();

  const handleApproveAll = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/shots-approve-all`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/projects/${projectId}/shots/review`);
      } else {
        console.error("Failed to approve shots");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <button 
      onClick={handleApproveAll}
      disabled={isApproving}
      className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 transition disabled:opacity-50"
    >
      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      {isApproving ? "Approving..." : "Approve All Shots"}
    </button>
  );
}
