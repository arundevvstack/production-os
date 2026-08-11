"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Cpu, HardDrive, Zap, Loader2, Package } from "lucide-react";

export default function GatewayMonitorPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [cache, setCache] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    fetchCache();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/v1/gateway-proxy/metrics`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      setMetrics(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchCache = async () => {
    try {
      const res = await fetch(`/api/v1/gateway-proxy/cache`);
      if (res.ok) setCache(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (!metrics && !error) return <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Connecting to Gateway...</div>;

  return (
    <div className="relative p-6 h-[100dvh] flex flex-col space-y-6 overflow-x-hidden overflow-y-auto bg-background text-foreground font-body">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gateway Monitor</h1>
        <p className="text-slate-500">Live statistics from your Local AI Server.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <strong>Connection Error:</strong> {error}. Ensure your AI Gateway is running on port 8000.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.cpu_percent || 0}%</div>
            <Progress value={metrics?.cpu_percent || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System RAM</CardTitle>
            <HardDrive className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.memory_percent || 0}%</div>
            <Progress value={metrics?.memory_percent || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Cache</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-500">{cache?.total_size_gb || 0} GB</div>
            <p className="text-xs text-muted-foreground mt-1">Free Space: {cache?.free_gb || 0} GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gateway Status</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{error ? "Offline" : "Online"}</div>
            <p className="text-xs text-muted-foreground mt-1">Native Sync Mode</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.queue_size || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending Generations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Model</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={metrics?.current_model || "None"}>{metrics?.current_model || "None"}</div>
            <p className="text-xs text-muted-foreground mt-1">Loaded in VRAM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Generation</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{metrics?.current_generation_id || "Idle"}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Job ID</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Inference Time</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.last_inference_time ? `${metrics.last_inference_time.toFixed(2)}s` : "0.00s"}</div>
            <p className="text-xs text-muted-foreground mt-1">Generation Speed</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">GPUs</h2>
      <div className="space-y-4">
        {metrics?.gpu?.devices?.map((gpu: any) => {
          const vramPercent = (gpu.allocated_memory_gb / gpu.total_memory_gb) * 100;
          return (
            <Card key={gpu.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  {gpu.name}
                </CardTitle>
                <CardDescription>GPU {gpu.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-1">
                  <span>VRAM Allocation</span>
                  <span className="font-medium">{gpu.allocated_memory_gb} GB / {gpu.total_memory_gb} GB</span>
                </div>
                <Progress value={vramPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Reserved: {gpu.reserved_memory_gb} GB</p>
              </CardContent>
            </Card>
          );
        })}
        {(!metrics?.gpu?.devices || metrics?.gpu?.devices.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              No GPUs detected. Running in CPU fallback mode.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

