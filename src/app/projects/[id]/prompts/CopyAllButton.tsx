"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CopyAllButton({ version }: { version: any }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyAll = () => {
    const motionPrompt = version?.video_prompt || version?.image_prompt || '';
    const camera = version?.camera_prompt || '';
    const lighting = version?.lighting_prompt || '';
    const environment = version?.environment_prompt || '';
    const negative = version?.negative_prompt || '';

    const textToCopy = `[MOTION PROMPT]
${motionPrompt}

[TECHNICAL SPECS]
Camera: ${camera}
Lighting: ${lighting}
Environment: ${environment}

[NEGATIVE EXCLUSIONS]
${negative}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({
      title: "Copied Full Prompt",
      description: "All prompt sections copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopyAll}
      title="Copy all prompt sections"
      className="p-2 bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors focus:outline-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{copied ? "Copied" : "Copy All"}</span>
    </button>
  );
}
