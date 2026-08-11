"use client";
import React from "react";
import { AlertCircle, ImageIcon } from "lucide-react";
import { StatusBadge, AssetStatus } from "./StatusBadge";
import { LoadingSkeleton } from "./LoadingSkeleton";

export interface AssetCardProps {
  job?: any;
  assetUrl?: string; // Direct override if not using a job
  status?: AssetStatus; // Override status
  title?: string;
  subtitle?: string;
  onClick?: (jobOrData: any) => void;
  onClickData?: any; // Data passed to onClick
  badgeOverlay?: React.ReactNode; // Custom badges like SCENE 1
  hoverOverlay?: React.ReactNode; // Custom overlay on hover (e.g. Generate button)
  className?: string; // Custom root styles
  children?: React.ReactNode; // Custom content below image
  aspectRatio?: string; // Optional custom aspect ratio for the container
}

export function AssetCard({ 
  job, 
  assetUrl, 
  status, 
  title, 
  subtitle, 
  onClick, 
  onClickData, 
  badgeOverlay,
  hoverOverlay,
  className = "",
  children,
  aspectRatio
}: AssetCardProps) {

  // Priority Asset URL Resolution if job is provided
  const version = job?.ProductionAssetVersion?.[0];
  const productionAsset = version?.ProductionAsset;
  const finalImageUrl = assetUrl || version?.file_url || productionAsset?.preview_url || productionAsset?.asset_url;
  
  // Use explicitly provided status, else deduce from job, else determine if it has an image
  const displayStatus = status || job?.status || (finalImageUrl ? "Completed" : "Pending");
  const isGenerating = displayStatus === 'Processing' || displayStatus === 'Generating';
  const isCompleted = displayStatus === 'Completed' || displayStatus === 'Approved';
  const hasImage = !!finalImageUrl;
  const isFailedAsset = (isCompleted && !hasImage) || displayStatus === 'Failed';

  const handleClick = () => {
    if (onClick) {
      onClick(onClickData || job);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex flex-col bg-white dark:bg-slate-900 overflow-hidden group ${!className.includes('border') ? 'border rounded-xl shadow-sm' : ''} ${onClick ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all' : ''} ${className}`}
    >
      <div className="relative w-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-b border-slate-100" style={{ aspectRatio: aspectRatio ? (aspectRatio === "9:16" ? "9 / 16" : "16 / 9") : "16 / 9" }}>
        
        {isGenerating && (
          <LoadingSkeleton text="Rendering" />
        )}
        
        {isFailedAsset && (
          <div className="flex flex-col items-center justify-center text-rose-500 p-4 text-center absolute inset-0 bg-rose-50/50">
            <AlertCircle className="h-6 w-6 mb-2" />
            <span className="text-xs font-bold uppercase">Upload Failed</span>
          </div>
        )}

        {!isGenerating && !isFailedAsset && !hasImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Render</span>
          </div>
        )}

        {isCompleted && hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={finalImageUrl} alt={title || "Asset"} className="w-full h-full" style={{ objectFit: "contain" }} />
        )}

        <div className="absolute top-2 right-2">
          <StatusBadge status={displayStatus} />
        </div>

        {badgeOverlay}
        
        {hoverOverlay && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            {hoverOverlay}
          </div>
        )}
      </div>
      
      {children ? children : (
        (title || subtitle || job) && (
          <div className="p-3 text-sm space-y-1 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{title || job?.model_name || "Asset"}</span>
              {job?.duration && <span className="text-[10px] text-slate-400">{job.duration}s</span>}
            </div>
            {(subtitle || job) && (
              <p className="text-[10px] text-slate-500 font-mono flex gap-2 line-clamp-1">
                {subtitle || (
                  <>
                    <span>Seed: {job?.generation_parameters?.seed || job?.metadata?.seed || "N/A"}</span>
                    <span>Version: {version?.version_number || 1}</span>
                  </>
                )}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
