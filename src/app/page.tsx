"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { ArrowRight, Play, CheckCircle2, LayoutGrid, Users, Zap, Building2, TerminalSquare, ServerCrash } from "lucide-react";
import { Logo } from "@/components/ui/logo";
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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased pb-20 relative overflow-hidden selection:bg-red-500 selection:text-white">
      
      {/* 🔮 Background Subtle Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* 🚀 Pure Apple Translucent Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>  <Badge className="bg-red-500/10 text-red-600 border-none font-bold text-[8px] uppercase tracking-widest py-0.5 px-2 rounded-full ring-1 ring-red-500/20 shadow-sm">Active</Badge>

          <nav className="flex items-center gap-6">
            <Link href="/creators" className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-900 font-bold transition">Directory</Link>
            <Link href="/login">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-5 text-xs rounded-full shadow-md transition duration-300">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ⚡ Cinematic Antigravity Hero Headline */}
      <section className="relative py-32 max-w-[1400px] mx-auto px-6 text-center space-y-10 z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <Badge className="bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
            <Sparkle className="h-3.5 w-3.5 inline-block mr-1.5 text-red-500" /> Welcome to Media OS
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-[84px] font-black tracking-tighter text-slate-900 leading-[1.05] max-w-5xl mx-auto whitespace-pre-line drop-shadow-sm">
            Architect your next {"\n"}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-orange-600">cinematic campaign.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto pt-2">
            The definitive platform to discover, evaluate, and book professional actors, models, and crew. Powered by deep intelligence.
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-6">
          <Link href="/creators/onboarding">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold h-14 px-8 rounded-full text-[13px] flex items-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.25)] hover:shadow-[0_0_35px_rgba(220,38,38,0.35)] hover:-translate-y-0.5 transition-all duration-300">
              Join Creator Network <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <a href="#campaign-generator">
            <Button size="lg" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold h-14 px-8 rounded-full text-[13px] gap-2 shadow-sm transition-all duration-300">
              Start Campaign <PlayCircle className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* 🧭 Triptych Features */}
      <section className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        <Card className="bg-white border border-slate-200 rounded-[2rem] hover:border-red-500/30 hover:bg-slate-50/50 transition-all duration-500 shadow-xl shadow-slate-200/50 overflow-hidden group min-h-[240px] flex flex-col justify-between relative">
          <CardContent className="p-8 space-y-5 relative z-10 flex-1 flex flex-col justify-between">
            <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600 ring-1 ring-red-500/20 group-hover:scale-110 transition-transform duration-500">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-900">AI Assistant</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">Get instant creator suggestions and budget estimates for your upcoming campaigns in milliseconds.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-[2rem] hover:border-indigo-500/30 hover:bg-slate-50/50 transition-all duration-500 shadow-xl shadow-slate-200/50 overflow-hidden group min-h-[240px] flex flex-col justify-between relative">
          <CardContent className="p-8 space-y-5 relative z-10 flex-1 flex flex-col justify-between">
            <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 ring-1 ring-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-900">Creator Network</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">Hire verified actors, models, and video editors for your projects with full portfolio transparency.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 rounded-[2rem] hover:border-emerald-500/30 hover:bg-slate-50/50 transition-all duration-500 shadow-xl shadow-slate-200/50 overflow-hidden group min-h-[240px] flex flex-col justify-between relative">
          <CardContent className="p-8 space-y-5 relative z-10 flex-1 flex flex-col justify-between">
            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-900">Project Portal</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-bold">Review raw videos, share feedback, and track payments in a single, secure enterprise workspace.</p>
            </div>
          </CardContent>
        </Card>

      </section>

      {/* 🎭 Premium Verified Creators Grid */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 space-y-10 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">Exclusive Access</span>
            <h2 className="text-4xl font-black uppercase text-slate-900 tracking-tighter">Verified Roster</h2>
          </div>

          {/* Directory filters */}
          <div className="flex gap-3">
            <select 
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-full text-xs h-10 px-5 outline-none font-bold focus:border-red-500 shadow-sm appearance-none"
            >
              <option value="all">All Specialties</option>
              <option value="anchor">Anchor</option>
              <option value="model">Model</option>
              <option value="dop">DOP</option>
            </select>

            <select 
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-full text-xs h-10 px-5 outline-none font-bold focus:border-red-500 shadow-sm appearance-none"
            >
              <option value="all">All Locations</option>
              <optgroup label="Kerala Districts">
                <option value="thiruvananthapuram">Thiruvananthapuram</option>
                <option value="kollam">Kollam</option>
                <option value="pathanamthitta">Pathanamthitta</option>
                <option value="alappuzha">Alappuzha</option>
                <option value="kottayam">Kottayam</option>
                <option value="idukki">Idukki</option>
                <option value="ernakulam">Ernakulam (Kochi)</option>
                <option value="thrissur">Thrissur</option>
                <option value="palakkad">Palakkad</option>
                <option value="malappuram">Malappuram</option>
                <option value="kozhikode">Kozhikode</option>
                <option value="wayanad">Wayanad</option>
                <option value="kannur">Kannur</option>
                <option value="kasaragod">Kasaragod</option>
              </optgroup>
              <optgroup label="Other Metros">
                <option value="bangalore">Bangalore</option>
                <option value="mumbai">Mumbai</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Creators Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredCreators.map(c => (
            <Card key={c.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-red-500/50 hover:shadow-2xl shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between group">
              
              <div className="p-8 space-y-6">
                <div className="flex gap-5 items-center">
                  <Avatar className="h-20 w-20 ring-4 ring-slate-50 shadow-md shrink-0 group-hover:ring-red-500/10 transition-all duration-500">
                    <AvatarImage src={c.image} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-900 font-bold">{c.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xl text-slate-900 leading-tight">{c.name}</h4>
                      {c.verified && (
                        <CheckCircle2 className="h-5 w-5 text-red-600 fill-red-500/10 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-red-600 font-black uppercase tracking-widest block mt-1.5">{c.category}</span>
                  </div>
                </div>

                {/* Elegant Location Details */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] leading-none text-slate-700 font-bold">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{c.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Eye className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{c.views} views</span>
                  </div>
                </div>
              </div>

              {/* Action links */}
              <div className="bg-slate-50/80 border-t border-slate-100 p-5 flex gap-3">
                <Link href={`/creators/${c.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-full h-12 border-slate-200 bg-white text-xs font-bold text-slate-900 hover:bg-slate-50 shadow-sm transition-all">
                    View Portfolio
                  </Button>
                </Link>
                <Link href="/talent/login" className="flex-1">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full h-12 text-xs font-bold shadow-lg shadow-red-500/20 transition-all">
                    Hire Creator
                  </Button>
                </Link>
              </div>

            </Card>
          ))}
        </div>

      </section>

      {/* 🤖 Siri/Apple-Style AI Matchmaker Cockpit */}
      <section className="max-w-[1000px] mx-auto px-6 py-16 relative z-10">
        <Card className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle animated gradient background inside cockpit */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-indigo-500/5 opacity-50" />
          
          <CardContent className="p-12 space-y-8 relative z-10">
            
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6 text-red-600 animate-pulse" /> Neural AI Assistant
              </h3>
              <p className="text-[13px] text-slate-500 font-bold">Query our intelligence hub for creator suggestions, budget estimates, or cinematic project timelines.</p>
            </div>

            <form onSubmit={handleAskAssistant} className="flex gap-2 bg-slate-50 p-2 rounded-full border border-slate-200 shadow-inner max-w-2xl mx-auto focus-within:border-red-500/50 transition-colors duration-300">
              <Input 
                placeholder="e.g. Find premium Malayalam anchors in Kochi..."
                value={publicQuery}
                onChange={(e) => setPublicQuery(e.target.value)}
                className="bg-transparent border-none h-12 px-6 text-[13px] rounded-full flex-grow focus-visible:ring-0 text-slate-900 font-bold placeholder:text-slate-400"
              />
              <Button type="submit" disabled={isLoadingAnswer} className="rounded-full h-12 bg-red-600 text-white hover:bg-red-700 font-bold text-[13px] px-8 shadow-md transition-all duration-300 hover:scale-[1.02]">
                {isLoadingAnswer ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  "Initiate Search"
                )}
              </Button>
            </form>

            {publicAnswer && (
              <div className="p-6 bg-red-50 border border-red-500/20 rounded-3xl leading-relaxed text-[13px] text-red-700 font-bold animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto shadow-sm">
                {publicAnswer}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-2">
              <span>Try:</span>
              <button type="button" onClick={() => setPublicQuery("Find Malayalam anchors")} className="hover:text-red-600 transition">“Kochi Malayalam Anchors”</button>
              <span>•</span>
              <button type="button" onClick={() => setPublicQuery("What is the cost for AI TVC?")} className="hover:text-red-600 transition">“Base AI TVC cost”</button>
            </div>

          </CardContent>
        </Card>
      </section>

      {/* 💼 Business Campaign Intake Form */}
      <section id="campaign-generator" className="max-w-[700px] mx-auto px-6 py-16 relative z-10">
        <Card className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/50">
          <CardContent className="p-10 space-y-6">
            
            <div className="space-y-1 text-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Start Your Campaign</h3>
              <p className="text-[13px] text-slate-500 font-bold">Input your parameters to generate a custom production blueprint.</p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-4 text-left pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Your Name</label>
                  <Input 
                    type="text"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="Vijay Shekhar"
                    className="bg-slate-50 border-slate-200 text-slate-900 h-12 text-xs rounded-xl w-full font-bold focus:border-red-500 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Email Address</label>
                  <Input 
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="vijay@brand.com"
                    className="bg-slate-50 border-slate-200 text-slate-900 h-12 text-xs rounded-xl w-full font-bold focus:border-red-500 focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Campaign Package</label>
                <select 
                  value={leadForm.campaignType}
                  onChange={(e) => setLeadForm({ ...leadForm, campaignType: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs h-12 px-4 w-full outline-none font-bold focus:border-red-500 focus:bg-white transition-all shadow-sm appearance-none"
                >
                  <option value="AI TVC Commercial">AI TVC Commercial</option>
                  <option value="CGI Product Launch">CGI Product Launch</option>
                  <option value="Location Cinematic shoot">Location Cinematic shoot</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Campaign Details / Objective</label>
                <textarea 
                  rows={3}
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  placeholder="Summarize the core target audience and timelines..."
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs p-4 text-slate-900 w-full outline-none resize-none focus:border-red-500 focus:bg-white transition-all font-bold placeholder:text-slate-400 shadow-sm"
                  required
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmittingLead}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 rounded-xl text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isSubmittingLead ? "Transmitting..." : "Initialize Campaign Request"}
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
      </section>

      {/* 📊 Platform Health Matrix Footer */}
      <footer className="max-w-[1400px] mx-auto px-6 pt-16 mt-10 border-t border-slate-200 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-xs text-slate-600 font-bold">
          
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-red-600 animate-pulse" /> System Status
            </span>
            <div className="space-y-2 leading-relaxed text-[11px] text-slate-500">
              <div>Network Node: <strong className="text-slate-900">{healthStats.realtimeSync}</strong></div>
              <div>Response Time: <strong className="text-slate-900">{healthStats.apiLatency}</strong></div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">Platform Hubs</span>
            <Link href="/login" className="hover:text-red-600 block text-slate-500 transition-colors">Workspace Login</Link>
            <Link href="/talent/login" className="hover:text-red-600 block text-slate-500 transition-colors">Creator Portal</Link>
            <Link href="/client/login" className="hover:text-red-600 block text-slate-500 transition-colors">Business Collaboration</Link>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">Security</span>
            <div className="text-slate-500">Encrypted DB Node</div>
            <div className="text-slate-500">Zero-Trust Auth</div>
          </div>

          <div className="col-span-1 md:col-span-1 space-y-4">
            <Logo />
            <p className="text-[11px] leading-relaxed font-bold text-slate-500 max-w-[200px]">
              Advanced intelligence network for high-end cinematic production and creator casting.
            </p>
          </div>

        </div>

        <div className="text-center text-[10px] text-slate-400 mt-16 pt-8 border-t border-slate-200 font-bold uppercase tracking-widest">
          © 2026 Define Perspective Media OS. System active.
        </div>
      </footer>

    </div>
  );
}
