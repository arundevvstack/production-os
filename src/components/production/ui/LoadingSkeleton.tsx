import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingSkeleton({ text = "Rendering" }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-slate-200/50 animate-pulse flex flex-col items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{text}</span>
    </div>
  );
}
