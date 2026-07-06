"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, BrainCircuit, Activity, Clock, DollarSign, AlertTriangle, MessageSquare, ShieldAlert, Sparkles, Send } from "lucide-react";

export default function AIProjectDirectorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [director, setDirector] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Knowledge Base State
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{role: string, text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    fetchDirectorData();
  }, [projectId]);

  const fetchDirectorData = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/director`);
      if (res.ok) setDirector(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const query = chatInput;
    setChatInput("");
    setChatLog(prev => [...prev, { role: "user", text: query }]);
    setIsChatting(true);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/knowledge-base?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setChatLog(prev => [...prev, { role: "ai", text: data.answer }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatting(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Initializing AI Director...</div>;
  if (!director) return <div className="p-12 text-center text-red-500">Failed to load AI Director</div>;

  const { health, timeline, continuity_risks, budget, recommendations } = director;

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-indigo-500" /> AI Project Director
          </h1>
          <p className="text-slate-500">Enterprise Intelligence & Production Orchestration Layer</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/assets`)}>Asset Manager</Button>
           <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/editing`)}>Timeline</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Main Dashboard (Left 3 columns) */}
        <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Health Score */}
            <Card className="border-t-4 border-t-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 uppercase flex justify-between">
                  Overall Health <Activity className="h-4 w-4 text-emerald-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{health.overall_score}/100</div>
                <div className="mt-2 text-xs flex gap-2">
                  <Badge variant="outline">Script: {health.metrics.script}</Badge>
                  <Badge variant="outline">Review: {health.metrics.reviews}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Risk */}
            <Card className={`border-t-4 ${timeline.status === 'on_track' ? 'border-t-blue-500' : 'border-t-amber-500'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 uppercase flex justify-between">
                  Timeline Risk <Clock className={`h-4 w-4 ${timeline.status === 'on_track' ? 'text-blue-500' : 'text-amber-500'}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold capitalize">{timeline.status.replace('_', ' ')}</div>
                <p className="text-xs text-slate-500 mt-1">{timeline.bottleneck || "No bottlenecks detected"}</p>
              </CardContent>
            </Card>

            {/* Budget Risk */}
            <Card className={`border-t-4 ${budget.risk_level === 'low' ? 'border-t-emerald-500' : budget.risk_level === 'medium' ? 'border-t-amber-500' : 'border-t-red-500'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 uppercase flex justify-between">
                  Budget Tracking <DollarSign className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">${budget.total_spent} {budget.currency}</div>
                <p className="text-xs text-slate-500 mt-1 capitalize text-muted-foreground">Risk Level: {budget.risk_level}</p>
              </CardContent>
            </Card>

          </div>

          {/* Recommendations Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" /> AI Production Advisor
              </CardTitle>
              <CardDescription>Actionable insights derived from Health, Continuity, and Timeline analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((rec: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg flex items-start gap-3 border ${
                  rec.type === 'warning' ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10' :
                  rec.type === 'action' ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10' :
                  'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10'
                }`}>
                  {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />}
                  {rec.type === 'action' && <Activity className="h-5 w-5 text-blue-500 mt-0.5" />}
                  {rec.type === 'optimization' && <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />}
                  
                  <div>
                    <h4 className="font-semibold capitalize text-sm">{rec.type}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{rec.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Continuity Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" /> Continuity Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {continuity_risks.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded text-sm text-slate-500 text-center">No continuity issues detected across approved assets.</div>
              ) : (
                <div className="space-y-3">
                  {continuity_risks.map((risk: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded">
                       <div>
                         <Badge variant="destructive" className="mb-1 text-[10px] uppercase">{risk.severity}</Badge>
                         <p className="text-sm font-medium">{risk.category}: {risk.description}</p>
                       </div>
                       <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/assets/compare?id=${risk.asset_ids[0]}`)}>Compare</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar: Knowledge Base Chat */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden h-full">
          <CardHeader className="bg-indigo-50 dark:bg-indigo-950/30 border-b pb-4">
            <CardTitle className="text-indigo-700 dark:text-indigo-400 flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" /> Knowledge Base
            </CardTitle>
            <CardDescription>Ask questions about the live production state.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatLog.length === 0 && (
                <div className="text-center text-sm text-slate-400 mt-10 space-y-2">
                  <p>Try asking:</p>
                  <p className="italic">"Which scenes need assets?"</p>
                  <p className="italic">"Why is this project blocked?"</p>
                  <p className="italic">"What assets are approved?"</p>
                </div>
              )}
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800"><Loader2 className="h-4 w-4 animate-spin text-slate-500" /></div>
                </div>
              )}
            </div>
            <div className="p-3 border-t bg-slate-50 dark:bg-slate-900 flex gap-2">
              <Input 
                placeholder="Ask the Director..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// Quick placeholder for missing CheckCircle icon used above
function CheckCircle(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
