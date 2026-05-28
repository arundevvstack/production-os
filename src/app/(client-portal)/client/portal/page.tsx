"use client";

import { Card } from "@/components/ui/card";
import { PlayCircle, FileText, CheckCircle } from "lucide-react";

export default function ClientPortalPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome back, Client</h1>
        <p className="text-slate-500 font-medium">Here is the latest status on your productions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100 flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">Active Projects</h3>
             <PlayCircle className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">2</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100 flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">Pending Approvals</h3>
             <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">1</p>
          <p className="text-xs text-emerald-600 font-bold">VFX Review Ready</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100 flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">Unpaid Invoices</h3>
             <FileText className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-4xl font-black text-slate-800">0</p>
        </Card>
      </div>

      <section className="space-y-4">
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Recent Deliverables</h3>
        <Card className="p-8 border-dashed border-2 border-slate-200 shadow-none rounded-3xl bg-transparent flex items-center justify-center min-h-[200px]">
          <p className="text-slate-400 font-medium">No deliverables require your attention right now.</p>
        </Card>
      </section>
    </div>
  );
}
