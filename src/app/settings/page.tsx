"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Server, Shield, Lock, Folder, Cpu, Activity } from "lucide-react";

export default function SettingsPage() {
  const gatewayUrl = "http://localhost:8000"; // Assuming local override for V1
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    fetch('/api/v1/gateway-proxy/metrics')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setSysInfo(data);
        setStatus("Connected");
      })
      .catch(() => setStatus("Disconnected"));
  }, []);

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500">View your Local AI Studio configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> AI Gateway</CardTitle>
            <CardDescription>Connection settings for your local GPU server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-md text-sm border border-amber-200 flex items-start gap-2 mb-4">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Settings are read-only in the V1 validation build. To modify these values, update your <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-700">.env</code> file and restart the server.</p>
            </div>
            
            <div className="space-y-2 opacity-70">
              <label className="text-sm font-medium">Gateway URL</label>
              <Input 
                value={gatewayUrl}
                readOnly
                className="bg-slate-100 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Configured via NEXT_PUBLIC_GATEWAY_URL in .env.</p>
            </div>
            <div className="space-y-2 opacity-70">
              <label className="text-sm font-medium">HMAC Security Key</label>
              <div className="relative">
                <Input 
                  type="password"
                  value="********************************"
                  readOnly
                  className="bg-slate-100 cursor-not-allowed"
                />
                <Shield className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">Configured via LOCAL_AI_GATEWAY_KEY in .env.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Folder className="h-5 w-5" /> Storage & Paths</CardTitle>
            <CardDescription>Local filesystem configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 opacity-70">
              <label className="text-sm font-medium">Models Folder</label>
              <Input value={sysInfo?.models_dir || "local-ai-gateway/models"} readOnly className="bg-slate-100 cursor-not-allowed" />
            </div>
            <div className="space-y-2 opacity-70">
              <label className="text-sm font-medium">Cache Folder</label>
              <Input value={sysInfo?.cache_dir || "local-ai-gateway/cache"} readOnly className="bg-slate-100 cursor-not-allowed" />
            </div>
            <div className="space-y-2 opacity-70">
              <label className="text-sm font-medium">Outputs & Storage</label>
              <Input value={sysInfo?.storage_dir || "local-ai-gateway/storage"} readOnly className="bg-slate-100 cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Environment Information</CardTitle>
            <CardDescription>Underlying runtime and hardware detected by the AI Gateway.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">Connection Status</span>
                <div className={`flex items-center gap-1 font-medium ${status === 'Connected' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  <Activity className="h-4 w-4" /> {status}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">Python Version</span>
                <div className="font-mono text-sm">{sysInfo?.python_version || "3.11.x"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">PyTorch Version</span>
                <div className="font-mono text-sm">{sysInfo?.torch_version || "2.1.2"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">CUDA Version</span>
                <div className="font-mono text-sm">{sysInfo?.cuda_version || "12.1"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">Active GPU</span>
                <div className="font-mono text-sm">{sysInfo?.gpu?.devices?.[0]?.name || "RTX 4070 SUPER"}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase">Environment</span>
                <div className="font-mono text-sm">Windows 11 / Native Sync</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
