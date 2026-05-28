"use client";

import { Card } from "@/components/ui/card";
import { Camera, Calendar, HardHat, Package } from "lucide-react";

export function ProductionDashboard({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-800">Physical Production</h2>
        <p className="text-sm font-medium text-slate-500">Active shoots, crew attendance, and equipment tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Active Shoots Today</p>
                <Camera className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-4xl font-black text-slate-800">2</h3>
            <p className="text-xs font-bold mt-4 text-emerald-500">All on schedule</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Crew Deployed</p>
                <HardHat className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">18</h3>
            <p className="text-xs font-bold mt-4 text-slate-500">Across 3 locations</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Equipment in Field</p>
                <Package className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">42 Items</h3>
            <p className="text-xs font-bold mt-4 text-slate-500">Zero maintenance alerts</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Upcoming (7 Days)</p>
                <Calendar className="h-4 w-4 text-purple-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">5 Shoots</h3>
            <p className="text-xs font-bold mt-4 text-slate-500">Pre-production locked</p>
        </Card>
      </div>
    </div>
  );
}
