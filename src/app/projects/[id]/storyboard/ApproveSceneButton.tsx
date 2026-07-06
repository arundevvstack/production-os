"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApproveSceneButton({
  projectId,
  sceneIndex,
  initialApproved
}: {
  projectId: string;
  sceneIndex: number;
  initialApproved: boolean;
}) {
  const [isApproved, setIsApproved] = useState(initialApproved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/storyboard-gen/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneIndex, approved: !isApproved })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsApproved(!isApproved);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to approve scene:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isApproved) {
    return (
      <button 
        onClick={handleToggle}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 text-sm font-bold py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Approved
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold py-2 rounded-lg transition disabled:opacity-50"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      Approve Scene
    </button>
  );
}
