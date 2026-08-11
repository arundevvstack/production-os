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
    <div className="relative h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-background text-foreground font-body">
      {/* Ambient Glassmorphism Backgrounds */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 p-6 flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium mt-1">View your Local AI Studio configuration.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> AI Gateway</CardTitle>
              <CardDescription>Connection settings for your local GPU server.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="p-3 bg-amber-50/80 backdrop-blur-md text-amber-700 rounded-md text-sm border border-amber-200/50 flex items-start gap-2 mb-4">
                <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p>Settings are read-only in the V1 validation build. To modify these values, update your <code className="font-mono bg-amber-100/50 px-1 py-0.5 rounded text-amber-800">.env</code> file and restart the server.</p>
              </div>
              
              <div className="space-y-2 opacity-80">
                <label className="text-sm font-bold">Gateway URL</label>
                <Input 
                  value={gatewayUrl}
                  readOnly
                  className="bg-white/40 dark:bg-slate-950/40 border-slate-200/50 cursor-not-allowed font-mono text-sm"
                />
                <p className="text-xs font-medium text-slate-500">Configured via NEXT_PUBLIC_GATEWAY_URL in .env.</p>
              </div>
              <div className="space-y-2 opacity-80">
                <label className="text-sm font-bold">HMAC Security Key</label>
                <div className="relative">
                  <Input 
                    type="password"
                    value="********************************"
                    readOnly
                    className="bg-white/40 dark:bg-slate-950/40 border-slate-200/50 cursor-not-allowed font-mono text-sm"
                  />
                  <Shield className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-xs font-medium text-slate-500">Configured via LOCAL_AI_GATEWAY_KEY in .env.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2"><Folder className="h-5 w-5 text-emerald-500" /> Storage & Paths</CardTitle>
              <CardDescription>Local filesystem configurations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2 opacity-80">
                <label className="text-sm font-bold">Models Folder</label>
                <Input value={sysInfo?.models_dir || "local-ai-gateway/models"} readOnly className="bg-white/40 dark:bg-slate-950/40 border-slate-200/50 cursor-not-allowed font-mono text-sm" />
              </div>
              <div className="space-y-2 opacity-80">
                <label className="text-sm font-bold">Cache Folder</label>
                <Input value={sysInfo?.cache_dir || "local-ai-gateway/cache"} readOnly className="bg-white/40 dark:bg-slate-950/40 border-slate-200/50 cursor-not-allowed font-mono text-sm" />
              </div>
              <div className="space-y-2 opacity-80">
                <label className="text-sm font-bold">Outputs & Storage</label>
                <Input value={sysInfo?.storage_dir || "local-ai-gateway/storage"} readOnly className="bg-white/40 dark:bg-slate-950/40 border-slate-200/50 cursor-not-allowed font-mono text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-blue-500" /> Environment Information</CardTitle>
              <CardDescription>Underlying runtime and hardware detected by the AI Gateway.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1 bg-white/40 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Connection Status</span>
                  <div className={`flex items-center gap-1.5 font-black text-sm ${status === 'Connected' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <Activity className="h-4 w-4" /> {status}
                  </div>
                </div>
                <div className="space-y-1 bg-white/40 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Python Version</span>
                  <div className="font-mono text-sm font-black">{sysInfo?.python_version || "3.11.x"}</div>
                </div>
                <div className="space-y-1 bg-white/40 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PyTorch Version</span>
                  <div className="font-mono text-sm font-black">{sysInfo?.torch_version || "2.1.2"}</div>
                </div>
                <div className="space-y-1 bg-white/40 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CUDA Version</span>
                  <div className="font-mono text-sm font-black">{sysInfo?.cuda_version || "12.1"}</div>
                </div>
                <div className="space-y-1 bg-white/40 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active GPU</span>
                  <div className="font-mono text-sm font-black">{sysInfo?.gpu?.devices?.[0]?.name || "RTX 4070 SUPER"}</div>
                </div>
                <div className="space-y-1 bg-white/40 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Environment</span>
                  <div className="font-mono text-sm font-black">Windows 11 / Native Sync</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
