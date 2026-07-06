"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Trash, RefreshCw, Eye, CheckCircle2, Copy } from "lucide-react";

export default function AssetManagerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const fetchAssets = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets`);
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedAssets(newSelected);
  };

  const handleBulkApprove = async () => {
    for (const id of Array.from(selectedAssets)) {
      const asset = assets.find(a => a.id === id);
      if (asset?.ProductionAssetVersion?.[0]) {
        await fetch(`/api/v1/projects/${projectId}/assets/${id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            versionId: asset.ProductionAssetVersion[0].id, 
            decision: "Approved", 
            scores: { overall: 100 } 
          })
        });
      }
    }
    setSelectedAssets(new Set());
    fetchAssets();
  };

  const filteredAssets = assets.filter(a => a.type.toLowerCase().includes(searchQuery.toLowerCase()) || a.status.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creative Asset Manager</h1>
          <p className="text-slate-500">Digital Asset Management (DAM)</p>
        </div>
        <div className="flex gap-2">
          {selectedAssets.size > 0 && (
            <>
              <Button variant="outline" onClick={handleBulkApprove}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve All</Button>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
              <Button variant="destructive"><Trash className="mr-2 h-4 w-4" /> Delete</Button>
            </>
          )}
          <Button variant="default" onClick={() => router.push(`/projects/${projectId}/generation`)}>+ Generate</Button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border">
        <div className="flex items-center gap-2 w-1/2">
          <Search className="h-4 w-4 text-slate-500 ml-2" />
          <Input placeholder="Search assets by type, prompt, or status..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 shadow-none" />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <Button variant="ghost" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="text-xs">Grid</TabsTrigger>
              <TabsTrigger value="list" className="text-xs">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAssets.map(asset => {
            const currentVersion = asset.ProductionAssetVersion?.[0];
            const meta = currentVersion?.metadata || {};
            const aiScore = meta.ai_review?.overall;
            return (
              <Card key={asset.id} className={`overflow-hidden transition-all hover:shadow-md ${selectedAssets.has(asset.id) ? 'ring-2 ring-primary' : ''}`}>
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center group">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox checked={selectedAssets.has(asset.id)} onCheckedChange={() => toggleSelect(asset.id)} />
                  </div>
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <Badge variant={asset.status === 'Approved' ? 'default' : asset.status === 'Rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {asset.status}
                    </Badge>
                  </div>
                  {currentVersion?.file_url ? (
                    asset.type.includes('Image') ? (
                      <img src={currentVersion.file_url} alt="Asset" className="w-full h-full object-cover" />
                    ) : (
                      <video src={currentVersion.file_url} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span className="text-xs text-slate-400">Processing...</span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <Button size="icon" variant="secondary" onClick={() => router.push(`/projects/${projectId}/assets/compare?id=${asset.id}`)}><Eye className="h-4 w-4" /></Button>
                     <Button size="icon" variant="secondary" onClick={() => router.push(`/projects/${projectId}/reviews`)}><CheckCircle2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm truncate">{asset.type} v{currentVersion?.version_number || 1}</h3>
                    {aiScore && <Badge variant="outline" className="text-[10px]">AI: {aiScore}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{currentVersion?.model_name || "Unknown Model"}</p>
                  <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    <span>{meta.durationMs ? `${(meta.durationMs/1000).toFixed(1)}s` : ''}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* List View Implementation Placeholder */}
          <div className="p-8 text-center text-slate-500">List view active (Simplified for brevity)</div>
        </div>
      )}
    </div>
  );
}
