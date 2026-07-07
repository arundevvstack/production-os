"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Trash, Eye, Copy, RefreshCw, LayoutGrid, List as ListIcon, Image as ImageIcon, Video, Loader2, Sparkles, Send, FolderOpen, Edit3, Check, FileJson } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AssetManagerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  
  const [view, setView] = useState<"grid" | "list">("grid");

  const [previewAsset, setPreviewAsset] = useState<any>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState("");

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets`);
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedAssets(newSelected);
  };

  const selectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} asset(s)?`)) return;
    try {
      await Promise.all(ids.map(id => fetch(`/api/v1/projects/${projectId}/assets/${id}`, { method: "DELETE" })));
      toast({ title: "Deleted", description: `${ids.length} asset(s) deleted.` });
      setSelectedAssets(new Set());
      fetchAssets();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDownload = async (asset: any) => {
    const url = asset.ProductionAssetVersion?.[0]?.file_url;
    if (!url) {
      toast({ title: "Error", description: "No file URL available", variant: "destructive" });
      return;
    }
    window.open(url, '_blank');
  };

  const handleCopyPrompt = (asset: any) => {
    const prompt = asset.ProductionAssetVersion?.[0]?.prompt_snapshot?.prompt;
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      toast({ title: "Copied", description: "Prompt copied to clipboard." });
    } else {
      toast({ title: "Not Found", description: "No prompt available for this asset.", variant: "destructive" });
    }
  };

  const handleCopyMetadata = (asset: any) => {
    const snapshot = asset.ProductionAssetVersion?.[0]?.prompt_snapshot;
    if (snapshot) {
      navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      toast({ title: "Copied", description: "Metadata copied to clipboard." });
    }
  };

  const handleCopyPath = (asset: any) => {
    const url = asset.ProductionAssetVersion?.[0]?.file_url;
    if (url) {
      // In a real local app, this would be the absolute path. For now, we copy the URL.
      navigator.clipboard.writeText(url);
      toast({ title: "Copied", description: "File path copied to clipboard." });
    }
  };

  const handleOpenFolder = async (asset: any) => {
    // Call the local backend to open the OS folder
    try {
      const url = asset.ProductionAssetVersion?.[0]?.file_url;
      if (!url) return;
      const filename = url.split('/').pop();
      await fetch(`/api/v1/system/open-folder`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      toast({ title: "Opening Folder", description: "Opening local storage directory." });
    } catch(e) {
      console.error(e);
    }
  };

  const handleRename = async () => {
    if (!previewAsset || !renameText.trim()) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets/${previewAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [renameText] }) // Using tags to store custom name for now
      });
      if (res.ok) {
        toast({ title: "Renamed", description: "Asset renamed successfully." });
        setIsRenaming(false);
        fetchAssets();
        // Update local preview state
        setPreviewAsset({ ...previewAsset, tags: [renameText] });
      }
    } catch(e) {
      toast({ title: "Error", description: "Failed to rename asset.", variant: "destructive" });
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = a.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.ProductionAssetVersion?.[0]?.prompt_snapshot?.prompt || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "All" || (typeFilter === "Image" && a.type.includes("Image")) || (typeFilter === "Video" && a.type.includes("Video"));
      return matchesSearch && matchesType;
    });
  }, [assets, searchQuery, typeFilter]);

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Library</h1>
          <p className="text-slate-500">Manage all generated images and videos.</p>
        </div>
        <div className="flex gap-2">
          {selectedAssets.size > 0 && (
            <>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleDelete(Array.from(selectedAssets))}>
                <Trash className="mr-2 h-4 w-4" /> Delete ({selectedAssets.size})
              </Button>
            </>
          )}
          <Button onClick={() => router.push(`/projects/${projectId}/generation`)}>
            <Sparkles className="mr-2 h-4 w-4" /> Generate More
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-xl border shadow-sm gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <Search className="h-4 w-4 text-slate-400 ml-3" />
          <Input 
            placeholder="Search prompts..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-sm w-full" 
          />
        </div>
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center gap-1 border-r pr-3">
            <Button variant={typeFilter === "All" ? "secondary" : "ghost"} size="sm" onClick={() => setTypeFilter("All")} className="text-xs h-8">All</Button>
            <Button variant={typeFilter === "Image" ? "secondary" : "ghost"} size="sm" onClick={() => setTypeFilter("Image")} className="text-xs h-8"><ImageIcon className="w-3 h-3 mr-1" /> Images</Button>
            <Button variant={typeFilter === "Video" ? "secondary" : "ghost"} size="sm" onClick={() => setTypeFilter("Video")} className="text-xs h-8"><Video className="w-3 h-3 mr-1" /> Videos</Button>
          </div>
          
          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="text-xs px-2"><LayoutGrid className="w-3.5 h-3.5 mr-1" /> Grid</TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2"><ListIcon className="w-3.5 h-3.5 mr-1" /> List</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={fetchAssets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-white dark:bg-slate-900/50">
          <div className="text-center max-w-sm">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No assets found</h3>
            <p className="text-slate-500 text-sm mt-2 mb-6">You haven't generated any assets matching your criteria.</p>
            <Button onClick={() => router.push(`/projects/${projectId}/generation`)}>Go to Generation Studio</Button>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
          {filteredAssets.map(asset => {
            const currentVersion = asset.ProductionAssetVersion?.[0];
            const isSelected = selectedAssets.has(asset.id);
            const promptStr = currentVersion?.prompt_snapshot?.prompt || "No prompt available";
            const isVideo = asset.type.includes("Video");
            
            return (
              <Card 
                key={asset.id} 
                className={`group relative overflow-hidden transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:shadow-lg border-slate-200 dark:border-slate-800'}`}
                onClick={() => setPreviewAsset(asset)}
              >
                <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100 transition-opacity" data-selected={isSelected}>
                  <div className="bg-white/90 dark:bg-black/90 rounded-md shadow p-0.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(asset.id, { stopPropagation: () => {} } as any)} className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" />
                  </div>
                </div>
                
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  {currentVersion?.file_url ? (
                    isVideo ? (
                       <div className="relative w-full h-full">
                         <video src={currentVersion.file_url} className="w-full h-full object-cover" loop muted autoPlay playsInline />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                           <Video className="w-8 h-8 text-white/70 drop-shadow-md" />
                         </div>
                       </div>
                    ) : (
                      <img src={currentVersion.file_url} alt={asset.type} className="w-full h-full object-cover" loading="lazy" />
                    )
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                  
                  {/* Hover overlay actions */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                     <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-white/20 text-white hover:bg-white/40" onClick={(e) => { e.stopPropagation(); handleDownload(asset); }} title="Download">
                       <Download className="h-3.5 w-3.5" />
                     </Button>
                     <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-white/20 text-white hover:bg-white/40" onClick={(e) => { e.stopPropagation(); handleCopyPrompt(asset); }} title="Copy Prompt">
                       <Copy className="h-3.5 w-3.5" />
                     </Button>
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-slate-950">
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed" title={promptStr}>
                    {promptStr}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                      {currentVersion?.model_name || "Unknown"}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">
                    <Checkbox checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0} onCheckedChange={selectAll} />
                  </th>
                  <th className="px-4 py-3 w-24 text-center">Preview</th>
                  <th className="px-4 py-3">Prompt</th>
                  <th className="px-4 py-3 w-32">Model</th>
                  <th className="px-4 py-3 w-24">Type</th>
                  <th className="px-4 py-3 w-24">Date</th>
                  <th className="px-4 py-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const currentVersion = asset.ProductionAssetVersion?.[0];
                  const isSelected = selectedAssets.has(asset.id);
                  const isVideo = asset.type.includes("Video");
                  return (
                    <tr key={asset.id} className={`border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`} onClick={() => setPreviewAsset(asset)}>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(asset.id, { stopPropagation: () => {} } as any)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-16 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden border">
                          {currentVersion?.file_url ? (
                             isVideo ? <Video className="w-4 h-4 text-slate-400" /> : <img src={currentVersion.file_url} className="w-full h-full object-cover" />
                          ) : <ImageIcon className="w-4 h-4 text-slate-300" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="line-clamp-2 text-slate-600 dark:text-slate-300">
                          {currentVersion?.prompt_snapshot?.prompt || "No prompt available"}
                        </p>
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="font-mono text-[10px] whitespace-nowrap">{currentVersion?.model_name || "Unknown"}</Badge></td>
                      <td className="px-4 py-3"><span className="text-xs font-medium text-slate-500">{asset.type}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-slate-500 whitespace-nowrap">{new Date(asset.created_at).toLocaleDateString()}</span></td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(asset)}><Download className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete([asset.id])}><Trash className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-200">
          <div className="flex flex-col md:flex-row h-[70vh] max-h-[600px]">
             {/* Media Area */}
             <div className="flex-1 bg-black flex items-center justify-center relative group">
                {previewAsset?.ProductionAssetVersion?.[0]?.file_url ? (
                  previewAsset.type.includes("Video") ? (
                    <video src={previewAsset.ProductionAssetVersion[0].file_url} className="max-w-full max-h-full object-contain" controls autoPlay loop />
                  ) : (
                    <img src={previewAsset.ProductionAssetVersion[0].file_url} className="max-w-full max-h-full object-contain" />
                  )
                ) : (
                  <div className="text-slate-500 flex flex-col items-center"><ImageIcon className="w-12 h-12 mb-4 opacity-50" /><span>Media not found</span></div>
                )}
             </div>
             {/* Sidebar Info */}
             <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
               <DialogHeader className="p-4 border-b border-slate-800 text-left">
                 <DialogTitle className="text-slate-100 flex items-center justify-between">
                   {isRenaming ? (
                     <div className="flex items-center gap-2">
                       <Input value={renameText} onChange={e => setRenameText(e.target.value)} className="h-7 text-xs bg-slate-800 border-slate-700 text-white" />
                       <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300" onClick={handleRename}><Check className="h-4 w-4" /></Button>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className="truncate max-w-[150px]">{previewAsset?.tags?.[0] || "Asset Details"}</span>
                       <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => { setIsRenaming(true); setRenameText(previewAsset?.tags?.[0] || ""); }}><Edit3 className="h-3 w-3" /></Button>
                     </div>
                   )}
                   <Badge variant="outline" className="border-indigo-500 text-indigo-400">{previewAsset?.type}</Badge>
                 </DialogTitle>
               </DialogHeader>
               <div className="p-4 overflow-y-auto flex-1 space-y-6">
                 <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Prompt</h4>
                   <div className="relative group">
                     <p className="text-sm text-slate-300 leading-relaxed font-mono bg-slate-950 p-3 rounded-md">
                       {previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.prompt || "N/A"}
                     </p>
                     <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700" onClick={() => handleCopyPrompt(previewAsset)}>
                       <Copy className="h-3 w-3 text-slate-300" />
                     </Button>
                   </div>
                 </div>
                 
                 <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Generation Info</h4>
                   <div className="space-y-2 text-sm text-slate-300 bg-slate-950 p-3 rounded-md font-mono">
                     <div className="flex justify-between">
                       <span className="text-slate-500">Model:</span>
                       <span>{previewAsset?.ProductionAssetVersion?.[0]?.model_name || "Unknown"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Seed:</span>
                       <span>{previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.seed || "Random"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">CFG Scale:</span>
                       <span>{previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.cfg || "N/A"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Resolution:</span>
                       <span>{previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.width || "?"} x {previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.height || "?"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Scheduler:</span>
                       <span>{previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.scheduler || "euler"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Date:</span>
                       <span>{previewAsset && new Date(previewAsset.created_at).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">Gen Time:</span>
                       <span>{(previewAsset?.ProductionAssetVersion?.[0]?.prompt_snapshot?.generation_time || 0).toFixed(2)}s</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2">
                   <Button variant="outline" size="sm" className="bg-transparent border-slate-700 hover:bg-slate-800 text-xs text-slate-300" onClick={() => handleOpenFolder(previewAsset)}>
                     <FolderOpen className="mr-2 h-3 w-3" /> Open Folder
                   </Button>
                   <Button variant="outline" size="sm" className="bg-transparent border-slate-700 hover:bg-slate-800 text-xs text-slate-300" onClick={() => handleCopyPath(previewAsset)}>
                     <Copy className="mr-2 h-3 w-3" /> Copy Path
                   </Button>
                   <Button variant="outline" size="sm" className="col-span-2 bg-transparent border-slate-700 hover:bg-slate-800 text-xs text-slate-300" onClick={() => handleCopyMetadata(previewAsset)}>
                     <FileJson className="mr-2 h-3 w-3" /> Copy Metadata
                   </Button>
                 </div>
               </div>
               <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
                 <Button variant="outline" className="flex-1 bg-transparent border-slate-700 hover:bg-slate-800 hover:text-white" onClick={() => handleDownload(previewAsset)}>
                   <Download className="mr-2 h-4 w-4" /> Download
                 </Button>
                 <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push(`/projects/${projectId}/generation?assetId=${previewAsset?.id}`)}>
                   <Send className="mr-2 h-4 w-4" /> Use as Input
                 </Button>
               </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
