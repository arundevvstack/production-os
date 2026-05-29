"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Objective {
  id: string;
  title: string;
  phase: string;
  start_date?: string;
  due_date?: string;
  status: string;
  department?: string;
  priority?: string;
}

interface TimelineEngineProps {
  objectives: Objective[];
  startDate?: string;
}

export function TimelineEngine({ objectives, startDate }: TimelineEngineProps) {
  const [zoomLevel, setZoomLevel] = useState<'days' | 'weeks'>('days');

  // Process data to find global start and end
  const { minDate, maxDate, sortedObjectives } = useMemo(() => {
    if (!objectives || objectives.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), sortedObjectives: [] };
    }

    const validObjs = objectives.filter(o => o.start_date && o.due_date);
    if (validObjs.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), sortedObjectives: [] };
    }

    let min = new Date(validObjs[0].start_date!);
    let max = new Date(validObjs[0].due_date!);

    validObjs.forEach(o => {
      const s = new Date(o.start_date!);
      const e = new Date(o.due_date!);
      if (s < min) min = s;
      if (e > max) max = e;
    });

    if (startDate) {
        const pStart = new Date(startDate);
        if (pStart < min) min = pStart;
    }

    // Add padding
    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 5);

    return { 
      minDate: min, 
      maxDate: max, 
      sortedObjectives: validObjs.sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()) 
    };
  }, [objectives, startDate]);

  const totalDays = useMemo(() => {
    const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [minDate, maxDate]);

  const days = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(minDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (!objectives || objectives.length === 0 || sortedObjectives.length === 0) {
    return (
      <Card className="border-2 border-dashed p-12 text-center bg-white dark:bg-slate-900 rounded-[10px]">
        <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <h3 className="font-bold text-muted-foreground uppercase tracking-widest text-sm">No Timeline Data</h3>
        <p className="text-xs text-muted-foreground mt-2">Add objectives with start and due dates to generate the timeline.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[10px] border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-foreground" />
          <h3 className="font-black text-foreground tracking-tight uppercase">Dynamic Timeline Engine</h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-muted font-bold uppercase tracking-wider text-[10px]">
            {sortedObjectives.length} Dependencies
          </Badge>
          <Badge className="bg-emerald-50 text-emerald-600 font-bold uppercase tracking-wider text-[10px] border-none">
            Live Sync Active
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden p-0 relative">
        {/* Timeline Grid Container */}
        <div className="overflow-x-auto custom-scrollbar bg-muted relative pb-10">
          
          <div className="min-w-max">
            {/* Header / Dates */}
            <div className="flex border-b border-border sticky top-0 bg-muted z-10 shadow-sm" style={{ paddingLeft: '250px' }}>
              {days.map((d, i) => {
                const isToday = new Date().toDateString() === d.toDateString();
                return (
                  <div key={i} className={cn(
                    "flex-none w-14 border-r border-border/50 flex flex-col items-center justify-center py-2 relative",
                    isToday ? "bg-primary/5 text-foreground" : "text-muted-foreground"
                  )}>
                    <span className="text-[9px] font-black uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className={cn("text-xs font-bold", isToday && "bg-primary text-white h-5 w-5 rounded-full flex items-center justify-center mt-0.5")}>
                      {d.getDate()}
                    </span>
                    {isToday && <div className="absolute top-full left-1/2 w-0.5 h-[1000px] bg-primary/20 -translate-x-1/2 z-0" />}
                  </div>
                );
              })}
            </div>

            {/* Tracks */}
            <div className="relative pt-4 pb-8 space-y-3">
              {sortedObjectives.map((obj, i) => {
                const sDate = new Date(obj.start_date!);
                const eDate = new Date(obj.due_date!);
                
                const startDiff = Math.ceil((sDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                const durDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                // 14px per day width (w-14 = 3.5rem = 56px)
                const leftPos = startDiff * 56;
                const width = durDays * 56;

                const getPhaseColor = (p: string) => {
                  switch(p) {
                    case 'pre-prod': return 'bg-accent shadow-accent/20';
                    case 'production': return 'bg-accent shadow-accent/20';
                    case 'post-prod': return 'bg-emerald-500 shadow-emerald-500/20';
                    default: return 'bg-primary shadow-slate-800/20';
                  }
                };

                return (
                  <div key={obj.id} className="flex relative items-center group h-10 hover:bg-muted/50 transition-colors">
                    {/* Track Label */}
                    <div className="sticky left-0 w-[250px] bg-muted z-20 flex items-center px-4 border-r border-border/50 h-full group-hover:bg-muted">
                      <div className="truncate pr-4 flex flex-col justify-center w-full">
                        <span className="text-xs font-bold text-foreground/80 truncate">{obj.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-wider">
                            {obj.phase.replace('-', ' ')}
                          </span>
                          {obj.status === 'done' && <Zap className="h-2.5 w-2.5 text-emerald-500" />}
                        </div>
                      </div>
                    </div>

                    {/* Gantt Bar */}
                    <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${250 + leftPos}px`, width: `${width}px` }}>
                      <div className={cn(
                        "h-full w-full rounded-md shadow-md flex items-center px-3 overflow-hidden transition-all duration-300 pointer-events-auto cursor-pointer",
                        getPhaseColor(obj.phase),
                        obj.status === 'done' && "opacity-50 saturate-50"
                      )}>
                        <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                          {durDays}d
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
