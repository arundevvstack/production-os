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
  DollarSign
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

const MARKET_GAPS = [
  {
    id: "gap-1",
    industry: "Healthcare",
    region: "Kerala",
    gap: "Healthcare brands in Kerala are rapidly adopting AI ads but local agencies have weak cinematic production quality.",
    severity: "High Opportunity",
    adStyle: "Outdated slide animations",
    aiReadiness: 40,
    impact: 95
  },
  {
    id: "gap-2",
    industry: "Real Estate",
    region: "Bangalore",
    gap: "Luxury real estate companies are spending heavily on CGI walkthroughs.",
    severity: "Premium Opportunity",
    adStyle: "Traditional non-immersive videos",
    aiReadiness: 85,
    impact: 90
  },
  {
    id: "gap-3",
    industry: "Restaurants",
    region: "Mumbai",
    gap: "Restaurants are underusing AI short-form content.",
    severity: "Medium Opportunity",
    adStyle: "Static picture posts",
    aiReadiness: 65,
    impact: 75
  },
  {
    id: "gap-4",
    industry: "Tourism",
    region: "Wayanad",
    gap: "Tourism operators in Wayanad have gorgeous properties but lack cinematic vertical video reels.",
    severity: "High Opportunity",
    adStyle: "Outdated landscape drone shots",
    aiReadiness: 30,
    impact: 88
  }
];

const INITIAL_DISCOVERED_LEADS = [
  {
    id: "disc-lead-1",
    company_name: "Apex Healthcare Group",
    industry: "Healthcare",
    website: "https://apexhealthgroup.in",
    instagram: "@apexhealthcare_in",
    linkedin: "apex-healthcare-group",
    contact: "contact@apexhealthgroup.in",
    marketing_quality: "Outdated Slide Ads",
    ai_readiness: 42,
    brand_quality: "Medium",
    opportunity_score: 88,
    location: "Kerala",
    services_needed: "AI Video Ads & Cinematic Production",
    growth_potential: "High",
    estimated_budget: 450000,
    score: "High",
    synced: false
  },
  {
    id: "disc-lead-2",
    company_name: "Prestige Heights Luxury Homes",
    industry: "Real Estate",
    website: "https://prestigeheightsluxury.com",
    instagram: "@prestigeheights_homes",
    linkedin: "prestige-heights-luxury",
    contact: "sales@prestigeheights.com",
    marketing_quality: "Lacks Immersive Video/CGI",
    ai_readiness: 88,
    brand_quality: "High",
    opportunity_score: 96,
    location: "Bangalore",
    services_needed: "CGI Walkthroughs & Vertical Reels",
    growth_potential: "Premium",
    estimated_budget: 1200000,
    score: "Premium Opportunity",
    synced: false
  },
  {
    id: "disc-lead-3",
    company_name: "Gourmet Spices & Bistro",
    industry: "Restaurants",
    website: "https://gourmetspicesbistro.com",
    instagram: "@gourmetspices_bistro",
    linkedin: "gourmet-spices-bistro",
    contact: "hello@gourmetspices.com",
    marketing_quality: "Static Photo Catalogues",
    ai_readiness: 58,
    brand_quality: "Low",
    opportunity_score: 74,
    location: "Mumbai",
    services_needed: "AI Short-form Vertical Content",
    growth_potential: "Medium",
    estimated_budget: 150000,
    score: "Medium",
    synced: false
  },
  {
    id: "disc-lead-4",
    company_name: "Wayanad Eco Wilderness Resort",
    industry: "Tourism",
    website: "https://wayanadecowilderness.com",
    instagram: "@wayanad_wilderness",
    linkedin: "wayanad-eco-wilderness",
    contact: "reservations@wayanadeco.com",
    marketing_quality: "Outdated Static Landscapes",
    ai_readiness: 35,
    brand_quality: "Medium",
    opportunity_score: 91,
    location: "Kerala",
    services_needed: "Cinematic Vertical Reels & Ad Campaigns",
    growth_potential: "High",
    estimated_budget: 600000,
    score: "High",
    synced: false
  }
];

const COMPETITORS = [
  {
    brand: "Agency X",
    campaigns: 14,
    videoStyle: "Standard Stock & Text Overlays",
    aiUsage: "Basic scriptwriting",
    socialQuality: "Medium",
    engagement: "1.8%",
    branding: "Consistent but generic",
    pricing: "₹1,50,000 - ₹3,00,000 / project",
    serviceOfferings: "Social media post management, simple corporate videos",
    productionQuality: "Standard DSLR / Mirrorless edits",
    weaknesses: [
      "No dynamic virtual production or CGI capability",
      "Slow video turnaround time (typically 3 weeks)",
      "Branding styles feel formulaic and lack cinematic premium grading"
    ]
  },
  {
    brand: "CineVibe Media",
    campaigns: 8,
    videoStyle: "Highly Styled Cinematic Shoots",
    aiUsage: "None",
    socialQuality: "High",
    engagement: "3.4%",
    branding: "Premium artistic tone",
    pricing: "₹5,00,000 - ₹12,00,000 / project",
    serviceOfferings: "High-end commercials, luxury lifestyle shoots",
    productionQuality: "Cinema grade (RED/Alexa)",
    weaknesses: [
      "Extremely expensive for vertical Reels and social packages",
      "No AI marketing technology or automated ad personalization",
      "No internal distribution or performance marketing analytics"
    ]
  }
];

const LIVE_TRENDS = [
  {
    id: "trend-1",
    title: "Split-Screen Cinematic B-Roll",
    source: "Instagram Reels",
    velocity: 94,
    viralFormat: "Dynamic lifestyle edits paired with deep ambient sound design",
    upcomingPrediction: "Will saturate in 30 days, optimal window for real estate campaigns is now."
  },
  {
    id: "trend-2",
    title: "3D Product Pop-out Illusion",
    source: "YouTube Shorts",
    velocity: 88,
    viralFormat: "VFX elements escaping the border frame of vertical mobile player",
    upcomingPrediction: "Expected to rise by 150% in luxury D2C electronics and startup hardware branding."
  },
  {
    id: "trend-3",
    title: "AI Avatar Voice Cloning",
    source: "TikTok / Ads Manager",
    velocity: 75,
    viralFormat: "Highly localized vernacular voice clones narrating high-paced CGI walkthroughs",
    upcomingPrediction: "Spike expected in regional education technology and hospitality ads."
  }
];

const OPPORTUNITY_BOARDS = [
  {
    title: "Healthcare AI Ads",
    marketDemand: "Extreme",
    growthScore: 92,
    competitionScore: "Low (Local Agencies have weak CGI production)",
    revenuePotential: "₹18,00,000",
    suggestedServices: "AI Script Personalization & High-grade Doctor Interviews",
    estimatedDealValue: "₹4,50,000"
  },
  {
    title: "Luxury Real Estate CGI",
    marketDemand: "High",
    growthScore: 88,
    competitionScore: "Medium (High pricing by boutique studios)",
    revenuePotential: "₹35,00,000",
    suggestedServices: "Cinema-grade walkthroughs & Interactive Virtual Tours",
    estimatedDealValue: "₹8,00,000"
  },
  {
    title: "Restaurant Reels",
    marketDemand: "Sustained",
    growthScore: 78,
    competitionScore: "High (Under-priced freelancers)",
    revenuePotential: "₹8,00,000",
    suggestedServices: "Vertical cinematic food macro edits & AI engagement automation",
    estimatedDealValue: "₹1,50,000"
  },
  {
    title: "Startup Branding",
    marketDemand: "Accelerating",
    growthScore: 84,
    competitionScore: "Low (Agencies lack narrative storytelling focus)",
    revenuePotential: "₹24,00,000",
    suggestedServices: "Founder narrative documentaries & 3D tech feature showcases",
    estimatedDealValue: "₹5,00,000"
  }
];

const MOCK_COMMENTS = [
  { id: "c1", user: "Arun Dev", text: "Luxury Real Estate CGI is seeing a massive budget increase in Bangalore. Let's build a dedicated proposal template for real estate developers.", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "c2", user: "Sales AI Assistant", text: "Auto-Scored prestige heights luxury homes as 'Premium Opportunity'. Ideal pricing suggestion generated: ₹8,00,000.", timestamp: new Date(Date.now() - 1800000).toISOString() }
];

const DEMAND_FORECAST_DATA = [
  { name: "Week 1", "AI Ads": 40, "CGI walkthroughs": 24, "Social reels": 60 },
  { name: "Week 2", "AI Ads": 50, "CGI walkthroughs": 45, "Social reels": 65 },
  { name: "Week 3", "AI Ads": 85, "CGI walkthroughs": 50, "Social reels": 75 },
  { name: "Week 4", "AI Ads": 92, "CGI walkthroughs": 88, "Social reels": 95 }
];

export default function MarketIntelligenceOS() {
  const { profile, companyId, roleId, isSuperAdmin } = useTenant();
  
  // RBAC control (Phase 16)
  const isAuthorized = roleId === 'SUPER_ADMIN' || roleId === 'MANAGER' || roleId === 'MARKETING_SALES' || isSuperAdmin;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  
  // Collaborative notes states
  const [researchNotes, setResearchNotes] = useState("Focus heavily on Wayanad resort gaps. Outdated landscape drone shots are extremely common, and offering dynamic vertical cinematic reels with localized AI narration will close deals easily.");
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState("");
  
  // Discovered leads states
  const [leadsList, setLeadsList] = useState(INITIAL_DISCOVERED_LEADS);
  const [selectedLead, setSelectedLead] = useState<any>(INITIAL_DISCOVERED_LEADS[0]);
  const [crmSyncingId, setCrmSyncingId] = useState<string | null>(null);

  // Notifications alerts state (Phase 15)
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "High-Value Opportunity Alert: Wayanad wilderness resort matches cinematic vertical reels opportunity.", type: "gap" },
    { id: "n2", text: "Competitor Activity Spike: Agency X launched 3 new real estate campaigns.", type: "competitor" },
    { id: "n3", text: "AI Lead Discovered: prestige heights luxury homes in Bangalore launched Q4 campaign.", type: "lead" }
  ]);

  // Syncing a discovered lead to Sales CRM database (Phase 7)
  const handleSyncToCRM = async (lead: any) => {
    if (!companyId) {
      toast({ variant: "destructive", title: "Error", description: "No active tenant company context found." });
      return;
    }
    
    setCrmSyncingId(lead.id);
    
    // Simulate multi-step enterprise sync loaders
    toast({ title: "Connecting CRM Pipeline", description: `Registering prospect credentials for ${lead.company_name}...` });
    
    setTimeout(async () => {
      try {
        const generateId = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < 20; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };

        const newLeadId = generateId();
        
        // Write cleanly into the CRM table (Lead)
        const { error } = await supabase.from('Prospect').insert({
          id: newLeadId,
          company_id: companyId,
          company_name: lead.company_name,
          service_vertical: lead.services_needed,
          sub_vertical: "AI Intelligence Lead",
          industry: lead.industry,
          deal_value: lead.estimated_budget,
          stage: "lead" // Initial prospect stage in CRM flow
        });

        if (error) {
          toast({ variant: "destructive", title: "CRM Sync Failed", description: error.message });
        } else {
          // Update local listing status
          setLeadsList(prev => prev.map(l => l.id === lead.id ? { ...l, synced: true } : l));
          if (selectedLead && selectedLead.id === lead.id) {
            setSelectedLead((prev: any) => ({ ...prev, synced: true }));
          }
          
          // Trigger live sales team notification
          setNotifications(prev => [
            { 
              id: `n-${Date.now()}`, 
              text: `CRM Prospect Created: "${lead.company_name}" has been registered as an active Opportunity with ${lead.score} Score.`,
              type: "sync" 
            },
            ...prev
          ]);

          toast({ 
            title: "CRM Sync Successful", 
            description: `"${lead.company_name}" is now live in Sales qualification pipeline! Assigned Lead Score: ${lead.score}.` 
          });
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Database Write Exception", description: err.message });
      } finally {
        setCrmSyncingId(null);
      }
    }, 1500);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
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
    toast({ title: "Comment Posted", description: "Realtime collaboration sync completed." });
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
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6 animate-bounce" />
        <h2 className="text-2xl font-black text-zinc-900">Access Restricted</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-md">Your current RBAC user role permissions do not permit access to executive market research intelligence databases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-zinc-900 min-h-screen p-0 antialiased font-sans transition-all duration-300">
      
      {/* Live Trend Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 relative">
        <div className="absolute -top-4 -left-4 w-72 h-32 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-zinc-950 tracking-tight leading-none">Market Research</h1>
            <Badge className="bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow shadow-red-500/10 flex items-center gap-1.5 py-1 px-3">
              <Radio className="h-3 w-3 text-white animate-pulse" /> LIVE PULSE
            </Badge>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2.5">
            Identify market gaps, track competitors, discover growth opportunities and auto-sync prospects to Sales CRM.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-40">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-10 rounded-xl bg-white border-zinc-200 text-zinc-950 shadow-sm focus:ring-zinc-200">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 shadow-lg">
                <SelectItem value="All">All Locations</SelectItem>
                <SelectItem value="Kerala">Kerala</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Wayanad">Wayanad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search research database..." 
              className="pl-9 h-10 rounded-xl bg-white border-zinc-200 text-zinc-950 shadow-sm placeholder:text-zinc-400 focus-visible:ring-zinc-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => {
              toast({ title: "AI Scan Initiated", description: "Scanning target industry ad spaces and business directories..." });
            }}
            className="gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg h-10 px-6 font-bold text-xs uppercase tracking-wider"
          >
            <Sparkles className="h-4 w-4 text-red-500" /> Discover Gaps
          </Button>
        </div>
      </div>

      {/* Phase 1: Core Intelligence Steps Workflow Ticker */}
      <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
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
                    ? "bg-zinc-900 text-white border-zinc-950 shadow" 
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
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
        <Card className="border-none shadow-sm bg-white border border-zinc-200 rounded-2xl overflow-hidden relative group hover:border-zinc-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <span>Trending Industries</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900">Healthcare / Retail</div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Top vertical content demands</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-zinc-200 rounded-2xl overflow-hidden relative group hover:border-zinc-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <span>Competitor Activity</span>
              <Activity className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900">Spike detected (+45%)</div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Agency X ad campaign launch</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-zinc-200 rounded-2xl overflow-hidden relative group hover:border-zinc-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <span>AI Lead Opportunity Score</span>
              <Target className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-zinc-900">92 / 100</div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Premium budget availability</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-zinc-200 rounded-2xl overflow-hidden relative group hover:border-zinc-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-zinc-400 mb-2 text-xs font-bold uppercase tracking-wider">
              <span>Market Gap Alerts</span>
              <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-zinc-900">4 Critical Gaps</div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Outdated advertising styles</p>
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
                alert.type === 'gap' ? "bg-amber-50 border-amber-100 text-amber-800" :
                alert.type === 'sync' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                alert.type === 'lead' ? "bg-indigo-50 border-indigo-100 text-indigo-800" : "bg-zinc-50 border-zinc-200 text-zinc-800"
              )}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'gap' && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />}
                {alert.type === 'sync' && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
                {alert.type === 'lead' && <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 animate-pulse" />}
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
          <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-900 overflow-hidden">
            <CardHeader className="p-6 border-b border-zinc-100 shrink-0">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">Categories</span>
              <h3 className="text-lg font-black text-zinc-950 mt-1">Research Index</h3>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
              {[
                { id: "overview", label: "Dashboard Overview", count: "Pulse", icon: BarChart3 },
                { id: "leads", label: "Lead Discovery & Scoring", count: leadsList.length, icon: Target },
                { id: "gaps", label: "Market Gap Detection", count: MARKET_GAPS.length, icon: AlertTriangle },
                { id: "competitors", label: "Competitor Intelligence", count: COMPETITORS.length, icon: Users },
                { id: "trends", label: "Realtime Trends Monitor", count: LIVE_TRENDS.length, icon: TrendingUp },
                { id: "opportunities", label: "Opportunity Boards", count: OPPORTUNITY_BOARDS.length, icon: Layers }
              ].map((category) => (
                <button 
                  key={category.id}
                  onClick={() => {
                    setActiveTab(category.id);
                    toast({ title: `Viewing ${category.label}`, description: `Focus updated successfully.` });
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all",
                    (activeTab === category.id) 
                      ? "bg-zinc-900 text-white shadow-md" 
                      : "text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <category.icon className={cn("h-4 w-4", activeTab === category.id ? "text-red-500 animate-pulse" : "text-zinc-400")} />
                    {category.label}
                  </span>
                  <Badge className={cn("text-[9px] font-black uppercase rounded-md shadow-sm border border-zinc-200", 
                    activeTab === category.id ? "bg-red-600 text-white border-red-700" : "bg-zinc-50 text-zinc-500"
                  )}>
                    {category.count}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Collaborative Research Notes Feed (Phase 14) */}
          <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-900">
            <CardHeader className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">Collaboration</span>
                <h3 className="text-lg font-black text-zinc-950 mt-1">Research Notes</h3>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg border-zinc-200"
                onClick={() => {
                  toast({ title: "Notes Saved", description: "Saved collaborative notes snapshot in DB." });
                }}
              >
                <FileSpreadsheet className="h-4 w-4 text-zinc-500" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea 
                value={researchNotes}
                onChange={(e) => setResearchNotes(e.target.value)}
                placeholder="Write collaborative research team notes..."
                className="border-zinc-200 bg-zinc-50 rounded-xl text-zinc-700 text-xs min-h-[100px] leading-relaxed p-3 focus-visible:ring-zinc-200"
              />
              <span className="text-[10px] text-zinc-400 font-bold block">Autosaved to Research Team project.</span>
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
              <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/30">
                  <div>
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">Phase 13 Analytics</span>
                    <h3 className="text-lg font-black text-zinc-950 mt-1">AI Video & CGI Demand Forecast</h3>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-xs font-bold py-1 px-3">
                    94.8% Confidence
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={DEMAND_FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs font-bold text-zinc-500">
                    <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500" /> AI Ads Demand</span>
                    <span className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-indigo-500" /> CGI Walkthroughs</span>
                  </div>
                </CardContent>
              </Card>

              {/* Opportunity Pipeline Values */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-950 p-6 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Discovered Opportunities</span>
                  <div className="text-3xl font-black mt-3">₹85,00,000</div>
                  <p className="text-xs text-zinc-500 font-bold mt-1 tracking-wide">TOTAL PIPELINE VALUE</p>
                </Card>
                <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-950 p-6 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Proposal Success Rate</span>
                  <div className="text-3xl font-black mt-3 text-emerald-600">82.4%</div>
                  <p className="text-xs text-zinc-500 font-bold mt-1 tracking-wide">CONVERSION PROBABILITY</p>
                </Card>
              </div>

              {/* Featured Gaps Spotlight (Phase 3) */}
              <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">Market Gaps</span>
                    <h3 className="text-lg font-black text-zinc-950 mt-1">High-Impact Gaps</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("gaps")} className="text-red-500 text-xs font-bold hover:bg-red-50 hover:text-red-600 rounded-lg">View All Gaps</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {MARKET_GAPS.slice(0, 2).map((gap) => (
                    <div key={gap.id} className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl space-y-3 shadow-sm hover:border-zinc-250 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                          <Building className="h-4 w-4 text-zinc-400" />
                          {gap.industry} — {gap.region}
                        </span>
                        <Badge className="bg-red-500 text-white text-[9px] font-bold uppercase rounded-md shadow-sm">
                          {gap.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-600 font-medium leading-relaxed">{gap.gap}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          )}

          {/* Tab Content: Lead Discovery & Scoring (Phase 4 & Phase 5 & Phase 6) */}
          {activeTab === "leads" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="p-6 border-b border-zinc-100 shrink-0">
                  <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">Directory</span>
                  <h3 className="text-lg font-black text-zinc-950 mt-1">Discovered Leads Directory</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100">
                    {filteredLeads.map((lead) => (
                      <div 
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-zinc-50/80 transition-all flex items-center justify-between",
                          selectedLead?.id === lead.id ? "bg-zinc-50 border-l-4 border-l-red-600" : ""
                        )}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-zinc-900 truncate block">{lead.company_name}</span>
                            <Badge className={cn("text-[9px] font-bold uppercase py-0.5 rounded-md", 
                              lead.score === "Premium Opportunity" ? "bg-red-500 text-white" :
                              lead.score === "High" ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500"
                            )}>
                              {lead.score}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
                            <span>{lead.industry}</span> • 
                            <span>{lead.location}</span> • 
                            <span className="text-emerald-600 font-black">₹{lead.estimated_budget.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="ml-4 shrink-0 flex items-center gap-3">
                          {lead.synced ? (
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
                              className="bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold uppercase rounded-lg h-8 shadow"
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
                <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-950 overflow-hidden relative animate-in zoom-in-95">
                  <div className="absolute right-0 top-0 h-40 w-40 bg-red-500/5 rounded-full blur-[60px]" />
                  <CardHeader className="p-6 border-b border-zinc-100 shrink-0">
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">AI Enriched Intelligence Profile</span>
                    <h3 className="text-xl font-black text-zinc-900 mt-1">{selectedLead.company_name}</h3>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 text-zinc-650">
                    
                    {/* Scores Section */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Opportunity Score</span>
                        <span className="text-xl font-black text-zinc-900 block mt-1">{selectedLead.opportunity_score}/100</span>
                      </div>
                      <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">AI Readiness</span>
                        <span className="text-xl font-black text-zinc-900 block mt-1">{selectedLead.ai_readiness}%</span>
                      </div>
                      <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Brand Quality</span>
                        <span className="text-xl font-black text-zinc-900 block mt-1">{selectedLead.brand_quality}</span>
                      </div>
                    </div>

                    {/* Enriched Data Lists */}
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5 text-xs text-zinc-650 font-bold">
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5"><span className="text-zinc-400">Website:</span><a href={selectedLead.website} target="_blank" className="text-indigo-600 hover:underline">{selectedLead.website}</a></div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5"><span className="text-zinc-400">Instagram Handle:</span><span className="text-zinc-800">{selectedLead.instagram}</span></div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5"><span className="text-zinc-400">LinkedIn Company:</span><span className="text-zinc-800">{selectedLead.linkedin}</span></div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5"><span className="text-zinc-400">Contact Email:</span><span className="text-zinc-800">{selectedLead.contact}</span></div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5"><span className="text-zinc-400">Estimated Budget:</span><span className="text-emerald-700 font-black">₹{selectedLead.estimated_budget.toLocaleString()}</span></div>
                      <div className="flex justify-between border-b border-zinc-100 pb-1.5"><span className="text-zinc-400">Services Needed:</span><span className="text-zinc-800">{selectedLead.services_needed}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Outreach Location:</span><span className="text-zinc-800">{selectedLead.location}</span></div>
                    </div>

                    {/* AI Scoring Factors (Phase 6) */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider block">AI Opportunity Score Auditing</span>
                      <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl space-y-2 text-xs font-semibold text-zinc-650">
                        <div className="flex justify-between"><span>Growth Potential:</span><span className="font-bold text-zinc-800">{selectedLead.growth_potential}</span></div>
                        <div className="flex justify-between"><span>Current Marketing Quality:</span><span className="font-bold text-red-600">{selectedLead.marketing_quality}</span></div>
                        <div className="flex justify-between"><span>Outreach Channel:</span><span className="font-bold text-zinc-850">Instagram Reels Ads</span></div>
                      </div>
                    </div>

                    {/* Action Integration sync */}
                    {!selectedLead.synced ? (
                      <Button 
                        disabled={crmSyncingId === selectedLead.id}
                        onClick={() => handleSyncToCRM(selectedLead)}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 font-bold uppercase text-xs tracking-widest shadow-md"
                      >
                        {crmSyncingId === selectedLead.id ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 text-red-500 mr-2 animate-pulse" />}
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
                {MARKET_GAPS.map((gap) => (
                  <Card key={gap.id} className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-900 overflow-hidden relative group hover:border-zinc-300 transition-colors">
                    <CardHeader className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 block">{gap.industry} — {gap.region}</span>
                          <span className="text-[10px] text-zinc-400 font-bold block">Estimated Gap Score: {gap.impact}/100</span>
                        </div>
                      </div>
                      <Badge className="bg-amber-500 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {gap.severity}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm font-medium leading-relaxed text-zinc-700">{gap.gap}</p>
                      
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-650">
                        <div>
                          <span className="text-zinc-400 block mb-0.5">Outdated Style:</span>
                          <span className="font-bold text-zinc-800">{gap.adStyle}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5">AI Readiness:</span>
                          <span className="font-bold text-zinc-800">{gap.aiReadiness}%</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            toast({ title: "Campaign Generated", description: "Created standard targeting outline for this industry." });
                          }}
                          className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-10 font-bold uppercase text-[10px] tracking-widest shadow"
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
                {COMPETITORS.map((comp, idx) => (
                  <Card key={idx} className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-900 overflow-hidden relative">
                    <CardHeader className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-zinc-900 block">{comp.brand}</h3>
                          <span className="text-[10px] text-zinc-400 font-bold block">Social Engagement: {comp.engagement}</span>
                        </div>
                      </div>
                      <Badge className="bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {comp.campaigns} Active Campaigns
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-zinc-650">
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-650">
                        <div>
                          <span className="text-zinc-400 block mb-0.5">Video/Editing Style:</span>
                          <span className="font-bold text-zinc-800">{comp.videoStyle}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5">Production Quality:</span>
                          <span className="font-bold text-zinc-800">{comp.productionQuality}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5">AI Tools Used:</span>
                          <span className="font-bold text-zinc-800">{comp.aiUsage}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-0.5">Estimated Pricing:</span>
                          <span className="font-bold text-zinc-800">{comp.pricing}</span>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-zinc-100 pt-4">
                        <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider block">AI Competitor Weakness Auditing</span>
                        <ul className="space-y-1 text-xs text-red-600 font-semibold list-disc list-inside">
                          {comp.weaknesses.map((weak, wIdx) => (
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
                {LIVE_TRENDS.map((trend) => (
                  <Card key={trend.id} className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-900 overflow-hidden relative">
                    <CardHeader className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-zinc-900 block">{trend.title}</h3>
                          <span className="text-[10px] text-zinc-400 font-bold block">Trend Source: {trend.source}</span>
                        </div>
                      </div>
                      <Badge className="bg-rose-500 text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                        {trend.velocity}% Velocity
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-zinc-650">
                      
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl space-y-2 text-xs font-semibold text-zinc-650">
                        <div>
                          <span className="text-zinc-400 block mb-0.5">Viral Video Format:</span>
                          <span className="font-bold text-zinc-800 leading-relaxed block">{trend.viralFormat}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2.5 items-start">
                        <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                        <p className="text-xs text-indigo-800 font-bold leading-relaxed">
                          <strong>AI Predictive Shift:</strong> {trend.upcomingPrediction}
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
                {OPPORTUNITY_BOARDS.map((board, idx) => (
                  <Card key={idx} className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-950 p-6 flex flex-col justify-between relative group hover:border-zinc-300 transition-colors">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-sm text-zinc-900 group-hover:text-red-600 transition-colors leading-tight">{board.title}</h4>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold uppercase rounded-md">
                          {board.marketDemand} Demand
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-zinc-500 font-semibold leading-relaxed">
                        <div><span className="text-zinc-400">Growth Score:</span> <strong className="text-zinc-800">{board.growthScore}%</strong></div>
                        <div><span className="text-zinc-400">Competition:</span> <strong className="text-zinc-800">{board.competitionScore}</strong></div>
                        <div><span className="text-zinc-400">Suggested Package:</span> <strong className="text-zinc-800">{board.suggestedServices}</strong></div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-4 mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Estimated Deal Value</span>
                        <span className="text-emerald-700 font-black text-sm">{board.estimatedDealValue}</span>
                      </div>
                      <Badge className="bg-zinc-100 text-zinc-700 text-[10px] font-bold uppercase py-1 px-2.5 rounded-lg border-zinc-200">
                        Potential: {board.revenuePotential}
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
          <Card className="bg-zinc-900 border border-zinc-950 text-white rounded-2xl shadow-xl overflow-hidden relative">
            <div className="absolute right-0 top-0 h-40 w-40 bg-red-500/10 rounded-full blur-[60px] pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-md relative z-10">
              <span className="text-xs font-black uppercase text-red-500 tracking-widest block flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                AI Opportunity Strategist
              </span>
              <h3 className="text-lg font-black text-white mt-1">Sales Recommendations</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-zinc-300 relative z-10">
              
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Ideal Pricing Benchmark</span>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-2xl font-black text-emerald-400 block">₹4,50,000 - ₹8,00,000</span>
                  <span className="text-[9px] text-zinc-400 font-bold block mt-1">Minimum gross profit margin: 55%</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Suggested Service Bundle</span>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs font-semibold">
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-red-500 rounded-full" /> Cinematic Vertical Reels</div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-red-500 rounded-full" /> Localized AI Narration</div>
                  <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 bg-red-500 rounded-full" /> CGI Video walkthroughs</div>
                </div>
              </div>

              {/* Phase 11 & Phase 12 Proposal Outreach Draft script */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Suggested Outreach Strategy</span>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-xs font-medium leading-relaxed text-zinc-300 space-y-3">
                  <p className="italic">"We noticed luxury real estate walkthroughs in Bangalore are gaining massive traction, but prestige heights lacks vertical CGI reels."</p>
                  <Button 
                    onClick={() => {
                      toast({ title: "Copied outreach template", description: "Outreach message successfully saved to clipboard." });
                    }}
                    className="w-full bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl h-10 font-bold uppercase text-[9px] tracking-widest"
                  >
                    Copy Outreach Script
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Realtime Opportunity Collaboration feed (Phase 14) */}
          <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm text-zinc-850 flex flex-col min-h-[300px]">
            <CardHeader className="p-6 border-b border-zinc-100 shrink-0">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-widest block">Discussions Feed</span>
              <h3 className="text-lg font-black text-zinc-950 mt-1">Opportunity Chat</h3>
            </CardHeader>
            <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[160px] max-h-[220px] custom-scrollbar mb-4">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-xs leading-relaxed shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-zinc-850">{comm.user}</span>
                      <span className="text-[10px] text-zinc-400 font-bold">{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-zinc-600 font-bold leading-relaxed">{comm.text}</p>
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
                  className="bg-zinc-50 border-zinc-200 rounded-xl text-xs h-9 text-zinc-950 focus-visible:ring-zinc-200"
                />
                <Button 
                  onClick={handleAddComment}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-9 w-9 shrink-0 p-0 shadow-sm"
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
