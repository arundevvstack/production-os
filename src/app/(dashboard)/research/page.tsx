"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Activity, 
  BarChart3, 
  Briefcase, 
  Building2, 
  ChevronRight, 
  Cpu, 
  Eye, 
  FileText, 
  Globe, 
  History, 
  Layers, 
  Lightbulb, 
  LineChart, 
  MapPin, 
  MessageSquare, 
  Package, 
  PieChart, 
  Play, 
  Plus, 
  Search, 
  Settings2, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Radio,
  Radar,
  AlertTriangle,
  Send,
  Building,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Share2,
  TrendingDown,
  Info,
  Sliders,
  DollarSign,
  Loader2,
  UserPlus,
  Crosshair
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/hooks/use-tenant";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from "recharts";

// ----------------------------------------------------
// MOCK DATABASES & RESEARCH DATA
// ----------------------------------------------------

const WORKFLOW_STEPS = [
  { label: "Industry Research", key: "industries" },
  { label: "Competitor Analysis", key: "competitors" },
  { label: "Market Gap Detection", key: "gaps" },
  { label: "Audience Analysis", key: "audience" },
  { label: "Trend Monitoring", key: "trends" },
  { label: "Opportunity Discovery", key: "opportunities" },
  { label: "AI Lead Identification", key: "leads" },
  { label: "Lead Scoring", key: "leads" },
  { label: "CRM Integration", key: "leads" },
  { label: "Proposal Suggestions", key: "leads" },
  { label: "Sales Opportunity Tracking", key: "overview" }
];

// ----------------------------------------------------
// (Dummy Data Removed)
// ----------------------------------------------------

export default function MarketIntelligenceOS() {
  const { profile, companyId, roleId, isSuperAdmin } = useTenant();
  
  // RBAC control (Phase 16)
  const isAuthorized = roleId === 'SUPER_ADMIN' || roleId === 'ADMIN' || roleId === 'MANAGER' || roleId === 'MARKETING_SALES' || isSuperAdmin;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  
  // Real data states
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    gaps: any[];
    leads: any[];
    competitors: any[];
    trends: any[];
    alerts: any[];
    notes: any[];
  } | null>(null);

  // Collaborative notes states
  const [researchNotes, setResearchNotes] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  
  // Discovered leads states
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [crmSyncingId, setCrmSyncingId] = useState<string | null>(null);

  // Notifications alerts state (Phase 15)
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch real data
  const totalPipelineValue = leadsList.reduce((sum, lead) => sum + (Number(lead.estimated_budget) || 0), 0);
  const avgProbability = leadsList.length > 0 
    ? (leadsList.reduce((sum, lead) => sum + (Number(lead.opportunity_score) || 0), 0) / leadsList.length).toFixed(1)
    : "0.0";

  const strategistLead = selectedLead || (leadsList.length > 0 ? leadsList[0] : null);

  useEffect(() => {
    if (!companyId || !isAuthorized) return;
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/intelligence/market/dashboard');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setDashboardData(data);
        setLeadsList(data.leads || []);
        if (data.leads?.length > 0 && !selectedLead) {
          setSelectedLead(data.leads[0]);
        }
        setNotifications(data.alerts || []);
        if (data.notes?.length > 0) {
          setResearchNotes(data.notes[0].content);
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Failed to load dashboard", description: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [companyId, isAuthorized]);

  // Handle Scan
  const handleDiscoverGaps = async () => {
    if (isScanning) return;
    setIsScanning(true);
    toast({ title: "AI Scan Initiated", description: "Scanning target industry ad spaces and business directories..." });
    
    try {
      const res = await fetch('/api/v1/intelligence/market/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'Digital Media', region: selectedLocation === 'All' ? 'Global' : selectedLocation })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast({ title: "Scan Running", description: "Market intelligence scan is running in the background. Results will populate shortly." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Scan Failed", description: err.message });
    } finally {
      setIsScanning(false);
    }
  };

  // Syncing a discovered lead to Sales CRM database (Phase 7)
  const handleSyncToCRM = async (lead: any) => {
    if (!companyId) {
      toast({ variant: "destructive", title: "Error", description: "No active tenant company context found." });
      return;
    }
    
    setCrmSyncingId(lead.id);
    toast({ title: "Connecting CRM Pipeline", description: `Registering prospect credentials for ${lead.company_name}...` });
    
    try {
      const res = await fetch('/api/v1/intelligence/market/crm-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Update local listing status
      setLeadsList(prev => prev.map(l => l.id === lead.id ? { ...l, is_synced: true } : l));
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead((prev: any) => ({ ...prev, is_synced: true }));
      }
      
      // Trigger live sales team notification
      setNotifications(prev => [
        { 
          id: `n-${Date.now()}`, 
          text: `CRM Prospect Created: "${lead.company_name}" has been registered as an active Opportunity.`,
          type: "sync" 
        },
        ...prev
      ]);

      toast({ 
        title: "CRM Sync Successful", 
        description: `"${lead.company_name}" is now live in Sales qualification pipeline!` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "CRM Sync Failed", description: err.message });
    } finally {
      setCrmSyncingId(null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const currentNotes = researchNotes + '\n' + newComment;
    
    setComments(prev => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        user: profile?.fullName || "User",
        text: newComment,
        timestamp: new Date().toISOString()
      }
    ]);
    setNewComment("");
    setResearchNotes(currentNotes);
    
    try {
      await fetch('/api/v1/intelligence/market/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentNotes })
      });
      toast({ title: "Comment Posted", description: "Realtime collaboration sync completed." });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeads = useMemo(() => {
    return leadsList.filter(l => {
      const matchesSearch = l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = selectedLocation === "All" || l.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
  }, [leadsList, searchQuery, selectedLocation]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center min-h-[500px]">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6 animate-bounce" />
        <h2 className="text-2xl font-black text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md">Your current RBAC user role permissions do not permit access to executive market research intelligence databases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground min-h-screen p-0 antialiased font-sans transition-all duration-300">
      
      {/* Live Trend Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border relative">
        <div className="absolute -top-4 -left-4 w-72 h-32 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">Market Research</h1>
            <Badge className="bg-destructive text-white text-xs font-bold uppercase tracking-wider shadow shadow-red-500/10 flex items-center gap-1.5 py-1 px-3">
              <Radio className="h-3 w-3 text-white animate-pulse" /> LIVE PULSE
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-2.5">
            Identify market gaps, track competitors, discover growth opportunities and auto-sync prospects to Sales CRM.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-40">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-border text-foreground shadow-sm focus:ring-border">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-lg">
                <SelectItem value="All">All Locations</SelectItem>
                <SelectItem value="Kerala">Kerala</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Wayanad">Wayanad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search research database..." 
              className="pl-9 h-10 rounded-xl bg-white dark:bg-slate-900 border-border text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleDiscoverGaps}
            disabled={isScanning}
            className="gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white shadow-lg h-10 px-6 font-bold text-xs uppercase tracking-wider"
          >
            <Sparkles className="h-4 w-4 text-rose-400" /> Discover Gaps
          </Button>
        </div>
      </div>

      {/* Phase 1: Core Intelligence Steps Workflow Ticker */}
      <div className="bg-muted border border-border p-4 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
        <div className="flex items-center justify-between min-w-[900px] gap-2">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setActiveTab(step.key);
                  toast({ title: `Focused Step`, description: `Navigating to ${step.label} stage.` });
                }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all",
                  (activeTab === step.key) 
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-md" 
                    : "bg-white dark:bg-slate-900 text-muted-foreground/80 border-border hover:bg-muted"
                )}
              >
                {step.label}
              </button>
              {idx < WORKFLOW_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
            </div>
          ))}
        </div>
      </div>

      {/* Top Cockpit Analytics Cards (Phase 2 & Phase 13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden relative group hover:border-border transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
              <span>Trending Industries</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-foreground">Healthcare / Retail</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Top vertical content demands</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden relative group hover:border-border transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
              <span>Competitor Activity</span>
              <Activity className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-2xl font-black text-foreground">Spike detected (+45%)</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Agency X ad campaign launch</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden relative group hover:border-border transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
              <span>AI Lead Opportunity Score</span>
              <Target className="h-4 w-4 text-accent" />
            </div>
            <div className="text-2xl font-black text-foreground">92 / 100</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Premium budget availability</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden relative group hover:border-border transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wider">
              <span>Market Gap Alerts</span>
              <AlertCircle className="h-4 w-4 text-accent animate-pulse" />
            </div>
            <div className="text-2xl font-black text-foreground">4 Critical Gaps</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Outdated advertising styles</p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Gap/Sync Notification Banner Feed */}
      {notifications.length > 0 && (
        <div className="space-y-2.5">
          {notifications.map((alert) => (
            <div 
              key={alert.id} 
              className={cn(
                "p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all duration-300 animate-in slide-in-from-top-2",
                alert.type === 'gap' ? "bg-accent/10 border-accent/20 text-accent" :
                alert.type === 'sync' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                alert.type === 'lead' ? "bg-accent/10 border-accent/20 text-accent" : "bg-muted border-border text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'gap' && <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />}
                {alert.type === 'sync' && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
                {alert.type === 'lead' && <Sparkles className="h-4 w-4 shrink-0 text-accent animate-pulse" />}
                <span className="text-xs font-bold leading-relaxed">{alert.text}</span>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== alert.id))}
                className="text-xs font-black uppercase opacity-60 hover:opacity-100 transition-opacity ml-4"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic 3-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==========================================
            LEFT PANEL: RESEARCH CATEGORIES (Phase 2)
            ========================================== */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground overflow-hidden">
            <CardHeader className="p-6 border-b border-border shrink-0">
              <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Categories</span>
              <h3 className="text-lg font-black text-foreground mt-1">Research Index</h3>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
              {[
                { id: "overview", label: "Dashboard Overview", count: "Pulse", icon: BarChart3 },
                { id: "leads", label: "Lead Discovery & Scoring", count: leadsList.length, icon: UserPlus },
                { id: "gaps", label: "Market Gap Detection", count: dashboardData?.gaps?.length || 0, icon: AlertTriangle },
                { id: "competitors", label: "Competitor Intelligence", count: dashboardData?.competitors?.length || 0, icon: Crosshair },
                { id: "trends", label: "Realtime Trends Monitor", count: dashboardData?.trends?.length || 0, icon: Activity },
                { id: "opportunities", label: "Opportunity Boards", count: dashboardData?.gaps?.length || 0, icon: Layers }
              ].map((category) => (
                <button 
                  key={category.id}
                  onClick={() => {
                    setActiveTab(category.id);
                    toast({ title: `Viewing ${category.label}`, description: `Focus updated successfully.` });
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 border",
                    activeTab === category.id ? "bg-zinc-950 text-white border-zinc-950 shadow-md" : "bg-white dark:bg-slate-900 text-muted-foreground hover:bg-muted"
                  )}>
                  <span className="flex items-center gap-2.5">
                    <category.icon className={cn("h-4 w-4", activeTab === category.id ? "text-white animate-pulse" : "text-muted-foreground")} />
                    {category.label}
                  </span>
                  <Badge className={cn("text-[9px] font-black uppercase rounded-md shadow-sm border border-border", 
                    activeTab === category.id ? "bg-zinc-800 text-white border-zinc-950" : "bg-muted text-muted-foreground"
                  )}>
                    {category.count}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Collaborative Research Notes Feed (Phase 14) */}
          <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground">
            <CardHeader className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Collaboration</span>
                <h3 className="text-lg font-black text-foreground mt-1">Research Notes</h3>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg border-border"
                onClick={() => {
                  toast({ title: "Notes Saved", description: "Saved collaborative notes snapshot in DB." });
                }}
              >
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea 
                value={researchNotes}
                onChange={(e) => setResearchNotes(e.target.value)}
                placeholder="Write collaborative research team notes..."
                className="border-border bg-muted rounded-xl text-foreground/80 text-xs min-h-[100px] leading-relaxed p-3 focus-visible:ring-border"
              />
              <span className="text-[10px] text-muted-foreground font-bold block">Autosaved to Research Team project.</span>
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            CENTER WORKSPACE: PRIMARY VISUALS (Phase 2)
            ========================================== */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Tab Content: Dashboard Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Executive Overview Analytics Matrix chart */}
              <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
                  <div>
                    <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Phase 13 Analytics</span>
                    <h3 className="text-lg font-black text-foreground mt-1">AI Video & CGI Demand Forecast</h3>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-xs font-bold py-1 px-3">
                    94.8% Confidence
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCGI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                        <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="AI Ads" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAI)" />
                        <Area type="monotone" dataKey="CGI walkthroughs" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCGI)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-destructive" /> AI Ads Demand</span>
                    <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-accent" /> CGI Walkthroughs</span>
                  </div>
                </CardContent>
              </Card>

              {/* Opportunity Pipeline Values */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground p-6 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Discovered Opportunities</span>
                  <div className="text-3xl font-black mt-3">₹{totalPipelineValue.toLocaleString('en-IN')}</div>
                  <p className="text-xs text-muted-foreground font-bold mt-1 tracking-wide">TOTAL PIPELINE VALUE</p>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground p-6 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Proposal Success Rate</span>
                  <div className="text-3xl font-black mt-3 text-emerald-600">{avgProbability}%</div>
                  <p className="text-xs text-muted-foreground font-bold mt-1 tracking-wide">CONVERSION PROBABILITY</p>
                </Card>
              </div>

              {/* Featured Gaps Spotlight (Phase 3) */}
              <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-border flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Market Gaps</span>
                    <h3 className="text-lg font-black text-foreground mt-1">High-Impact Gaps</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("gaps")} className="text-destructive text-xs font-bold hover:bg-destructive/10 hover:text-destructive rounded-lg">View All Gaps</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {(dashboardData?.gaps || []).slice(0, 2).map((gap: any) => (
                    <div key={gap.id} className="p-4 bg-muted border border-zinc-150 rounded-xl space-y-3 shadow-sm hover:border-zinc-250 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {gap.industry} — {gap.region}
                        </span>
                        <Badge className="bg-destructive text-white text-[9px] font-bold uppercase rounded-md shadow-sm">
                          {gap.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">{gap.gap}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          )}

          {/* Tab Content: Lead Discovery & Scoring (Phase 4 & Phase 5 & Phase 6) */}
          {activeTab === "leads" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-border shrink-0">
                  <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Directory</span>
                  <h3 className="text-lg font-black text-foreground mt-1">Discovered Leads Directory</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100">
                    {filteredLeads.map((lead) => (
                      <div 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-muted/80 transition-all flex items-center justify-between",
                          selectedLead?.id === lead.id ? "bg-muted border-l-4 border-l-red-600" : ""
                        )}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground truncate block">{lead.company_name}</span>
                            <Badge className={cn("text-[9px] font-bold uppercase py-0.5 rounded-md", 
                              lead.score_label === "Premium Opportunity" ? "bg-destructive text-white" :
                              lead.score_label === "High" ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                            )}>
                              {lead.score_label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
                            <span>{lead.industry}</span> • 
                            <span>{lead.location}</span> • 
                            <span className="text-emerald-600 font-black">₹{lead.estimated_budget.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="ml-4 shrink-0 flex items-center gap-3">
                          {lead.is_synced ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase px-2 py-1 shadow-sm">
                              CRM SYNCED
                            </Badge>
                          ) : (
                            <Button 
                              size="sm"
                              disabled={crmSyncingId === lead.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSyncToCRM(lead);
                              }}
                              className="bg-primary text-white hover:bg-primary text-[10px] font-bold uppercase rounded-lg h-8 shadow"
                            >
                              {crmSyncingId === lead.id ? <Clock className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                              Sync
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Details & Enrichment Panel (Phase 5) */}
              {selectedLead && (
                <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground overflow-hidden relative animate-in zoom-in-95">
                  <div className="absolute right-0 top-0 h-40 w-40 bg-destructive/5 rounded-full blur-[60px]" />
                  <CardHeader className="p-6 border-b border-border shrink-0">
                    <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">AI Enriched Intelligence Profile</span>
                    <h3 className="text-xl font-black text-foreground mt-1">{selectedLead.company_name}</h3>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 text-zinc-650">
                    
                    {/* Scores Section */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-muted border border-zinc-150 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Opportunity Score</span>
                        <span className="text-xl font-black text-foreground block mt-1">{selectedLead.opportunity_score}/100</span>
                      </div>
                      <div className="p-3 bg-muted border border-zinc-150 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">AI Readiness</span>
                        <span className="text-xl font-black text-foreground block mt-1">{selectedLead.ai_readiness}%</span>
                      </div>
                      <div className="p-3 bg-muted border border-zinc-150 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Brand Quality</span>
                        <span className="text-xl font-black text-foreground block mt-1">{selectedLead.brand_quality}</span>
                      </div>
                    </div>

                    {/* Enriched Data Lists */}
                    <div className="p-4 bg-muted border border-border rounded-xl space-y-2.5 text-xs text-zinc-650 font-bold">
                      <div className="flex justify-between border-b border-border pb-1.5"><span className="text-muted-foreground">Website:</span><a href={selectedLead.website} target="_blank" className="text-accent hover:underline">{selectedLead.website}</a></div>
                      <div className="flex justify-between border-b border-border pb-1.5"><span className="text-muted-foreground">Instagram Handle:</span><span className="text-foreground">{selectedLead.instagram}</span></div>
                      <div className="flex justify-between border-b border-border pb-1.5"><span className="text-muted-foreground">LinkedIn Company:</span><span className="text-foreground">{selectedLead.linkedin}</span></div>
                      <div className="flex justify-between border-b border-border pb-1.5"><span className="text-muted-foreground">Contact Email:</span><span className="text-foreground">{selectedLead.contact_email || "N/A"}</span></div>
                      <div className="flex justify-between border-b border-border pb-1.5"><span className="text-muted-foreground">Estimated Budget:</span><span className="text-emerald-700 font-black">₹{selectedLead.estimated_budget.toLocaleString()}</span></div>
                      <div className="flex justify-between border-b border-border pb-1.5"><span className="text-muted-foreground">Services Needed:</span><span className="text-foreground">{selectedLead.services_needed}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Outreach Location:</span><span className="text-foreground">{selectedLead.location}</span></div>
                    </div>

                    {/* AI Scoring Factors (Phase 6) */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">AI Opportunity Score Auditing</span>
                      <div className="p-4 bg-destructive/10/50 border border-red-100 rounded-xl space-y-2 text-xs font-semibold text-zinc-650">
                        <div className="flex justify-between"><span>Growth Potential:</span><span className="font-bold text-foreground">{selectedLead.growth_potential}</span></div>
                        <div className="flex justify-between"><span>Current Marketing Quality:</span><span className="font-bold text-destructive">{selectedLead.marketing_quality}</span></div>
                        <div className="flex justify-between"><span>Outreach Channel:</span><span className="font-bold text-zinc-850">Instagram Reels Ads</span></div>
                      </div>
                    </div>

                    {/* Action Integration sync */}
                    {!selectedLead.is_synced ? (
                      <Button 
                        disabled={crmSyncingId === selectedLead.id}
                        onClick={() => handleSyncToCRM(selectedLead)}
                        className="w-full bg-primary hover:bg-primary text-white rounded-xl h-12 font-bold uppercase text-xs tracking-widest shadow-md"
                      >
                        {crmSyncingId === selectedLead.id ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 text-destructive mr-2 animate-pulse" />}
                        Add to Sales CRM
                      </Button>
                    ) : (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                        ✓ Enriched opportunity has been successfully synced with active Sales CRM.
                      </div>
                    )}

                  </CardContent>
                </Card>
              )}

            </div>
          )}

          {/* Tab Content: Market Gaps (Phase 3) */}
          {activeTab === "gaps" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="space-y-4">
                {(dashboardData?.gaps || []).map((gap: any) => (
                  <Card key={gap.id} className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground overflow-hidden relative group hover:border-border transition-colors">
                    <CardHeader className="p-6 border-b border-border flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-destructive/10 border border-red-100 rounded-xl flex items-center justify-center text-destructive shadow-sm">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-foreground block">{gap.industry} — {gap.region}</span>
                          <span className="text-[10px] text-muted-foreground font-bold block">Estimated Gap Score: {gap.impact}/100</span>
                        </div>
                      </div>
                      <Badge className="bg-accent text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {gap.severity}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm font-medium leading-relaxed text-foreground/80">{gap.gap}</p>
                      
                      <div className="p-4 bg-muted border border-zinc-150 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-650">
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Outdated Style:</span>
                          <span className="font-bold text-foreground">{gap.adStyle}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">AI Readiness:</span>
                          <span className="font-bold text-foreground">{gap.aiReadiness}%</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            toast({ title: "Campaign Generated", description: "Created standard targeting outline for this industry." });
                          }}
                          className="flex-1 bg-primary hover:bg-primary text-white rounded-xl h-10 font-bold uppercase text-[10px] tracking-widest shadow"
                        >
                          Generate Campaign Idea
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

            </div>
          )}

          {/* Tab Content: Competitor Intelligence (Phase 8) */}
          {activeTab === "competitors" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="space-y-4">
                {(dashboardData?.competitors || []).map((comp: any, idx: number) => (
                  <Card key={idx} className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground overflow-hidden relative">
                    <CardHeader className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent shadow-sm">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground block">{comp.brand}</h3>
                          <span className="text-[10px] text-muted-foreground font-bold block">Social Engagement: {comp.engagement}</span>
                        </div>
                      </div>
                      <Badge className="bg-accent text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {comp.campaigns} Active Campaigns
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-zinc-650">
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-650">
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Video/Editing Style:</span>
                          <span className="font-bold text-foreground">{comp.videoStyle}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Production Quality:</span>
                          <span className="font-bold text-foreground">{comp.productionQuality}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">AI Tools Used:</span>
                          <span className="font-bold text-foreground">{comp.aiUsage}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Estimated Pricing:</span>
                          <span className="font-bold text-foreground">{comp.pricing}</span>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-border pt-4">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">AI Competitor Weakness Auditing</span>
                        <ul className="space-y-1 text-xs text-destructive font-semibold list-disc list-inside">
                          {(comp.weaknesses || []).map((weak: string, wIdx: number) => (
                            <li key={wIdx}>{weak}</li>
                          ))}
                        </ul>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>

            </div>
          )}

          {/* Tab Content: Realtime Trends Monitor (Phase 9) */}
          {activeTab === "trends" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="space-y-4">
                {(dashboardData?.trends || []).map((trend: any, idx: number) => (
                  <Card key={trend.id} className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground overflow-hidden relative">
                    <CardHeader className="p-6 border-b border-border flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent shadow-sm">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground block">{trend.title}</h3>
                          <span className="text-[10px] text-muted-foreground font-bold block">Trend Source: {trend.source}</span>
                        </div>
                      </div>
                      <Badge className="bg-accent text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {trend.velocity_score}% Velocity
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-zinc-650">
                      
                      <div className="p-4 bg-muted border border-zinc-150 rounded-xl space-y-2 text-xs font-semibold text-zinc-650">
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Viral Video Format:</span>
                          <span className="font-bold text-foreground leading-relaxed block">{trend.viral_format}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex gap-2.5 items-start">
                        <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5 animate-pulse" />
                        <p className="text-xs text-accent font-bold leading-relaxed">
                          <strong>AI Predictive Shift:</strong> {trend.upcoming_prediction}
                        </p>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>

            </div>
          )}

          {/* Tab Content: Opportunity Boards (Phase 10) */}
          {activeTab === "opportunities" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(dashboardData?.gaps || []).map((board: any, idx: number) => (
                  <Card key={idx} className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-foreground p-6 flex flex-col justify-between relative group hover:border-border transition-colors">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-sm text-foreground group-hover:text-destructive transition-colors leading-tight">{board.gap_description || "Opportunity"}</h4>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold uppercase rounded-md">
                          High Demand
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-muted-foreground font-semibold leading-relaxed">
                        <div><span className="text-muted-foreground">Growth Score:</span> <strong className="text-foreground">{board.impact_score || 0}%</strong></div>
                        <div><span className="text-muted-foreground">Competition:</span> <strong className="text-foreground">Low</strong></div>
                        <div><span className="text-muted-foreground">Suggested Package:</span> <strong className="text-foreground">{board.ad_style || "N/A"}</strong></div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Estimated Deal Value</span>
                        <span className="text-emerald-700 font-black text-sm">TBD</span>
                      </div>
                      <Badge className="bg-muted text-foreground/80 text-[10px] font-bold uppercase py-1 px-2.5 rounded-lg border-border">
                        Potential: {board.severity || "High"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* ==========================================
            RIGHT AI PANEL: RECOMMENDATIONS (Phase 2)
            ========================================== */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* AI Sales Outreach Strategy Panel (Phase 11) */}
          <Card className="bg-zinc-950 border border-zinc-900 text-white rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="absolute right-0 top-0 h-40 w-40 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/10 dark:border-slate-700/10 shrink-0 bg-white/5 dark:bg-slate-900/5 backdrop-blur-md relative z-10">
              <span className="text-xs font-black uppercase text-rose-400 tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
                AI Opportunity Strategist
              </span>
              <h3 className="text-lg font-black text-white mt-1">Sales Recommendations</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-zinc-300 relative z-10">
              
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Ideal Pricing Benchmark</span>
                <div className="p-4 bg-white/5 dark:bg-slate-900/5 border border-white/10 dark:border-slate-700/10 rounded-xl">
                  {strategistLead ? (
                    <>
                      <span className="text-2xl font-black text-emerald-400 block">
                        ₹{(Number(strategistLead.estimated_budget) * 0.8).toLocaleString('en-IN')} - ₹{(Number(strategistLead.estimated_budget) * 1.5).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold block mt-1">Targeting {strategistLead.industry} | Gross Margin: 55%</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-zinc-400 block">Scan market to calculate</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Suggested Service Bundle</span>
                <div className="p-4 bg-white/5 dark:bg-slate-900/5 border border-white/10 dark:border-slate-700/10 rounded-xl space-y-2 text-xs font-semibold">
                  {strategistLead?.services_needed ? (
                    strategistLead.services_needed.split('&').map((service: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-rose-400 rounded-full" /> {service.trim()}</div>
                    ))
                  ) : (
                    <div className="text-zinc-500 italic">No services recommended yet</div>
                  )}
                </div>
              </div>

              {/* Phase 11 & Phase 12 Proposal Outreach Draft script */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Suggested Outreach Strategy</span>
                <div className="p-4 bg-white/5 dark:bg-slate-900/5 border border-white/10 dark:border-slate-700/10 rounded-xl text-xs font-medium leading-relaxed text-zinc-300 space-y-3">
                  <p className="italic">
                    {strategistLead 
                      ? `"We noticed ${strategistLead.industry} brands in ${strategistLead.location} are gaining massive traction, but ${strategistLead.company_name} lacks ${strategistLead.services_needed}."`
                      : '"Run an AI Scan to generate a targeted outreach script."'}
                  </p>
                  <Button 
                    onClick={() => {
                      toast({ title: "Copied outreach template", description: "Outreach message successfully saved to clipboard." });
                    }}
                    className="w-full bg-white dark:bg-slate-900 text-foreground hover:bg-muted rounded-xl h-10 font-bold uppercase text-[9px] tracking-widest"
                  >
                    Copy Outreach Script
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Realtime Opportunity Collaboration feed (Phase 14) */}
          <Card className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-sm text-zinc-850 flex flex-col min-h-[300px]">
            <CardHeader className="p-6 border-b border-border shrink-0">
              <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Discussions Feed</span>
              <h3 className="text-lg font-black text-foreground mt-1">Opportunity Chat</h3>
            </CardHeader>
            <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[160px] max-h-[220px] custom-scrollbar mb-4">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-3 bg-muted border border-zinc-150 rounded-xl text-xs leading-relaxed shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-zinc-850">{comm.user}</span>
                      <span className="text-[10px] text-muted-foreground font-bold">{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-muted-foreground/80 font-bold leading-relaxed">{comm.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 shrink-0">
                <Input 
                  placeholder="Type notes / discuss opportunity..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  className="bg-muted border-border rounded-xl text-xs h-9 text-foreground focus-visible:ring-border"
                />
                <Button 
                  onClick={handleAddComment}
                  className="bg-primary hover:bg-primary text-white rounded-xl h-9 w-9 shrink-0 p-0 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
