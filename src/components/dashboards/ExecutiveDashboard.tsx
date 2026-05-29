"use client";

import { Card } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, Clock } from "lucide-react";

export function ExecutiveDashboard({ companyId }: { companyId: string }) {
  // In a real implementation, you would fetch analytical data securely via a Server Component or SWR hook here.
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-foreground">Executive Overview</h2>
        <p className="text-sm font-medium text-muted-foreground">Real-time enterprise analytics and health metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-xl rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingUp className="h-16 w-16" /></div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Avg Profit Margin</p>
            <h3 className="text-4xl font-black">42.5%</h3>
            <p className="text-xs font-bold mt-4 opacity-90">+3% from last month</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white dark:bg-slate-900 border border-border">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resource Utilization</p>
                <Users className="h-4 w-4 text-foreground" />
            </div>
            <h3 className="text-3xl font-black text-foreground">87%</h3>
            <div className="w-full bg-muted h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full w-[87%] rounded-full" />
            </div>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white dark:bg-slate-900 border border-border">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Production Efficiency</p>
                <Clock className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-3xl font-black text-foreground">92%</h3>
            <p className="text-xs font-bold mt-4 text-muted-foreground">Tasks completed on time</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><AlertTriangle className="h-16 w-16" /></div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Delayed Projects</p>
            <h3 className="text-4xl font-black">3</h3>
            <p className="text-xs font-bold mt-4 opacity-90">Requires immediate attention</p>
        </Card>
      </div>


    </div>
  );
}
