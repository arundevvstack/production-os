"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Play, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditingWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovedAssets();
  }, [projectId]);

  const fetchApprovedAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets?status=Approved`);
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const images = assets.filter(a => a.type.toLowerCase().includes('image'));
  const videos = assets.filter(a => a.type.toLowerCase().includes('video'));
  const audio = assets.filter(a => a.type.toLowerCase().includes('audio') || a.type.toLowerCase().includes('voice'));

  return (
    <div className="p-6 h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Scissors className="h-6 w-6" /> Editing Workspace
          </h1>
          <p className="text-slate-400">Timeline strictly limited to Approved Assets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800"><Settings className="mr-2 h-4 w-4" /> Export Settings</Button>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700"><Play className="mr-2 h-4 w-4" /> Render Sequence</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Media Pool */}
        <Card className="lg:col-span-1 bg-slate-950 border-slate-800 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-slate-200 text-lg">Media Bin (Approved Only)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 overflow-y-auto flex-1 space-y-2">
            {isLoading && <div className="text-slate-500 text-sm">Loading...</div>}
            {!isLoading && assets.length === 0 && <div className="text-slate-500 text-sm">No approved media found.</div>}
            
            {assets.map(asset => {
              const url = asset.ProductionAssetVersion?.[0]?.file_url;
              return (
                <div key={asset.id} className="p-2 bg-slate-800 rounded flex gap-3 items-center hover:bg-slate-700 cursor-pointer transition-colors border border-slate-700">
                  <div className="h-12 w-16 bg-black flex-shrink-0 rounded overflow-hidden">
                    {url && (asset.type.includes('Image') ? <img src={url} className="object-cover w-full h-full" /> : <video src={url} className="object-cover w-full h-full" />)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-200 truncate">{asset.type} v{asset.ProductionAssetVersion?.[0]?.version_number}</p>
                    <p className="text-xs text-slate-400 truncate">{asset.id}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Viewer & Timeline */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full min-h-0">
          
          {/* Main Viewer */}
          <div className="flex-1 bg-black rounded-lg border border-slate-800 flex items-center justify-center relative shadow-inner overflow-hidden">
             <div className="text-slate-600 flex flex-col items-center">
                <Play className="h-16 w-16 opacity-50 mb-4" />
                <p>Sequence Viewer</p>
             </div>
             <div className="absolute top-4 right-4"><Badge variant="outline" className="text-white border-white/20">1920x1080 24fps</Badge></div>
          </div>

          {/* Timeline */}
          <Card className="h-64 bg-slate-950 border-slate-800 flex flex-col flex-shrink-0">
            <CardHeader className="py-2 px-4 border-b border-slate-800 bg-slate-900">
              <CardTitle className="text-xs text-slate-400 font-mono flex gap-4">
                <span>00:00:00:00</span>
                <span>00:00:01:00</span>
                <span>00:00:02:00</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative overflow-x-auto overflow-y-hidden">
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 left-32 w-[1px] bg-red-500 z-10 shadow-[0_0_10px_red]">
                 <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rotate-45" />
              </div>

              {/* Tracks */}
              <div className="flex flex-col h-full py-2">
                <div className="flex-1 border-b border-slate-800/50 flex items-center px-4 gap-2">
                  <span className="w-16 text-xs text-slate-500 font-mono">V1</span>
                  {videos.length > 0 && <div className="h-3/4 w-48 bg-blue-600/50 rounded border border-blue-500 flex items-center px-2 text-xs truncate">Video Clip</div>}
                </div>
                <div className="flex-1 border-b border-slate-800/50 flex items-center px-4 gap-2">
                  <span className="w-16 text-xs text-slate-500 font-mono">V2</span>
                  {images.length > 0 && <div className="h-3/4 w-32 bg-purple-600/50 rounded border border-purple-500 flex items-center px-2 text-xs truncate">Image Overlay</div>}
                </div>
                <div className="flex-1 flex items-center px-4 gap-2">
                  <span className="w-16 text-xs text-slate-500 font-mono">A1</span>
                  {audio.length > 0 && <div className="h-3/4 w-64 bg-green-600/50 rounded border border-green-500 flex items-center px-2 text-xs truncate">Audio Track</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
