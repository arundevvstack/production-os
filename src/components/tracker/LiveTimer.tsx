"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Square, Clock, Activity, AlertCircle, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Objective {
  id: string;
  title: string;
  project_id: string;
  project?: { project_name: string };
}

export function LiveTimer() {
  const { user, profile } = useTenant();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active timer & assigned objectives
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      // 1. Check for active timer
      const { data: active } = await supabase
        .from('TimeEntry')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();
        
      if (active) {
        setActiveEntry(active);
        const diff = Math.floor((new Date().getTime() - new Date(active.start_time).getTime()) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      } else {
        setActiveEntry(null);
        setElapsedSeconds(0);
      }

      // 2. Load open objectives
      const { data: objs } = await supabase
        .from('Objective')
        .select('id, title, project_id, Project(project_name)')
        .neq('status', 'done');

      if (objs) {
        // Safe mapping in case Project join returns array or object
        const mapped = objs.map(o => ({
          ...o,
          project: Array.isArray(o.Project) ? o.Project[0] : o.Project
        }));
        setObjectives(mapped);
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const startTime = new Date().toISOString();
    const { data, error } = await supabase
      .from('TimeEntry')
      .insert({
        user_id: user.id,
        objective_id: selectedObjectiveId || null,
        start_time: startTime,
        is_billable: true
      })
      .select()
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsLoading(false);
      return;
    }

    setActiveEntry(data);
    setElapsedSeconds(0);
    setIsExpanded(false);
    setIsLoading(false);
    toast({ title: "Timer Started", description: "Your time is now being logged." });
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    setIsLoading(true);

    const endTime = new Date().toISOString();
    const { error } = await supabase
      .from('TimeEntry')
      .update({
        end_time: endTime,
        duration_sec: elapsedSeconds
      })
      .eq('id', activeEntry.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsLoading(false);
      return;
    }

    setActiveEntry(null);
    setElapsedSeconds(0);
    setIsLoading(false);
    toast({ title: "Timer Stopped", description: `Logged ${formatTime(elapsedSeconds)}.` });
  };

  if (!user || profile?.role_id === 'CLIENT') return null; // Clients don't track time

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end group animate-in slide-in-from-bottom-8 duration-500">
      
      {/* Expanded Interface */}
      {isExpanded && !activeEntry && (
        <Card className="mb-4 w-80 p-4 border-none shadow-2xl rounded-2xl bg-white/90 backdrop-blur-xl border border-white">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Clock className="h-4 w-4 text-primary" />
            <h4 className="font-black uppercase tracking-widest text-[10px]">Start Time Entry</h4>
          </div>
          
          <div className="space-y-3">
            <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
              <SelectTrigger className="w-full h-10 bg-muted border-none font-bold text-xs rounded-xl">
                <SelectValue placeholder="Select an Objective (Optional)" />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-white shadow-2xl rounded-xl z-[100] border border-border">
                <SelectItem value="none" className="text-xs font-black text-muted-foreground">General (No Objective)</SelectItem>
                {objectives.map(obj => (
                  <SelectItem key={obj.id} value={obj.id} className="text-xs font-bold py-2">
                    <span className="text-muted-foreground font-black mr-2">[{obj.project?.project_name || 'General'}]</span>
                    {obj.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={startTimer}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary text-white font-black rounded-xl h-10 shadow-lg shadow-slate-900/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Clock"}
            </Button>
          </div>
        </Card>
      )}

      {/* Floating Widget Toggle */}
      <button 
        onClick={() => !activeEntry && setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-4 h-14 rounded-full px-6 shadow-2xl transition-all duration-500",
          activeEntry 
            ? "bg-accent hover:bg-accent shadow-accent/30 text-white w-auto" 
            : "bg-primary hover:bg-primary shadow-slate-900/30 text-white cursor-pointer"
        )}
      >
        {activeEntry ? (
          <>
            <div className="flex items-center gap-2 animate-pulse">
              <Activity className="h-4 w-4" />
              <span className="font-black font-mono text-lg tracking-widest">{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/20 mx-1" />
            <div 
              onClick={(e) => { e.stopPropagation(); stopTimer(); }}
              className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-3 w-3 fill-white" />}
            </div>
          </>
        ) : (
          <>
            <Clock className="h-5 w-5" />
            <span className="font-black uppercase tracking-widest text-[10px]">Track Time</span>
            {isExpanded ? <ChevronDown className="h-4 w-4 text-white/50" /> : <ChevronUp className="h-4 w-4 text-white/50" />}
          </>
        )}
      </button>
    </div>
  );
}
