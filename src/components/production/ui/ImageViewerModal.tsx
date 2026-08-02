import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  metadata?: {
    prompt?: string;
    negativePrompt?: string;
    model?: string;
    seed?: string | number;
    steps?: string | number;
    cfg?: string | number;
  };
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, metadata }: ImageViewerModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `render_${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-950 text-slate-200 border-slate-800">
        <DialogHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between bg-slate-900">
          <DialogTitle className="text-slate-200 text-lg">Professional Result Viewer</DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 h-[70vh]">
          <div className="md:col-span-2 bg-black flex items-center justify-center p-4 relative">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             {imageUrl && <img src={imageUrl} alt="Rendered Result" className="max-w-full max-h-full object-contain" />}
          </div>
          <div className="p-6 overflow-y-auto space-y-6 bg-slate-900 border-l border-slate-800 text-sm">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Prompt</h4>
              <p className="text-slate-300 font-mono text-xs">{metadata?.prompt || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Negative Prompt</h4>
              <p className="text-slate-300 font-mono text-xs">{metadata?.negativePrompt || "N/A"}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Generation Parameters</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Model</span>
                  <span className="block text-xs font-mono">{metadata?.model || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Seed</span>
                  <span className="block text-xs font-mono">{metadata?.seed || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Steps</span>
                  <span className="block text-xs font-mono">{metadata?.steps || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">CFG</span>
                  <span className="block text-xs font-mono">{metadata?.cfg || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
