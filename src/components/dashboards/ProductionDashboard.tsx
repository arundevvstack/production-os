"use client";

import { Card } from "@/components/ui/card";
import { Camera, Calendar, HardHat, Package } from "lucide-react";

export function ProductionDashboard({ companyId }: { companyId: string }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-primary">Physical Production</h2>
        <p className="text-sm font-medium text-muted-foreground">Active shoots, crew attendance, and equipment tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-border relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Shoots Today</p>
                <Camera className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-4xl font-black text-primary">2</h3>
            <p className="text-xs font-bold mt-4 text-emerald-500">All on schedule</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-border">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Crew Deployed</p>
                <HardHat className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-3xl font-black text-primary">18</h3>
            <p className="text-xs font-bold mt-4 text-muted-foreground">Across 3 locations</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-border">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Equipment in Field</p>
                <Package className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-3xl font-black text-primary">42 Items</h3>
            <p className="text-xs font-bold mt-4 text-muted-foreground">Zero maintenance alerts</p>
        </Card>

        <Card className="p-6 border-none shadow-xl rounded-3xl bg-white border border-border">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Upcoming (7 Days)</p>
                <Calendar className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-3xl font-black text-primary">5 Shoots</h3>
            <p className="text-xs font-bold mt-4 text-muted-foreground">Pre-production locked</p>
        </Card>
      </div>
    </div>
  );
}
