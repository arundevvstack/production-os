"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageOpen, Download, FileJson, CheckCircle2, Archive, Loader2 } from "lucide-react";

export default function DeliveryManagerPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [manifest, setManifest] = useState<any>(null);

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

  const generateManifest = () => {
    setIsGenerating(true);
    
    // Simulate generation time
    setTimeout(() => {
      const deliveryData = {
        projectId,
        generatedAt: new Date().toISOString(),
        totalAssets: assets.length,
        version: "1.0",
        items: assets.map(a => ({
          id: a.id,
          type: a.type,
          version: a.ProductionAssetVersion?.[0]?.version_number,
          url: a.ProductionAssetVersion?.[0]?.file_url,
          provider: a.ProductionAssetVersion?.[0]?.provider_id,
          aiScore: a.ProductionAssetVersion?.[0]?.metadata?.ai_review?.overall,
          humanScore: a.ProductionAssetVersion?.[0]?.metadata?.human_review?.overall
        }))
      };
      setManifest(deliveryData);
      setIsGenerating(false);
    }, 1000);
  };

  const handleDownloadManifest = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manifest_${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PackageOpen className="h-8 w-8 text-indigo-500" /> Delivery Manager
          </h1>
          <p className="text-slate-500">Package and export approved production assets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Assets Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery Payload</CardTitle>
            <CardDescription>{assets.length} approved assets ready for packaging.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-6 text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {assets.map(asset => {
                  const url = asset.ProductionAssetVersion?.[0]?.file_url;
                  return (
                    <div key={asset.id} className="border rounded-lg overflow-hidden relative group">
                      <div className="absolute top-1 right-1 z-10"><CheckCircle2 className="h-4 w-4 text-green-500 bg-white rounded-full" /></div>
                      <div className="aspect-square bg-slate-100 flex items-center justify-center">
                         {url ? (asset.type.includes('Image') ? <img src={url} className="object-cover w-full h-full" /> : <video src={url} className="object-cover w-full h-full" />) : <span className="text-xs text-slate-400">No Media</span>}
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 border-t">
                        <p className="text-xs font-semibold truncate">{asset.type}</p>
                        <p className="text-[10px] text-slate-500">v{asset.ProductionAssetVersion?.[0]?.version_number}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={generateManifest} disabled={isGenerating || assets.length === 0}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />} 
                Generate Manifest
              </Button>
              <Button className="w-full" variant="outline" disabled={!manifest}>
                <Archive className="mr-2 h-4 w-4" /> Export ZIP Package
              </Button>
            </CardContent>
          </Card>

          {manifest && (
            <Card className="border-green-200 dark:border-green-900/50">
              <CardHeader className="bg-green-50 dark:bg-green-900/10 pb-4">
                <CardTitle className="text-green-700 dark:text-green-400 text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Package Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-sm space-y-2 mb-4">
                  <div className="flex justify-between"><span className="text-slate-500">Total Items</span><span>{manifest.totalAssets}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Generated</span><span>{new Date(manifest.generatedAt).toLocaleTimeString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Manifest Version</span><span>{manifest.version}</span></div>
                </div>
                <Button className="w-full" variant="secondary" onClick={handleDownloadManifest}>
                  <Download className="mr-2 h-4 w-4" /> Download JSON
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
