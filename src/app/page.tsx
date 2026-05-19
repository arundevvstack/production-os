"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { 
  Sparkles, Bot, Users, Film, Building2, ChevronRight, Play, ArrowRight,
  TrendingUp, BarChart3, Star, CheckCircle2, ShieldCheck, Database,
  ArrowUpRight, Heart, HeartOff, PhoneCall, Send, Search,
  Activity, Zap, Network, Loader2, Sparkle, Terminal, MapPin, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function PublicEcosystemHomepage() {
  const { user, isLoading, profile } = useTenant();
  const router = useRouter();
  const { toast } = useToast();

  // Automatic dashboard routing if authenticated
  useEffect(() => {
    if (!isLoading && user) {
      if (profile?.role_id === "TALENT" || profile?.role_id === "CREATOR") {
        router.push("/talent/dashboard");
      } else if (profile?.role_id === "CLIENT" || profile?.role_id === "CLIENT_MANAGER") {
        router.push("/client/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, profile, router]);

  // Public AI Matchmaker Roster Mockup
  const creators = [
    { id: "akhil", name: "Akhil K.", category: "Anchor", city: "Kochi", language: "Malayalam", rating: "4.9", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400", views: "14.2K", verified: true },
    { id: "sneha", name: "Sneha Nair", category: "Model", city: "Bangalore", language: "English", rating: "5.0", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=400", views: "28.5K", verified: true },
    { id: "arjun", name: "Arjun Dev", category: "DOP", city: "Mumbai", language: "Hindi", rating: "4.8", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400", views: "8.9K", verified: false }
  ];

  // Search filter states
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchCity, setSearchCity] = useState("all");

  const filteredCreators = creators.filter(c => {
    if (searchCategory !== "all" && c.category.toLowerCase() !== searchCategory.toLowerCase()) return false;
    if (searchCity !== "all" && c.city.toLowerCase() !== searchCity.toLowerCase()) return false;
    return true;
  });

  // Client Lead Generation State
  const [leadForm, setLeadForm] = useState({ name: "", email: "", campaignType: "AI TVC Commercial", message: "" });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Public AI Assistant Mock Query Box
  const [publicQuery, setPublicQuery] = useState("");
  const [publicAnswer, setPublicAnswer] = useState("");
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  // Platform Health Center Live Metrics mockup
  const healthStats = {
    realtimeSync: "100% Online",
    apiLatency: "42ms average",
    activeCampaigns: "14 In Production"
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);

    setTimeout(() => {
      setIsSubmittingLead(false);
      setLeadForm({ name: "", email: "", campaignType: "AI TVC Commercial", message: "" });
      toast({
        title: "Inquiry Sent",
        description: "Our team will review your request and get back to you shortly."
      });
    }, 1200);
  };

  const handleAskAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicQuery.trim()) return;

    setIsLoadingAnswer(true);
    setTimeout(() => {
      setIsLoadingAnswer(false);
      const query = publicQuery.toLowerCase();
      
      if (query.includes("kochi") || query.includes("anchor")) {
        setPublicAnswer("Creator Match: Found Akhil K. (Anchor in Kochi). Click 'Hire Creator' to contact them.");
      } else if (query.includes("cost") || query.includes("cost for ai tvc") || query.includes("cost of ai tvc")) {
        setPublicAnswer("Budget Estimate: Video production starts at ₹3,50,000. Includes shooting, 1 model, and edits.");
      } else if (query.includes("healthcare") || query.includes("healthcare brand")) {
        setPublicAnswer("Idea: Recommend standard video reels, Malayalam speech, and simple graphics.");
      } else {
        setPublicAnswer("AI Match: We found 3 local creators matching your budget. Send an inquiry to get a full cost breakdown.");
      }
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans antialiased pb-20 relative overflow-hidden selection:bg-red-500 selection:text-white">
      
      {/* 🚀 Pure Apple Translucent Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base uppercase tracking-wider text-slate-900">Define Perspective</span>
            <Badge className="bg-red-500/10 text-red-600 border-none font-bold text-[8px] uppercase tracking-widest py-0.5 px-2 rounded-full">Active</Badge>
          </div>

          <nav className="flex items-center gap-6">
            <Link href="/creators" className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-900 font-bold transition">Directory</Link>
            <Link href="/login">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-5 text-xs rounded-full transition duration-300">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ⚡ Spacious Apple-Style Hero Headline */}
      <section className="relative py-24 max-w-[1400px] mx-auto px-6 text-center space-y-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge className="bg-red-500/10 text-red-600 border-none font-bold text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-full">
            Welcome to Define Perspective
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05] max-w-4xl mx-auto whitespace-pre-line">
            Connect with leading{"\n"}cinematic talent.
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium max-w-3xl mx-auto pt-2">
            Find, evaluate, and book professional actors, models, voice artists, and crew for premium advertising campaigns. Complete with media-rich verified portfolios.
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Link href="/creators/onboarding">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 rounded-full text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition duration-300">
              Join Creator Network <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <a href="#campaign-generator">
            <Button size="lg" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold h-12 px-8 rounded-full text-xs gap-1.5 shadow-sm transition">
              Start Campaign <ChevronRight className="h-4.5 w-4.5" />
            </Button>
          </a>
        </div>
      </section>

      {/* 🧭 The Apple Triptych (Capabilities Showcase with Generous Spacing) */}
      <section className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <Card className="bg-white border border-slate-200 rounded-3xl hover:border-red-500/30 hover:shadow-lg transition duration-300 shadow-sm relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
          <CardContent className="p-8 space-y-4 relative z-10 flex-1 flex flex-col justify-between">
            <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-600">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">AI Assistant</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">Get instant creator suggestions and budget estimates for your campaigns.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-3xl hover:border-indigo-500/30 hover:shadow-lg transition duration-300 shadow-sm relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
          <CardContent className="p-8 space-y-4 relative z-10 flex-1 flex flex-col justify-between">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Creator Network</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">Hire verified actors, models, and video editors for your projects.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-3xl hover:border-emerald-500/30 hover:shadow-lg transition duration-300 shadow-sm relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
          <CardContent className="p-8 space-y-4 relative z-10 flex-1 flex flex-col justify-between">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Project Portal</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">Review raw videos, share feedback, and track payments in one workspace.</p>
            </div>
          </CardContent>
        </Card>

      </section>

      {/* 🎭 Premium Verified Creators Grid */}
      <section className="max-w-[1400px] mx-auto px-6 py-12 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">Available Now</span>
            <h2 className="text-3xl font-bold uppercase text-slate-900 tracking-tight">Verified Roster</h2>
          </div>

          {/* Directory filters */}
          <div className="flex gap-2">
            <select 
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-white border border-slate-200 text-slate-750 rounded-full text-xs h-9 px-4 outline-none font-bold focus:border-red-500 shadow-sm"
            >
              <option value="all">All Specialties</option>
              <option value="anchor">Anchor</option>
              <option value="model">Model</option>
              <option value="dop">DOP</option>
            </select>

            <select 
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="bg-white border border-slate-200 text-slate-750 rounded-full text-xs h-9 px-4 outline-none font-bold focus:border-red-500 shadow-sm"
            >
              <option value="all">All Locations</option>
              <option value="kochi">Kochi</option>
              <option value="bangalore">Bangalore</option>
              <option value="mumbai">Mumbai</option>
            </select>
          </div>
        </div>

        {/* Creators Card Grid (Premium White Card Design with Spacing) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredCreators.map(c => (
            <Card key={c.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-red-500/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between shadow-sm">
              
              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-center">
                  <Avatar className="h-16 w-16 ring-4 ring-slate-100 shadow-sm shrink-0">
                    <AvatarImage src={c.image} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-800 font-bold">{c.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-base text-slate-900 leading-tight">{c.name}</h4>
                      {c.verified && (
                        <CheckCircle2 className="h-4.5 w-4.5 text-red-600 fill-red-500/10 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-red-600 font-black uppercase tracking-widest block mt-1">{c.category}</span>
                  </div>
                </div>

                {/* Elegant Location Details */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[11px] leading-none text-slate-600 font-bold">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{c.city}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{c.views} views</span>
                  </div>
                </div>
              </div>

              {/* Action links */}
              <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex gap-3">
                <Link href={`/creators/${c.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-full h-11 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                    View Portfolio
                  </Button>
                </Link>
                <Link href="/talent/login" className="flex-1">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full h-11 text-xs font-bold transition shadow-sm shadow-red-500/10">
                    Hire Creator
                  </Button>
                </Link>
              </div>

            </Card>
          ))}
        </div>

      </section>

      {/* 🤖 Siri/Apple-Style AI Matchmaker Cockpit */}
      <section className="max-w-[1000px] mx-auto px-6 py-8">
        <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden">
          <CardContent className="p-8 space-y-4 relative z-10">
            
            <div className="text-center space-y-1 max-w-lg mx-auto">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                <Bot className="h-5 w-5 text-red-600" /> AI Assistant
              </h3>
              <p className="text-xs text-slate-500 font-bold">Ask a question about creators, budget estimates, or project timelines.</p>
            </div>

            <form onSubmit={handleAskAssistant} className="flex gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200/80">
              <Input 
                placeholder="e.g. Find Malayalam anchors in Kochi..."
                value={publicQuery}
                onChange={(e) => setPublicQuery(e.target.value)}
                className="bg-transparent border-none h-10 text-xs rounded-full flex-grow focus-visible:ring-0 text-slate-800 font-bold"
              />
              <Button type="submit" disabled={isLoadingAnswer} className="rounded-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 shadow-md transition">
                {isLoadingAnswer ? "Searching..." : "Ask Assistant"}
              </Button>
            </form>

            {publicAnswer && (
              <div className="p-4 bg-red-50/5 border border-red-500/20 rounded-2xl leading-relaxed text-xs text-red-600 font-bold animate-in fade-in zoom-in-95 duration-200">
                {publicAnswer}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Try:</span>
              <button type="button" onClick={() => setPublicQuery("Find Malayalam anchors")} className="hover:text-red-600 transition font-bold">“Kochi Malayalam Anchors”</button>
              <span>•</span>
              <button type="button" onClick={() => setPublicQuery("What is the cost for AI TVC?")} className="hover:text-red-600 transition font-bold">“Base AI TVC cost”</button>
            </div>

          </CardContent>
        </Card>
      </section>

      {/* 💼 Client Campaign Intake Form */}
      <section id="campaign-generator" className="max-w-[700px] mx-auto px-6 py-8">
        <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm">
          <CardContent className="p-8 space-y-4">
            
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight">Start Your Campaign</h3>
              <p className="text-xs text-slate-500 font-bold">Tell us what you need and get a detailed custom estimate.</p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-3 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Your Name</label>
                  <Input 
                    type="text"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="Vijay Shekhar"
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10 text-xs rounded-xl w-full font-bold focus:border-red-500 transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                  <Input 
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="vijay@brand.com"
                    className="bg-slate-50 border-slate-200 text-slate-800 h-10 text-xs rounded-xl w-full font-bold focus:border-red-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Campaign Package</label>
                <select 
                  value={leadForm.campaignType}
                  onChange={(e) => setLeadForm({ ...leadForm, campaignType: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs h-10 px-2 w-full outline-none font-bold focus:border-red-500 transition"
                >
                  <option value="AI TVC Commercial">AI TVC Commercial</option>
                  <option value="CGI Product Launch">CGI Product Launch</option>
                  <option value="Location Cinematic shoot">Location Cinematic shoot</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Campaign Details / Objective</label>
                <textarea 
                  rows={2}
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  placeholder="Summarize the core target audience and timelines..."
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs p-3 text-slate-850 w-full outline-none resize-none focus:border-red-500 transition font-bold"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmittingLead}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 transition duration-300"
              >
                {isSubmittingLead ? "Sending request..." : "Submit Campaign Request"}
              </Button>
            </form>

          </CardContent>
        </Card>
      </section>

      {/* 📊 Platform Health Matrix Footer */}
      <footer className="max-w-[1400px] mx-auto px-6 pt-10 mt-10 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-xs text-slate-600 font-bold">
          
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
              <Activity className="h-4.5 w-4.5 text-red-600 animate-pulse" /> System Status
            </span>
            <div className="space-y-1.5 leading-relaxed text-[11px] text-slate-500">
              <div>Network Node: <strong className="text-slate-900">{healthStats.realtimeSync}</strong></div>
              <div>Response Time: <strong className="text-slate-900">{healthStats.apiLatency}</strong></div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">Platform Hubs</span>
            <Link href="/login" className="hover:text-slate-900 block text-slate-500 font-bold">Workspace Login</Link>
            <Link href="/talent/login" className="hover:text-slate-900 block mt-1 text-slate-500 font-bold">Creator Portal</Link>
            <Link href="/client/login" className="hover:text-slate-900 block mt-1 text-slate-500 font-bold">Client Collaboration</Link>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">Security</span>
            <div className="text-slate-500">Secure Database</div>
            <div className="mt-1 text-slate-500">Secure Login</div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Define Perspective</span>
            <p className="text-[10px] leading-relaxed font-bold text-slate-500">
              A simple marketplace to hire local creators and track your video production projects.
            </p>
          </div>

        </div>

        <div className="text-center text-[10px] text-slate-400 mt-10 pt-6 border-t border-slate-200 font-bold">
          © 2026 Define Perspective. Verified Sandbox Platform.
        </div>
      </footer>

    </div>
  );
}
