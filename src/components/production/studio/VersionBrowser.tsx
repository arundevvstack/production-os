"use client";

import React from "react";
import { format } from "date-fns";
import { CheckCircle, Clock, Check, X, RefreshCw, ZoomIn } from "lucide-react";
import Link from "next/link";

export function VersionBrowser({ assets }: { assets: any[] }) {
  // Flatten all versions across all generated assets for this shot
  const allVersions = assets.flatMap(asset => 
    asset.ProductionAssetVersion.map((v: any) => ({
      ...v,
      assetId: asset.id,
      assetType: asset.type
    }))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allVersions.length === 0) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center text-slate-500">
        <Clock className="h-8 w-8 text-slate-700 mb-3" />
        <p className="text-sm font-medium text-slate-300">No Generations Yet</p>
        <p className="text-xs mt-1 max-w-[200px]">Generated assets for this shot will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Version History</div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{allVersions.length}</span>
      </div>

      <div className="space-y-4">
        {allVersions.map((version) => (
          <div key={version.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition group cursor-pointer">
            {/* Preview Image/Video area */}
            <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
              {version.file_url ? (
                version.assetType === 'Video' ? (
                  <video src={version.file_url} className="w-full h-full object-cover" />
                ) : (
                  <img src={version.file_url} className="w-full h-full object-cover" />
                )
              ) : version.assetType === 'Text' && version.metadata?.raw_response?.choices?.[0]?.message?.content ? (
                <div className="w-full h-full p-3 text-[8px] font-mono text-slate-300 overflow-hidden break-words text-left">
                  {version.metadata.raw_response.choices[0].message.content}
                </div>
              ) : (
                <div className="text-xs text-slate-600">No Preview</div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-sm">
                <Link href={`/projects/${version.asset.project_id}/assets/${version.assetId}`} className="h-8 w-8 bg-slate-800 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition">
                  <ZoomIn className="h-4 w-4" />
                </Link>
                {version.status !== "Approved" && (
                  <button className="h-8 w-8 bg-slate-800 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-2 left-2 flex gap-1">
                {version.status === "Approved" && (
                  <div className="bg-green-600/90 text-white p-1 rounded backdrop-blur">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
                <div className="bg-black/70 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur uppercase tracking-wider">
                  v{version.version_number}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-3 bg-slate-800">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-slate-200 truncate">{version.model_name || "Unknown Model"}</div>
                <div className="text-[10px] text-slate-500">{format(new Date(version.created_at), 'HH:mm')}</div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Job: {version.job_id?.substring(0, 8)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
