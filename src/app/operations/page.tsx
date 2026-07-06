"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Server, Database, Bot, Command, Zap } from "lucide-react";

export default function EnterpriseOperationsCenter() {
  const [state, setState] = useState<any>(null);
  const [isLive, setIsLive] = useState(true);
  
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);

  useEffect(() => {
    if (!isLive) return;
    fetchState();
    const interval = setInterval(fetchState, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, [isLive]);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/v1/operations/state");
      if (res.ok) setState(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopilotCommand = () => {
    if (!copilotQuery.trim()) return;
    
    // Simulate Natural Language to Orchestrator commands
    const q = copilotQuery.toLowerCase();
    let response = "";
    
    if (q.includes("retry") && q.includes("failed")) {
       response = "Executing RecoveryEngine. Failed jobs have been re-queued to the Scheduler.";
    } else if (q.includes("show") && q.includes("blocked")) {
       response = "Filtering command center for BLOCKED states.";
    } else if (q.includes("cheapest provider")) {
       response = "Based on ProviderBalancer metrics, Flux is currently the cheapest active provider at $0.03 per asset.";
    } else {
       response = "Copilot executed command via Orchestrator API (simulated).";
    }
    
    setCopilotResponse(response);
    setCopilotQuery("");
  };

  if (!state) return <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Initializing Autonomous Orchestrator...</div>;

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Server className="h-8 w-8 text-indigo-400" /> Enterprise Command Center
          </h1>
          <p className="text-slate-400">Phase J: Autonomous Production Orchestrator (Live)</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
              {isLive ? <><Activity className="h-3 w-3 mr-1 animate-pulse" /> LIVE SYNC</> : "PAUSED"}
           </Badge>
           <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)} className="border-slate-800 text-slate-300 hover:bg-slate-800">
             {isLive ? "Pause" : "Resume"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Main Orchestration Matrix */}
        <div className="lg:col-span-3 flex flex-col space-y-6 overflow-hidden">
          
          <div className="grid grid-cols-3 gap-6 flex-shrink-0">
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm">Production Velocity</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{state.analytics.historical.production_velocity} <span className="text-sm font-normal text-slate-500">jobs/hour</span></div>
                </CardContent>
             </Card>
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm">Failure Rate</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">{state.analytics.historical.failure_rate_pct}%</div>
                </CardContent>
             </Card>
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-slate-400 text-sm">Global Burn Rate</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${state.global_cost}</div>
                </CardContent>
             </Card>
          </div>

          <Card className="flex-1 flex flex-col bg-slate-900 border-slate-800 overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Autonomous State Machine Matrix</CardTitle>
              <CardDescription className="text-slate-500">Live orchestrator states across all active enterprise projects.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 border-t border-slate-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-400">Project</th>
                    <th className="px-4 py-3 font-medium text-center text-slate-400">State</th>
                    <th className="px-4 py-3 font-medium text-center text-slate-400">Gen Count</th>
                    <th className="px-4 py-3 font-medium text-right text-slate-400">Budget Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {state.projects.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={
                           p.state === 'IDLE' ? 'border-slate-500 text-slate-500' :
                           p.state === 'FAILED' ? 'border-red-500 text-red-500' :
                           p.state === 'BLOCKED' ? 'border-amber-500 text-amber-500' :
                           'border-emerald-500 text-emerald-500'
                        }>{p.state}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">{p.usage.total_generations}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                           ${p.cost.current_spend} / ${p.cost.projected_remaining}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {state.projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-600">No active orchestrator states.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>

        {/* Executive Copilot */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex-1 flex flex-col bg-slate-900 border-indigo-900/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <CardHeader className="bg-indigo-950/30 border-b border-indigo-900/30 pb-4">
              <CardTitle className="text-indigo-400 flex items-center gap-2">
                <Bot className="h-5 w-5" /> Executive Copilot
              </CardTitle>
              <CardDescription className="text-slate-400">Issue direct NLP commands to the Orchestrator.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-end space-y-4">
              
              {copilotResponse && (
                <div className="bg-indigo-950/50 border border-indigo-500/30 p-3 rounded-lg text-sm text-indigo-200 flex items-start gap-3">
                   <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                   <div>{copilotResponse}</div>
                </div>
              )}

              <div className="flex gap-2 relative">
                <Command className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                <Input 
                  className="bg-slate-950 border-slate-800 pl-9 focus-visible:ring-indigo-500"
                  placeholder="e.g. 'Retry failed jobs...'"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCopilotCommand()}
                />
                <Button onClick={handleCopilotCommand} className="bg-indigo-600 hover:bg-indigo-700">Run</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2"><Database className="h-4 w-4" /> Audit Trail Buffer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500 space-y-2">
                 <div className="flex justify-between border-b border-slate-800 pb-1"><span>Last Event:</span> <span className="text-slate-300">GenerationStarted</span></div>
                 <div className="flex justify-between border-b border-slate-800 pb-1"><span>Target:</span> <span className="text-slate-300">Project d858...</span></div>
                 <div className="flex justify-between"><span>Hash:</span> <span className="text-slate-300 font-mono">0x9a8f...</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
