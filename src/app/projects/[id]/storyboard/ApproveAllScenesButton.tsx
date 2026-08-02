"use client";

import { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApproveAllScenesButton({
  projectId,
  allApproved
}: {
  projectId: string;
  allApproved: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (allApproved) {
    return (
      <button 
        onClick={() => router.push(`/projects/${projectId}/scenes`)}
        className="px-4 py-2 bg-emerald-600 text-white border border-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-sm"
      >
        <CheckCheck className="w-4 h-4" />
        Proceed to Scene Manager
      </button>
    );
  }

  const handleApproveAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/storyboard-gen/approve-all`, {
        method: "POST"
      });
      
      const data = await res.json();
      if (data.success) {
        // Automatically extract scenes into the database
        await fetch(`/api/v1/projects/${projectId}/workflows/scene-extraction`, {
          method: "POST"
        });
        
        router.refresh();
        router.push(`/projects/${projectId}/scenes`);
      }
    } catch (error) {
      console.error("Failed to approve all scenes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleApproveAll}
      disabled={loading}
      className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
      Approve All Scenes
    </button>
  );
}
