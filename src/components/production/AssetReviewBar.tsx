"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AssetReviewBar({ 
  projectId, 
  assetId, 
  currentStatus 
}: { 
  projectId: string;
  assetId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleReview = async (status: string) => {
    setLoadingAction(status);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets/${assetId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
          throw new Error(await res.text());
      }
      if (!contentType.includes("application/json")) {
          throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
      }
      router.refresh();
    } catch (e) {
      alert("Error reviewing asset.");
    } finally {
      setLoadingAction(null);
    }
  };

  if (currentStatus === "Approved") {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700 font-bold">
          <CheckCircle className="h-5 w-5" />
          Asset Approved
        </div>
        <button 
          onClick={() => handleReview("Pending Review")}
          className="text-xs font-medium text-green-700 hover:underline"
        >
          Reset Status
        </button>
      </div>
    );
  }

  if (currentStatus === "Rejected" || currentStatus === "Needs Regeneration") {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-700 font-bold">
          <XCircle className="h-5 w-5" />
          {currentStatus === "Rejected" ? "Asset Rejected" : "Needs Regeneration"}
        </div>
        <button 
          onClick={() => handleReview("Pending Review")}
          className="text-xs font-medium text-red-700 hover:underline"
        >
          Reset Status
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-amber-800 font-bold flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Pending Review
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <button 
          onClick={() => handleReview("Approved")}
          disabled={!!loadingAction}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition disabled:opacity-50"
        >
          {loadingAction === "Approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Approve
        </button>
        <button 
          onClick={() => handleReview("Rejected")}
          disabled={!!loadingAction}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition disabled:opacity-50"
        >
          {loadingAction === "Rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Reject
        </button>
        <button 
          onClick={() => handleReview("Needs Regeneration")}
          disabled={!!loadingAction}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-bold transition disabled:opacity-50"
        >
          {loadingAction === "Needs Regeneration" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate
        </button>
      </div>
    </div>
  );
}
