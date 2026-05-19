"use client";

import React, { useState, useMemo } from "react";
import { 
  Sparkles, ShieldAlert, TrendingUp, Users, Calendar, DollarSign, 
  Search, Play, AlertTriangle, Send, Bot, Check, Info, ArrowRight,
  Database, RefreshCw, BarChart3, Clock, Lock, CheckCircle2, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/supabase/hooks/use-tenant";

export default function AICommandCenter() {
  const { toast } = useToast();
  const { profile, isSuperAdmin } = useTenant();

  // Role permissions routing
  const isSuper = isSuperAdmin || profile?.role_id === "SUPER_ADMIN";
  const isSales = isSuper || profile?.role_id === "MANAGER" || profile?.role_id === "SALES" || profile?.department === "Sales";
  const isFinance = isSuper || profile?.role_id === "ACCOUNTS" || profile?.role_id === "MANAGER";
  const isProduction = isSuper || profile?.department === "Production" || profile?.role_id === "MANAGER";

  // State Management
  const [assistantQuery, setAssistantQuery] = useState("");
  const [chatLog, setChatLog] = useState<any[]>([
    { id: "c_1", sender: "assistant", text: "AI Systems Online. Ready for campaign forecast planning, talent matchmaking, and pipeline risk diagnostics." }
  ]);
  const [activeSegment, setActiveSegment] = useState<'all' | 'sales' | 'talent' | 'projects' | 'finance' | 'market'>('all');
  const [isUpdatingMemory, setIsUpdatingMemory] = useState(false);

  // Smart Automation approval queue
  const [automations, setAutomations] = useState([
    { id: "a_1", type: "Finance", desc: "Send automated GST payment reminder to Novus Lifesciences (Due: ₹1,20,000)", status: "Pending approval" },
    { id: "a_2", type: "Casting", desc: "Assign Tovino Thomas as Lead Hero for BB App TVC shoot scheduling", status: "Pending approval" },
    { id: "a_3", type: "Sales", desc: "Generate healthcare proposal follow-up email sequence for Aster DM", status: "Pending approval" }
  ]);

  // Executive Dashboard Stats
  const stats = {
    projectedRevenue: "₹24,50,000",
    revenueGrowth: "+18.4%",
    activeRisks: 2,
    utilizationRate: "88%",
    proposalConversion: "84%"
  };

  // AI Floating Insight Cards
  const floatingInsights = [
    { id: "i_1", category: "market", text: "Healthcare AI video advertising is trending up in Kerala (+28% search surge).", urgency: "Medium" },
    { id: "i_2", category: "projects", text: "Project BB App TVC is at risk of 2-day delivery bottleneck due to editor backlog.", urgency: "High" },
    { id: "i_3", category: "sales", text: "Aster DM Healthcare lead has an 82% conversion probability with the CGI Premium package.", urgency: "Low" },
    { id: "i_4", category: "talent", text: "Anchor schedule conflict detected between Kalyan Silks and Lulu Ramp on Friday June 14.", urgency: "High" }
  ];

  // Filtering Floating Insight cards by role category permissions
  const filteredInsights = useMemo(() => {
    return floatingInsights.filter(insight => {
      if (activeSegment !== 'all' && insight.category !== activeSegment) return false;
      
      // Strict Role Gating Checks
      if (insight.category === 'sales' && !isSales) return false;
      if (insight.category === 'finance' && !isFinance) return false;
      if (insight.category === 'projects' && !isProduction) return false;
      
      return true;
    });
  }, [activeSegment, isSales, isFinance, isProduction]);

  // Assistant Query handler
  const handleAssistantQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuery.trim()) return;

    const userMessage = assistantQuery.trim();
    setChatLog(prev => [...prev, { id: `c_${Date.now()}`, sender: "user", text: userMessage }]);
    setAssistantQuery("");

    setTimeout(() => {
      const lower = userMessage.toLowerCase();
      let reply = "I've searched our operational memory. No records matched your keyword search. Try asking about delayed projects, anchors in Kochi, or overdue invoices.";

      if (lower.includes("delay") || lower.includes("project")) {
        reply = "AI Risk Engine report: 1 Delayed Project detected (BB App TVC Commercial). Recommendation: Assign Basil Joseph as secondary assistant director to resolve production pipeline bottleneck.";
      } else if (lower.includes("anchor") || lower.includes("kochi") || lower.includes("malayalam")) {
        reply = "Matchmaking matches found: Tovino Thomas (Actor, Kochi) is available. Malavika Mohanan (Model, Kochi) is available. Aparna B. has a conflicting booking on Friday June 14.";
      } else if (lower.includes("invoice") || lower.includes("overdue") || lower.includes("finance")) {
        reply = "Financial Ledger status: Client Novus Lifesciences has 1 overdue GST Invoice (INV-2026-049, ₹1,20,000, Unpaid). Urgency rating: High. Suggestion logged in automation queue.";
      } else if (lower.includes("proposal") || lower.includes("healthcare") || lower.includes("generate")) {
        reply = "AI Proposal Drafter initialized: Created 'CGI Premium Ad Package for Healthcare' draft. Included GST matrices and regional Kerala placement metrics. Viewable in Proposals draft board.";
      }

      setChatLog(prev => [...prev, { id: `c_${Date.now() + 1}`, sender: "assistant", text: reply }]);
      toast({
        title: "AI Command Center Sync",
        description: "Assistant response compiled successfully."
      });
    }, 1200);
  };

  // Safe Human approval trigger
  const handleApproveAutomation = (id: string, desc: string) => {
    setAutomations(prev => prev.map(a => {
      if (a.id === id) return { ...a, status: "Approved & Executed" };
      return a;
    }));
    toast({
      title: "Action Approved",
      description: `Executed: "${desc}" successfully finalized. Notifications dispatched.`
    });
  };

  const handleClearMemory = () => {
    setIsUpdatingMemory(true);
    setTimeout(() => {
      setIsUpdatingMemory(false);
      toast({
        title: "Operational Memory Hydrated",
        description: "Successfully re-indexed past projects, proposal conversion patterns, and casting match ratings."
      });
    }, 1500);
  };

  return (
    <div className="-m-4 md:-m-8 lg:-m-12 min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-12 relative overflow-hidden">
      
      {/* Hero Header Banner (Clean border-slate-200 with no outer margins) */}
      <header className="relative py-6 border-b border-slate-200 bg-white shadow-sm">
        <div className="w-full mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge className="bg-red-50 text-red-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1 animate-pulse text-red-500" /> AI Command Active
            </Badge>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 uppercase text-slate-800">
              AI Command Center
            </h1>
            <p className="text-xs text-slate-500 font-bold">
              Real-time campaign forecast, talent scheduling, and active client updates.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              disabled={isUpdatingMemory}
              onClick={handleClearMemory}
              variant="outline" 
              className="rounded-xl h-10 border-slate-200 bg-white hover:bg-slate-50 text-xs font-black gap-2 text-slate-700 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 text-red-500 ${isUpdatingMemory ? 'animate-spin' : ''}`} /> Re-index Memory
            </Button>
          </div>
        </div>
      </header>

      {/* Command Workspace grid (w-full removes arbitrary desktop layout margins) */}
      <main className="w-full mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Business Summary & Data Registry */}
        <section className="xl:col-span-1 space-y-6">
          
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-4">
                <BarChart3 className="h-4.5 w-4.5 text-red-500" /> Business Summary
              </h3>

              <div className="grid grid-cols-1 gap-4">
                
                {/* Stat blocks in Light Theme */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block leading-none">Projected Monthly Revenue</span>
                  <div className="flex justify-between items-baseline mt-1.5">
                    <strong className="text-lg font-black text-slate-800">{stats.projectedRevenue}</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">{stats.revenueGrowth}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block leading-none">Roster Utilization</span>
                  <div className="flex justify-between items-baseline mt-1.5">
                    <strong className="text-lg font-black text-slate-800">{stats.utilizationRate}</strong>
                    <span className="text-[10px] text-red-600 font-bold">Target: 85%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block leading-none">Active Pipeline Risks</span>
                  <div className="flex justify-between items-center mt-1.5">
                    <strong className={`text-lg font-black ${stats.activeRisks > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {stats.activeRisks} Flagged
                    </strong>
                    {stats.activeRisks > 0 && (
                      <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[8px]">Action Required</Badge>
                    )}
                  </div>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* System Database Registry */}
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-red-500" /> System Database
              </h3>
              
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-bold">Indexed Projects</span>
                  <strong className="text-slate-800 font-black">28 Campaigns</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-bold">Casting Match Accuracy</span>
                  <strong className="text-emerald-600 font-black">94.8%</strong>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-bold">Pricing Success Models</span>
                  <strong className="text-slate-800 font-black">12 Verified</strong>
                </div>
              </div>
            </CardContent>
          </Card>

        </section>

        {/* Center: Command Hub Controls, Assistant Chat & Automation */}
        <section className="xl:col-span-3 space-y-6">
          
          {/* Segment selection filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Unified HUD" },
              { id: "sales", label: "Sales AI" },
              { id: "talent", label: "Talent AI" },
              { id: "projects", label: "Projects AI" },
              { id: "finance", label: "Finance AI" },
              { id: "market", label: "Market Research" }
            ].map(seg => (
              <Button 
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`rounded-xl h-8 px-4 text-[10px] font-bold tracking-wider uppercase border transition-all ${
                  activeSegment === seg.id 
                    ? "bg-red-600 border-red-500 text-white shadow-sm" 
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                {seg.label}
              </Button>
            ))}
          </div>

          {/* Realtime Floating Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map(insight => (
              <Card key={insight.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-red-500/20 transition-all duration-300">
                <CardContent className="p-4 flex gap-3 items-start">
                  
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    insight.urgency === 'High' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {insight.urgency === 'High' ? (
                      <AlertTriangle className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-red-50 text-red-600 border-none text-[8px] font-black uppercase tracking-wider py-0 px-2">{insight.category}</Badge>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Urgency: {insight.urgency}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">{insight.text}</p>
                  </div>

                </CardContent>
              </Card>
            ))}

            {filteredInsights.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-500 bg-white border border-dashed border-slate-200 rounded-xl text-xs font-semibold">
                No active insight warnings matched your segment criteria or security role clearance.
              </div>
            )}
          </div>

          {/* Interactive Global AI Assistant Chat Box */}
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                <Bot className="h-4.5 w-4.5 text-red-500 animate-pulse" /> Global Operational Assistant
              </h3>

              {/* Chat Log */}
              <div className="h-48 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                {chatLog.map(chat => (
                  <div key={chat.id} className={`flex gap-2.5 items-start ${
                    chat.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    {chat.sender === 'assistant' && (
                      <div className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl leading-relaxed max-w-[80%] ${
                      chat.sender === 'user' 
                        ? 'bg-red-600 text-white rounded-tr-none shadow-sm' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm'
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleAssistantQuery} className="flex gap-2">
                <Input 
                  placeholder="e.g. Find Malayalam anchors in Kochi..." 
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  className="bg-white border-slate-200 h-10 text-xs rounded-xl flex-grow focus:border-red-500 text-slate-800 font-bold"
                />
                <Button type="submit" className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Query suggestions */}
              <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-wider">
                <span>Try asking:</span>
                <button type="button" onClick={() => setAssistantQuery("Show delayed projects")} className="hover:text-red-500 transition">“Show delayed projects”</button>
                <span>•</span>
                <button type="button" onClick={() => setAssistantQuery("Find Malayalam anchors")} className="hover:text-red-500 transition">“Find Malayalam anchors”</button>
                <span>•</span>
                <button type="button" onClick={() => setAssistantQuery("Which clients have overdue invoices?")} className="hover:text-red-500 transition">“Overdue invoices”</button>
              </div>

            </CardContent>
          </Card>

          {/* AI Automation Approval Queue */}
          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4.5 w-4.5 text-red-500" /> AI Task Automation Clearance Queue
                </h3>
                <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[8px]">Human Verification Active</Badge>
              </div>

              <div className="space-y-4">
                {automations.map(auto => (
                  <div key={auto.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-red-50 text-red-600 border-none text-[8px] font-black uppercase py-0 px-2">{auto.type}</Badge>
                        <span className={`text-[9px] font-bold ${
                          auto.status.includes("Pending") ? "text-amber-600" : "text-emerald-600"
                        }`}>{auto.status}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-bold mt-2">{auto.desc}</p>
                    </div>

                    {auto.status.includes("Pending") && (
                      <Button 
                        onClick={() => handleApproveAutomation(auto.id, auto.desc)}
                        className="rounded-xl h-8 px-4 text-[10px] font-black bg-red-600 hover:bg-red-700 text-white shrink-0 shadow-sm transition"
                      >
                        Approve & Execute
                      </Button>
                    )}
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Secure access alert footer */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 text-[10px] text-slate-500 leading-relaxed font-bold">
            <Lock className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span>
              <strong>Secure Access Active</strong>: Under role permissions validation settings, your active employee profile controls the visible department widgets. Financial recommendations require direct Accounts clearance before execution.
            </span>
          </div>

        </section>

      </main>

    </div>
  );
}
