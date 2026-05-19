"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, SlidersHorizontal, Sparkles, Star, MapPin, Instagram, 
  Youtube, ArrowRight, UserCheck, CheckCircle2, ShieldAlert, 
  Flame, Filter, Check, Shield, Zap, BadgeAlert, Plus, Eye,
  LayoutGrid, List
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// ----------------------------------------------------
// Public Talent pool - Safe Mock data
// ----------------------------------------------------
const PUBLIC_TALENT_POOL = [
  {
    id: "public_t1",
    fullName: "Tovino Thomas",
    stageName: "Tovino",
    category: "Actor",
    skills: ["Method Acting", "Stunts", "Cinematic Action"],
    location: "Kochi, Kerala",
    dayRate: 350000,
    followers: 7800000,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500",
    verifiedLevel: "Premium", // Basic, Verified, Premium
    languages: ["Malayalam", "English", "Tamil"],
    rating: 4.9,
    availability: "Available",
    bio: "Leading South Indian actor known for intense dramatic performance and high-octane physical roles."
  },
  {
    id: "public_t2",
    fullName: "Nimisha Sajayan",
    stageName: "Nimisha",
    category: "Actor",
    skills: ["Emotional Drama", "Realism", "Theater"],
    location: "Kochi, Kerala",
    dayRate: 150000,
    followers: 1800000,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500",
    verifiedLevel: "Verified",
    languages: ["Malayalam", "English", "Tamil"],
    rating: 4.8,
    availability: "Available",
    bio: "Award-winning actor celebrated for raw, highly realistic portrayals in Malayalam cinema."
  },
  {
    id: "public_t3",
    fullName: "Basil Joseph",
    stageName: "Basil",
    category: "Director / Actor",
    skills: ["Comedy", "Dialogue Delivery", "Commercials"],
    location: "Kozhikode, Kerala",
    dayRate: 250000,
    followers: 2400000,
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=500",
    verifiedLevel: "Premium",
    languages: ["Malayalam", "English"],
    rating: 4.9,
    availability: "Busy",
    bio: "Versatile actor-director behind regional superhero blockbusters and feel-good hits."
  },
  {
    id: "public_t4",
    fullName: "Arjun Ashokan",
    stageName: "Arjun",
    category: "Actor",
    skills: ["Character Roles", "Youth Appeal", "Dubbing"],
    location: "Kochi, Kerala",
    dayRate: 120000,
    followers: 1200000,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=500",
    verifiedLevel: "Verified",
    languages: ["Malayalam"],
    rating: 4.7,
    availability: "Available",
    bio: "Prolific actor recognized for fresh, energetic character performances in modern cinema."
  },
  {
    id: "public_t5",
    fullName: "Joju George",
    stageName: "Joju",
    category: "Actor / Producer",
    skills: ["Intense Drama", "Action", "Production Planning"],
    location: "Thrissur, Kerala",
    dayRate: 300000,
    followers: 950000,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=500",
    verifiedLevel: "Premium",
    languages: ["Malayalam", "Tamil"],
    rating: 4.9,
    availability: "On Shoot",
    bio: "Critically acclaimed veteran actor known for powerful leading character roles and production backing."
  },
  {
    id: "public_t6",
    fullName: "Darshana Rajendran",
    stageName: "Darshana",
    category: "Anchor / Actor",
    skills: ["Theater Performance", "Playback Singing", "Live Hosting"],
    location: "Trivandrum, Kerala",
    dayRate: 110000,
    followers: 1400000,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=500",
    verifiedLevel: "Verified",
    languages: ["Malayalam", "Tamil", "English"],
    rating: 4.8,
    availability: "Available",
    bio: "Expressive actor and vocalist with extensive experience in theatrical and alternative cinema."
  }
];

export default function PublicCreatorsNetwork() {
  const { toast } = useToast();

  // View mode switcher: 'thumbnail' (Grid) | 'list'
  const [viewMode, setViewMode] = useState<'thumbnail' | 'list'>('thumbnail');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [maxDayRate, setMaxDayRate] = useState<number>(400000);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [minFollowers, setMinFollowers] = useState<number>(0);

  // AI Recommendation engine state
  const [aiBriefText, setAiBriefText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendedIds, setAiRecommendedIds] = useState<string[]>([]);
  const [isAiApplied, setIsAiApplied] = useState(false);

  // AI Auto-Correct Dictionary
  const AI_CORRECTION_DICT: Record<string, string> = {
    "stnt": "stunt",
    "stnts": "stunts",
    "malyalam": "Malayalam",
    "malaylam": "Malayalam",
    "actr": "actor",
    "actrs": "actors",
    "commecial": "commercial",
    "automtive": "automotive",
    "autmotive": "automotive",
    "emotinal": "emotional",
    "directr": "director",
    "directrs": "directors",
    "avialable": "available",
    "keral": "Kerala",
    "kochin": "Kochi",
  };

  // AI Auto-Correct for search keyword query
  const aiCorrection = useMemo(() => {
    if (!searchQuery) return null;
    const words = searchQuery.split(/\s+/);
    let corrected = false;
    const newWords = words.map(w => {
      const cleanW = w.toLowerCase().replace(/[^a-z]/g, "");
      if (AI_CORRECTION_DICT[cleanW]) {
        corrected = true;
        return AI_CORRECTION_DICT[cleanW];
      }
      return w;
    });
    return corrected ? newWords.join(" ") : null;
  }, [searchQuery]);

  // AI Auto-Correct for AI castings brief text
  const aiBriefCorrection = useMemo(() => {
    if (!aiBriefText) return null;
    const words = aiBriefText.split(/\s+/);
    let corrected = false;
    const newWords = words.map(w => {
      const cleanW = w.toLowerCase().replace(/[^a-z]/g, "");
      if (AI_CORRECTION_DICT[cleanW]) {
        corrected = true;
        return AI_CORRECTION_DICT[cleanW];
      }
      return w;
    });
    return corrected ? newWords.join(" ") : null;
  }, [aiBriefText]);

  // Category and location listings
  const categories = ["All", "Actor", "Director / Actor", "Anchor / Actor"];
  const locations = [
    "All",
    "Alappuzha, Kerala",
    "Ernakulam, Kerala",
    "Idukki, Kerala",
    "Kannur, Kerala",
    "Kasaragod, Kerala",
    "Kochi, Kerala",
    "Kollam, Kerala",
    "Kottayam, Kerala",
    "Kozhikode, Kerala",
    "Malappuram, Kerala",
    "Palakkad, Kerala",
    "Pathanamthitta, Kerala",
    "Thiruvananthapuram, Kerala",
    "Thrissur, Kerala",
    "Wayanad, Kerala"
  ];

  // Filter logic
  const filteredTalent = useMemo(() => {
    return PUBLIC_TALENT_POOL.filter(talent => {
      const matchesSearch = 
        talent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || talent.category === selectedCategory;
      const matchesLocation = selectedLocation === "All" || talent.location === selectedLocation;
      const matchesRate = talent.dayRate <= maxDayRate;
      const matchesVerification = !verifiedOnly || ["Verified", "Premium"].includes(talent.verifiedLevel);
      const matchesFollowers = talent.followers >= minFollowers;
      const matchesAI = !isAiApplied || aiRecommendedIds.includes(talent.id);

      return matchesSearch && matchesCategory && matchesLocation && matchesRate && matchesVerification && matchesFollowers && matchesAI;
    });
  }, [searchQuery, selectedCategory, selectedLocation, maxDayRate, verifiedOnly, minFollowers, isAiApplied, aiRecommendedIds]);

  // AI Matching mock computation
  const handleAIAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiBriefText.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const briefLower = aiBriefText.toLowerCase();
      let matched: string[] = [];

      if (briefLower.includes("stunt") || briefLower.includes("action") || briefLower.includes("intensity")) {
        matched = ["public_t1", "public_t5"]; // Tovino, Joju
      } else if (briefLower.includes("realism") || briefLower.includes("emotional") || briefLower.includes("drama")) {
        matched = ["public_t2", "public_t6"]; // Nimisha, Darshana
      } else if (briefLower.includes("comedy") || briefLower.includes("funny") || briefLower.includes("youth")) {
        matched = ["public_t3", "public_t4"]; // Basil, Arjun
      } else {
        matched = ["public_t1", "public_t2", "public_t3"];
      }

      setAiRecommendedIds(matched);
      setIsAiApplied(true);
      setIsAnalyzing(false);

      toast({
        title: "AI Search Complete",
        description: `Found ${matched.length} matching creators.`
      });
    }, 1500);
  };

  const handleClearAI = () => {
    setIsAiApplied(false);
    setAiBriefText("");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased pb-20 relative overflow-hidden selection:bg-red-500 selection:text-white">
      
      {/* 🚀 Pure Apple Translucent Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base uppercase tracking-wider text-slate-900">Define Perspective</span>
            <Badge className="bg-red-500/10 text-red-650 border-none font-bold text-[8px] uppercase tracking-widest py-0.5 px-2 rounded-full">Directory</Badge>
          </div>

          <div className="flex items-center gap-4">
            <a href="/creators/onboarding">
              <Button className="rounded-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition duration-300">
                <Plus className="h-4 w-4 mr-1" /> Onboard Profile
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ⚡ Spacious Apple-Style Hero Headline */}
      <section className="relative py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <Badge className="bg-red-500/10 text-red-600 border-none font-bold text-[10px] uppercase py-1.5 px-3.5 tracking-widest rounded-full">
              <Flame className="h-3.5 w-3.5 mr-1.5 animate-pulse text-red-600" /> Available Creators
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              Connect with leading <br />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                cinematic talent.
              </span>
            </h1>
            
            <p className="text-base text-slate-500 leading-relaxed font-medium max-w-lg">
              Find, evaluate, and book professional actors, models, voice artists, and crew for premium advertising campaigns. Complete with media-rich verified portfolios.
            </p>
          </div>

          {/* AI Castings Briefing Assistant */}
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm relative hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <Sparkles className="h-4.5 w-4.5 text-red-650" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Find with AI</h3>
                    <p className="text-[9px] text-slate-400 font-medium">Type what you need in simple English</p>
                  </div>
                </div>
                {isAiApplied && (
                  <Badge 
                    onClick={handleClearAI} 
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none text-[9px] font-bold cursor-pointer rounded-full px-2.5 py-0.5 transition"
                  >
                    Clear Filter
                  </Badge>
                )}
              </div>

              <form onSubmit={handleAIAnalyze} className="space-y-3">
                <div className="relative pb-3">
                  <Textarea 
                    placeholder="Need a high-action lead actor with stunt capabilities for a Malayalam automotive commercial campaign..."
                    value={aiBriefText}
                    onChange={(e) => setAiBriefText(e.target.value)}
                    className="bg-slate-50 border-slate-250 h-20 text-xs rounded-xl focus:border-red-500 resize-none text-slate-800 font-bold p-3 outline-none w-full"
                    required
                  />
                  {aiBriefCorrection && (
                    <div className="absolute left-2.5 bottom-[-8px] flex items-center gap-1 text-[9px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm animate-fade-in z-10">
                      <Sparkles className="h-2.5 w-2.5 text-red-650 animate-pulse" />
                      <span>Did you mean:</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setAiBriefText(aiBriefCorrection);
                          toast({ title: "AI Corrected", description: "Updated castings brief." });
                        }} 
                        className="text-red-650 hover:underline italic font-extrabold"
                      >
                        "{aiBriefCorrection}"
                      </button>
                      <span>?</span>
                    </div>
                  )}
                </div>
                
                {/* AI Prompt suggestions tags */}
                <div className="space-y-1.5">
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Or select an example prompt:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { emoji: "🔥", text: "Malayalam lead with stunt skills", prompt: "Need a high-action lead actor with stunt capabilities for a Malayalam automotive commercial campaign..." },
                      { emoji: "🎭", text: "Emotional actor for drama", prompt: "Need a highly expressive emotional lead actress for a Malayalam realistic cinematic drama..." },
                      { emoji: "⚡", text: "Comedy actor for youthful spot", prompt: "Need a highly expressive youth comedy actor with Malayalam fluency for a digital commercial spot..." }
                    ].map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiBriefText(tag.prompt)}
                        className="text-[9px] font-bold px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-slate-650 transition flex items-center gap-1 shadow-sm"
                      >
                        <span>{tag.emoji}</span> {tag.text}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isAnalyzing}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold h-10 rounded-full text-xs flex items-center justify-center gap-1.5 shadow transition-all duration-300"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Matching creators...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-red-500 animate-pulse" /> Find Creators
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* 🧭 CORE DISCOVERY INTERFACE (Generous Spacing) */}
      <main className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left Filter Options */}
        <section className="xl:col-span-1 space-y-6">
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-sm">
            <CardContent className="p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-red-650" /> Filters
                </h3>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Specialty</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs text-slate-700 font-bold">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border-slate-200">
                    {categories.map(c => (
                      <SelectItem key={c} value={c} className="text-xs focus:bg-red-600 focus:text-white font-bold">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs text-slate-700 font-bold">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border-slate-200">
                    {locations.map(l => (
                      <SelectItem key={l} value={l} className="text-xs focus:bg-red-600 focus:text-white font-bold">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day rate range slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Max Day Rate</span>
                  <span className="text-red-600 font-bold">₹{maxDayRate.toLocaleString()}</span>
                </div>
                <Slider 
                  min={100000} 
                  max={400000} 
                  step={10000}
                  value={[maxDayRate]} 
                  onValueChange={(val) => setMaxDayRate(val[0])}
                  className="py-2"
                />
              </div>

              {/* Followers filter */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Minimum Followers</label>
                <Select value={minFollowers.toString()} onValueChange={(val) => setMinFollowers(parseInt(val))}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs text-slate-700 font-bold">
                    <SelectValue placeholder="Any Reach" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border-slate-200">
                    <SelectItem value="0" className="text-xs font-bold">Any Reach</SelectItem>
                    <SelectItem value="1000" className="text-xs font-bold">1K+ Followers (Nano)</SelectItem>
                    <SelectItem value="2500" className="text-xs font-bold">2.5K+ Followers (Nano)</SelectItem>
                    <SelectItem value="5000" className="text-xs font-bold">5K+ Followers (Nano)</SelectItem>
                    <SelectItem value="10000" className="text-xs font-bold">10K+ Followers (Micro)</SelectItem>
                    <SelectItem value="50000" className="text-xs font-bold">50K+ Followers (Micro)</SelectItem>
                    <SelectItem value="100000" className="text-xs font-bold">100K+ Followers (Mid-Tier)</SelectItem>
                    <SelectItem value="250000" className="text-xs font-bold">250K+ Followers (Mid-Tier)</SelectItem>
                    <SelectItem value="500000" className="text-xs font-bold">500K+ Followers (Macro)</SelectItem>
                    <SelectItem value="1000000" className="text-xs font-bold">1M+ Followers (Mega)</SelectItem>
                    <SelectItem value="2500000" className="text-xs font-bold">2.5M+ Followers (Mega)</SelectItem>
                    <SelectItem value="5000000" className="text-xs font-bold">5M+ Followers (Mega)</SelectItem>
                    <SelectItem value="10000000" className="text-xs font-bold">10M+ Followers (Superstar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Switch verified */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Verified Only</span>
                <Switch 
                  checked={verifiedOnly} 
                  onCheckedChange={setVerifiedOnly}
                />
              </div>

            </CardContent>
          </Card>
        </section>

        {/* Right Listings Grid */}
        <section className="xl:col-span-3 space-y-8">
          
          {/* Header search bar & View Toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full pb-4">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <Input 
                placeholder="Search skills, experience, tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-slate-200 h-12 pl-11 text-xs rounded-xl focus:border-red-500 text-slate-800 w-full font-bold shadow-sm"
              />
              {aiCorrection && (
                <div className="absolute left-3.5 bottom-[-10px] flex items-center gap-1 text-[9px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm animate-fade-in z-10">
                  <Sparkles className="h-2.5 w-2.5 text-red-650 animate-pulse" />
                  <span>Did you mean:</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearchQuery(aiCorrection);
                      toast({ title: "AI Corrected", description: `Updated search query to: "${aiCorrection}"` });
                    }} 
                    className="text-red-650 hover:underline italic font-extrabold"
                  >
                    "{aiCorrection}"
                  </button>
                  <span>?</span>
                </div>
              )}
            </div>

            {/* Premium Grid/List View switcher */}
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shrink-0 shadow-sm">
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => setViewMode('thumbnail')} 
                className={`rounded-full h-9 px-4 text-xs font-bold gap-1.5 transition duration-300 ${
                  viewMode === 'thumbnail' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" /> Thumbnail
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                onClick={() => setViewMode('list')} 
                className={`rounded-full h-9 px-4 text-xs font-bold gap-1.5 transition duration-300 ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="h-4 w-4" /> List View
              </Button>
            </div>
          </div>

          {/* Active listings summary */}
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
            <span>Displaying <strong>{filteredTalent.length}</strong> creators</span>
            {isAiApplied && (
              <span className="text-red-600 font-bold bg-red-500/5 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-500/10">
                <Sparkles className="h-3 w-3" /> AI Filter Active
              </span>
            )}
          </div>

          {/* Cards Grid or List */}
          {viewMode === 'thumbnail' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
              {filteredTalent.map(talent => (
                <Card key={talent.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:border-red-500/40 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                  
                  <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-slate-100">
                    <img src={talent.avatarUrl} alt={talent.fullName} className="object-cover h-full w-full group-hover:scale-105 transition duration-500" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <Badge className="bg-slate-900 text-white font-bold text-[8px] uppercase tracking-widest border-none py-0.5 px-2 rounded-full">
                        {talent.category}
                      </Badge>
                      <Badge className={`border-none font-bold text-[8px] py-0.5 px-2 rounded-full ${
                        talent.availability === "Available" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                      }`}>
                        {talent.availability}
                      </Badge>
                    </div>
                    
                    {talent.verifiedLevel === "Premium" && (
                      <div className="absolute top-3 right-3 h-6 w-6 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-slate-200 shadow">
                        <Shield className="h-3.5 w-3.5 text-red-600" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-red-600 transition leading-tight">{talent.fullName}</h3>
                        {["Premium", "Verified"].includes(talent.verifiedLevel) && (
                          <CheckCircle2 className="h-4 w-4 text-red-600 fill-red-500/10 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <MapPin className="h-3 w-3 text-red-600" /> {talent.location}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {talent.skills.slice(0, 2).map(s => (
                        <Badge key={s} variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-100 font-bold text-[9px] rounded-full px-2">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Day Rate</span>
                        <strong className="text-slate-950 font-black">₹{talent.dayRate.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Followers</span>
                        <strong className="text-red-600 font-black">{(talent.followers / 1000000).toFixed(1)}M</strong>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a href={`/creators/${talent.id}`} className="w-full">
                        <Button className="w-full rounded-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 group/btn shadow shadow-red-500/10 transition">
                          View Portfolio <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-350">
              {filteredTalent.map(talent => (
                <div key={talent.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm hover:border-red-500/30 transition-all duration-300">
                  
                  <div className="flex gap-4 items-center flex-1">
                    <Avatar className="h-16 w-16 ring-4 ring-slate-100 shadow-sm shrink-0">
                      <AvatarImage src={talent.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-800 font-bold">{talent.fullName[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 leading-tight">{talent.fullName}</h3>
                        {["Premium", "Verified"].includes(talent.verifiedLevel) && (
                          <CheckCircle2 className="h-4.5 w-4.5 text-red-600 fill-red-500/10 shrink-0" />
                        )}
                        <Badge className="bg-slate-150 text-slate-800 font-bold text-[8px] uppercase tracking-widest border-none py-0.5 px-2 rounded-full">
                          {talent.category}
                        </Badge>
                        <Badge className={`border-none font-bold text-[8px] py-0.5 px-2 rounded-full ${
                          talent.availability === "Available" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        }`}>
                          {talent.availability}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-bold">
                          <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" /> {talent.location}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {talent.skills.slice(0, 3).map(s => (
                            <Badge key={s} variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-100 font-bold text-[9px] rounded-full px-2">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap items-center gap-6 text-xs w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="shrink-0 text-left md:text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Day Rate</span>
                      <strong className="text-slate-950 font-black text-sm">₹{talent.dayRate.toLocaleString()}</strong>
                    </div>

                    <div className="shrink-0 text-left md:text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Followers</span>
                      <strong className="text-red-600 font-black text-sm">{(talent.followers / 1000000).toFixed(1)}M</strong>
                    </div>

                    <div className="w-full md:w-auto shrink-0">
                      <a href={`/creators/${talent.id}`}>
                        <Button className="w-full md:w-auto rounded-full h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition">
                          View Portfolio <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </section>

      </main>

    </div>
  );
}
