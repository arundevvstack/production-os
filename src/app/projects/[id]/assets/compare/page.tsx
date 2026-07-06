"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, SplitSquareHorizontal, History, Check, X } from "lucide-react";

export default function VersionComparePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;
  const assetId = searchParams.get("id");

  const [asset, setAsset] = useState<any>(null);
  const [versionA, setVersionA] = useState<any>(null);
  const [versionB, setVersionB] = useState<any>(null);

  useEffect(() => {
    if (assetId) fetchAsset();
  }, [projectId, assetId]);

  const fetchAsset = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets`);
      if (res.ok) {
        const assets = await res.json();
        const found = assets.find((a: any) => a.id === assetId);
        if (found) {
          setAsset(found);
          const versions = found.ProductionAssetVersion;
          if (versions.length > 0) setVersionA(versions[0]);
          if (versions.length > 1) setVersionB(versions[1]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!asset) return <div className="p-12 text-center">Loading Asset Data...</div>;

  const versions = asset.ProductionAssetVersion || [];

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Version Comparison</h1>
            <p className="text-slate-500">Asset: {asset.type} • ID: {asset.id.substring(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><History className="mr-2 h-4 w-4" /> View History</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version A */}
        <Card className="flex flex-col h-full border-primary/20">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                Version A
                <select 
                  className="text-sm font-normal p-1 rounded border"
                  value={versionA?.id || ""}
                  onChange={(e) => setVersionA(versions.find((v:any) => v.id === e.target.value))}
                >
                  {versions.map((v:any) => <option key={v.id} value={v.id}>v{v.version_number}</option>)}
                </select>
              </CardTitle>
              <Badge>{versionA?.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="bg-black/5 aspect-video flex items-center justify-center">
              {versionA?.file_url ? (
                asset.type.includes('Image') ? <img src={versionA.file_url} className="max-h-full object-contain" /> : <video src={versionA.file_url} controls className="max-h-full" />
              ) : <span className="text-slate-400">No media available</span>}
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Model</span>
                  <span className="font-medium">{versionA?.model_name || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Provider</span>
                  <span className="font-medium">{versionA?.provider_id || "Unknown"}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-sm">Prompt</span>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm text-slate-700 dark:text-slate-300">
                  {versionA?.metadata?.textContent || versionA?.metadata?.prompt || "No prompt data available"}
                </div>
              </div>
              {versionA?.metadata?.ai_review && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <span className="text-blue-700 dark:text-blue-400 font-semibold text-sm mb-2 block">AI Review Scores</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Visual Quality: {versionA.metadata.ai_review.visual_quality}</div>
                    <div>Brand Match: {versionA.metadata.ai_review.brand_match}</div>
                    <div>Overall: {versionA.metadata.ai_review.overall}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Version B */}
        <Card className="flex flex-col h-full border-slate-200">
          <CardHeader className="bg-slate-50 pb-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                Version B
                <select 
                  className="text-sm font-normal p-1 rounded border"
                  value={versionB?.id || ""}
                  onChange={(e) => setVersionB(versions.find((v:any) => v.id === e.target.value))}
                >
                  <option value="">None</option>
                  {versions.map((v:any) => <option key={v.id} value={v.id}>v{v.version_number}</option>)}
                </select>
              </CardTitle>
              {versionB && <Badge variant="outline">{versionB.status}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {versionB ? (
              <>
                <div className="bg-black/5 aspect-video flex items-center justify-center">
                  {versionB.file_url ? (
                    asset.type.includes('Image') ? <img src={versionB.file_url} className="max-h-full object-contain" /> : <video src={versionB.file_url} controls className="max-h-full" />
                  ) : <span className="text-slate-400">No media available</span>}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block mb-1">Model</span>
                      <span className="font-medium">{versionB.model_name || "Unknown"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Provider</span>
                      <span className="font-medium">{versionB.provider_id || "Unknown"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 text-sm">Prompt</span>
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm text-slate-700 dark:text-slate-300">
                      {versionB.metadata?.textContent || versionB.metadata?.prompt || "No prompt data available"}
                    </div>
                  </div>
                  {versionB.metadata?.ai_review && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <span className="text-blue-700 dark:text-blue-400 font-semibold text-sm mb-2 block">AI Review Scores</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Visual Quality: {versionB.metadata.ai_review.visual_quality}</div>
                        <div>Brand Match: {versionB.metadata.ai_review.brand_match}</div>
                        <div>Overall: {versionB.metadata.ai_review.overall}</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 p-12">
                Select a version to compare
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
