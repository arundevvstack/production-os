"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Play, RefreshCw, Image as ImageIcon } from "lucide-react";
import useSWR from "swr";

import { AssetCard } from "@/components/production/ui/AssetCard";
import { ImageViewerModal } from "@/components/production/ui/ImageViewerModal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Main Page Component
export default function GenerationStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  // SWR for Live Synchronization
  const { data: jobs = [], mutate: mutateJobs } = useSWR(`/api/v1/projects/${projectId}/jobs`, fetcher, {
    refreshInterval: 3000,
  });

  const [approvedPrompts, setApprovedPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);

  const [composedPrompt, setComposedPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [specs, setSpecs] = useState<any>({});
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Result Viewer State
  const [viewerJob, setViewerJob] = useState<any | null>(null);

  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}/prompts/approved`)
      .then(res => res.json())
      .then(pData => {
        setApprovedPrompts(pData);
        if (pData.length > 0 && !selectedPrompt) {
          handleSelectPrompt(pData[0]);
        }
      })
      .catch(e => console.error(e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleSelectPrompt = (item: any) => {
    setSelectedPrompt(item);
    setComposedPrompt(item.prompt.image_prompt || "");
    setNegativePrompt(item.prompt.negative_prompt || "");
    setSpecs(item.prompt.provider_parameters?.generation_specs || {
      model: "FLUX Dev",
      provider: "replicate",
      workflow: "txt2img",
      width: 1920,
      height: 1080,
      steps: 30
    });
  };

  const handleDispatchJob = async () => {
    if (!selectedPrompt) return alert("Please select a prompt first.");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: specs.provider || "AIGateway",
          model: specs.model || "flux-schnell",
          assetType: "Image",
          promptVersionId: selectedPrompt.prompt.id,
          specifications: specs
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Dispatch failed: ${errorText}`);
      } else {
        // Live Synchronization: Invalidate queue immediately after dispatch
        mutateJobs();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generation Studio</h1>
          <p className="text-slate-500">AI Image Generation (V2 Output Pipeline)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/assets`)}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Asset Library
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Approved Prompts */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Approved Prompts</CardTitle>
              <CardDescription>Select a prompt to generate.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2 max-h-[800px]">
              {approvedPrompts.length === 0 ? (
                <div className="text-sm text-slate-500 p-4 text-center border border-dashed rounded-lg">
                  No approved prompts found. Go to the Prompt Library to approve prompts first.
                </div>
              ) : (
                approvedPrompts.map((item, idx) => (
                  <div 
                    key={item.shot_id} 
                    onClick={() => handleSelectPrompt(item)}
                    className={`p-4 rounded-xl cursor-pointer border transition-colors ${selectedPrompt?.shot_id === item.shot_id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Shot {item.shot_number}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">Approved</Badge>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-3">
                      {item.prompt.image_prompt}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Final Editor & Dispatch */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Final Output & Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Final Prompt (Read-Only)</label>
                <Textarea 
                  placeholder="Approved prompt will appear here." 
                  value={composedPrompt}
                  readOnly
                  className="resize-none font-mono text-sm h-32 bg-slate-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Negative Prompt (Read-Only)</label>
                <Textarea 
                  value={negativePrompt}
                  readOnly
                  className="resize-none font-mono text-sm h-16 bg-slate-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Generation Specs</label>
                  <span className="text-xs text-slate-400">Injected from Prompt Library</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Model</span>
                    <span className="text-xs text-slate-800 font-mono">{specs?.model || "Auto"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Aspect Ratio</span>
                    <span className="text-xs text-slate-800 font-mono">{specs?.aspect_ratio || "16:9"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Steps</span>
                    <span className="text-xs text-slate-800 font-mono">{specs?.steps || "30"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CFG</span>
                    <span className="text-xs text-slate-800 font-mono">{specs?.cfg || "3.5"}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-auto pt-4" size="lg" onClick={handleDispatchJob} disabled={isLoading || !composedPrompt}>
                {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} 
                Generate Image
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Queue */}
        <div className="lg:col-span-3">
          <Card className="h-full max-h-[800px] flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>Render Queue</CardTitle>
                <Badge variant="outline">{jobs.filter((j: any) => j.status === 'Processing').length} Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {jobs.map((job: any) => (
                  <AssetCard key={job.id} job={job} onClick={setViewerJob} />
                ))}
                {jobs.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No jobs in queue.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageViewerModal 
        isOpen={!!viewerJob} 
        onClose={() => setViewerJob(null)}
        imageUrl={viewerJob?.ProductionAssetVersion?.[0]?.file_url || viewerJob?.ProductionAssetVersion?.[0]?.ProductionAsset?.preview_url || viewerJob?.ProductionAssetVersion?.[0]?.ProductionAsset?.asset_url}
        metadata={{
          prompt: viewerJob?.request?.prompt || viewerJob?.metadata?.composedPrompt,
          negativePrompt: viewerJob?.request?.negative_prompt,
          model: viewerJob?.model_name,
          seed: viewerJob?.generation_parameters?.seed || viewerJob?.metadata?.seed,
          steps: viewerJob?.generation_parameters?.steps || viewerJob?.metadata?.steps,
          cfg: viewerJob?.generation_parameters?.cfg || viewerJob?.metadata?.cfg
        }}
      />
    </div>
  );
}
