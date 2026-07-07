"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, CheckCircle2, Download, Trash2, ShieldAlert, RefreshCw } from "lucide-react";

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/v1/gateway-proxy/models`);
      if (res.ok) setModels(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const clearCache = async () => {
    if (!confirm("Are you sure you want to clear the model cache? This will delete all downloaded models.")) return;
    setIsClearing(true);
    try {
      const res = await fetch(`/api/v1/gateway-proxy/cache/clear`, { method: "POST" });
      if (res.ok) await fetchModels();
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading Models...</div>;

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Manager</h1>
          <p className="text-slate-500">Manage downloaded AI models for local inference.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchModels} disabled={isRefreshing || isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" onClick={clearCache} disabled={isClearing}>
            {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Clear Cache
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((m: any) => (
          <Card key={m.id} className="flex flex-col">
            <CardHeader className="flex-1">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">{m.name}</CardTitle>
                {m.cached ? (
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-500"><Download className="h-3 w-3 mr-1" /> Not Downloaded</Badge>
                )}
              </div>
              <CardDescription className="text-xs font-mono truncate mt-2">{m.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Category</span>
                <span className="capitalize">{m.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Architecture</span>
                <span className="capitalize">{m.architecture}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>VRAM Req.</span>
                <span>{m.vram_gb ? `${m.vram_gb} GB` : "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Size</span>
                <span>{m.size_gb ? `${m.size_gb} GB` : "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Cache Size</span>
                <span>{m.cache_size_gb ? `${m.cache_size_gb} GB` : "0 GB"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Last Used</span>
                <span>{m.last_used ? new Date(m.last_used).toLocaleDateString() : "Never"}</span>
              </div>
              
              {m.requires_auth && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Requires HuggingFace Auth</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
