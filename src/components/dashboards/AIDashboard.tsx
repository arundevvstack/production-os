"use client";

import { Card } from "@/components/ui/card";
import { Cpu, Zap, Image as ImageIcon, Activity } from "lucide-react";

export function AIDashboard({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-800">AI Operations</h2>
        <p className="text-sm font-medium text-slate-500">Monitor render queues, prompt generation, and GPU compute.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-xl rounded-3xl bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu className="h-16 w-16" /></div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">GPU Compute Usage</p>
            <h3 className="text-4xl font-black">74%</h3>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden shadow-inner">
                <div className="bg-primary h-full w-[74%] rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
            </div>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Render Queue</p>
                <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">14 Jobs</h3>
            <p className="text-xs font-bold mt-4 text-slate-500">Processing in background...</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Generations (24h)</p>
                <ImageIcon className="h-4 w-4 text-purple-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">1,240</h3>
            <p className="text-xs font-bold mt-4 text-emerald-500">+12% vs yesterday</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Failed / Retries</p>
                <Zap className="h-4 w-4 text-rose-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">3</h3>
            <p className="text-xs font-bold mt-4 text-slate-500">API connection timeouts</p>
        </Card>
      </div>
    </div>
  );
}
