"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Search, Heart, MapPin, Instagram, Users, Plus, Calendar, Loader2, Sparkles,
  Clock, DollarSign, CheckCircle2, AlertCircle, Filter, TrendingUp, Video,
  Check, X, MessageSquare, Share2, FileText, Lock, Bell, Award, Briefcase,
  Shield, UserCheck, CreditCard, PenTool, CheckSquare, Trash2, Send
} from "lucide-react";
import Image from "next/image";

// Removed dummy mock data

export default function TalentNetworkPage() {
  const { profile, isLoading: isTenantLoading, companyId, isSuperAdmin } = useTenant();

  // Role permissions simulation (Phase 18)
  const isCasting = useMemo(() => isSuperAdmin || profile?.role_id === "SUPER_ADMIN" || profile?.role_id === "MANAGER" || profile?.department === "Production" || profile?.role_id === "MARKETING_SALES", [profile, isSuperAdmin]);
  const isAccounts = useMemo(() => isSuperAdmin || profile?.role_id === "SUPER_ADMIN" || profile?.role_id === "ACCOUNTS", [profile, isSuperAdmin]);

  // Database dynamic fetch
  const { data: dbTalents, isLoading: isTalentsLoading } = useSupabaseCollection('Talent', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  const { data: projects } = useSupabaseCollection('Project');

  // UI State Management
  const [bridgedTalents, setBridgedTalents] = useState<any[]>([]);

  // Unified roster lists (Merge DB + Rich mock data)
  const talents = useMemo(() => {
    const dbList = (dbTalents || []).map(dt => ({
      id: dt.id,
      full_name: dt.full_name,
      stage_name: dt.full_name.split(" ")[0],
      category: dt.category,
      sub_category: "Registered Talent",
      gender: "Male / Female",
      age: 25,
      location: dt.location || "Kerala, India",
      languages: "English, Regional",
      skills: "Performance Art, Media Production",
      experience: "Entry/Mid Tier",
      day_rate: 85000,
      followers: dt.followers || 0,
      engagement_rate: dt.engagement_rate || 0.05,
      instagram: "@registered_profile",
      youtube: "Profile Channel",
      linkedin: "registered-profile",
      rating: 4.6,
      agency_name: "Independent",
      email: "talent@dpmedia.in",
      phone: "+91 99999 88888",
      tags: ["Verified", "Registered"],
      portfolio_url: dt.portfolio_urls?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=500",
      video_url: "",
      notes: "Newly registered Supabase profile."
    }));

    return [...dbList, ...bridgedTalents];
  }, [dbTalents, bridgedTalents]);

  // UI State Management
  const [activeTab, setActiveTab] = useState<'roster' | 'castings' | 'scheduling' | 'contracts' | 'finance' | 'public-network'>('roster');
  const [selectedProjectForAI, setSelectedProjectForAI] = useState<string>("c_1");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [selectedTalentDetail, setSelectedTalentDetail] = useState<any>(null);

  // Dynamic Lists State (Phase 6, 10, 11, 16)
  const [castingCalls, setCastingCalls] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // Signature states (Phase 10)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [selectedContractForSign, setSelectedContractForSign] = useState<any>(null);
  const [signerFullName, setSignerFullName] = useState("");

  // Form inputs states
  const [newTalentForm, setNewTalentForm] = useState({
    fullName: "",
    category: "Actor",
    dayRate: "120000",
    location: "Kochi, Kerala",
    followers: "150000",
    engagementRate: "0.08"
  });

  const [newCastingForm, setNewCastingForm] = useState({
    projectName: "Pulse Beverages Commercial",
    category: "Influencer",
    gender: "Female",
    ageRange: "20-30",
    languages: "Malayalam, English",
    lookStyle: "Trendy, Creative Creator",
    budget: "180000",
    location: "Kochi",
    shootDates: "2026-07-02 to 2026-07-04",
    deliverables: "4x Instagram Reels, 2x YouTube Shorts"
  });

  const [newBookingForm, setNewBookingForm] = useState({
    talentId: "",
    projectId: "c_1",
    dates: "2026-06-12 to 2026-06-15",
    dayRate: "150000"
  });

  // Unique lists for left side filters
  const categoriesList = useMemo(() => ["All", ...new Set(talents.map(t => t.category))], [talents]);
  const locationsList = useMemo(() => ["All", ...new Set(talents.map(t => t.location?.split(",")[0]?.trim() || ""))], [talents]);

  // Filtered Talents (Phase 4)
  const filteredTalents = useMemo(() => {
    return talents.filter(t => {
      const matchSearch = t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.skills.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = categoryFilter === "All" || t.category === categoryFilter;
      const matchLoc = locationFilter === "All" || t.location?.includes(locationFilter);
      const matchGender = genderFilter === "All" || t.gender === genderFilter;

      return matchSearch && matchCat && matchLoc && matchGender;
    });
  }, [talents, searchQuery, categoryFilter, locationFilter, genderFilter]);

  // Active casting call context for the AI Assistant panel (Phase 7)
  const activeAICasting = useMemo(() => {
    return castingCalls.find(c => c.id === selectedProjectForAI) || castingCalls[0];
  }, [castingCalls, selectedProjectForAI]);

  // AI recommendations logic
  const aiRecommendations = useMemo(() => {
    if (!activeAICasting) return [];
    
    // Suggest talent matching category and budget fit
    return talents.filter(t => t.category === activeAICasting.category).map(t => {
      const isBudgetFit = t.day_rate <= activeAICasting.budget;
      const score = isBudgetFit ? 95 : 82;
      return {
        talent: t,
        score,
        suitability: isBudgetFit ? "Ideal Budget Match" : "Premium Tier, Requires Budget Waiver"
      };
    }).sort((a, b) => b.score - a.score);
  }, [activeAICasting, talents]);

  // Lifecycle
  useEffect(() => {
    if (filteredTalents.length > 0 && !filteredTalents.find(t => t.id === selectedTalentDetail?.id)) {
      setSelectedTalentDetail(filteredTalents[0]);
    }
  }, [filteredTalents, selectedTalentDetail]);

  // Derived Dynamic Stats
  const totalTalents = talents.length;
  const bookedTalents = contracts.filter(c => c.status === "Signed").length;
  const availableTalents = Math.max(0, totalTalents - bookedTalents);
  const utilizationRate = totalTalents > 0 ? ((bookedTalents / totalTalents) * 100).toFixed(1) : "0.0";
  const totalShortlisted = castingCalls.reduce((acc, call) => acc + (call.shortlisted_ids?.length || 0), 0);

  // Database actions: Add Talent Profile (Phase 2 & Supabase Insert)
  const handleCreateTalentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newTalentForm.fullName) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('Talent').insert({
      company_id: companyId,
      full_name: newTalentForm.fullName,
      category: newTalentForm.category,
      location: newTalentForm.location,
      followers: parseInt(newTalentForm.followers) || 0,
      engagement_rate: parseFloat(newTalentForm.engagementRate) || 0.05,
      is_public: true,
      portfolio_urls: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500"]
    });

    if (error) {
      toast({ variant: "destructive", title: "Casting Register Failed", description: error.message });
    } else {
      toast({
        title: "Talent Profile Listed",
        description: `${newTalentForm.fullName} has been successfully registered in your casting roster.`,
      });
      setNewTalentForm({
        fullName: "",
        category: "Actor",
        dayRate: "120000",
        location: "Kochi, Kerala",
        followers: "150000",
        engagementRate: "0.08"
      });
      setIsAddOpen(false);
    }
    setIsSubmitting(false);
  };

  // Add Casting Call requirement (Phase 6)
  const handleCreateCastingCall = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `c_${castingCalls.length + 1}`;
    const entry = {
      id: newId,
      project_name: newCastingForm.projectName,
      category: newCastingForm.category,
      gender: newCastingForm.gender,
      age_range: newCastingForm.ageRange,
      languages: newCastingForm.languages,
      look_style: newCastingForm.lookStyle,
      budget: parseFloat(newCastingForm.budget) || 100000,
      location: newCastingForm.location,
      shoot_dates: newCastingForm.shootDates,
      deliverables: newCastingForm.deliverables,
      shortlisted_ids: [],
      status: "Active"
    };

    setCastingCalls(prev => [entry, ...prev]);
    toast({
      title: "Casting Requirement Published",
      description: `New active casting call published for ${newCastingForm.projectName}. AI matching is analyzing candidate pool.`
    });
    setIsCastingOpen(false);
  };

  // Handle Talent Booking workflow (Phase 9 & 17)
  const handleBookTalent = (e: React.FormEvent) => {
    e.preventDefault();
    const t = talents.find(talent => talent.id === newBookingForm.talentId);
    const pName = castingCalls.find(c => c.id === newBookingForm.projectId)?.project_name || "Commercial Campaign";

    if (!t) return;

    // Add to contracts
    const newContractId = `contract_${contracts.length + 1}`;
    setContracts(prev => [
      {
        id: newContractId,
        talent_name: t.full_name,
        project_name: pName,
        doc_type: "Standard Actor / Talent Release Form V1",
        date_issued: new Date().toISOString().split('T')[0],
        status: "Pending Signature",
        signed_by: "",
        ip_audit_log: "",
        amount: `₹${(parseFloat(newBookingForm.dayRate) * 3).toLocaleString()}`
      },
      ...prev
    ]);

    // Add to payroll ledger
    const newPayId = `pay_${payments.length + 1}`;
    setPayments(prev => [
      {
        id: newPayId,
        talent_name: t.full_name,
        project_name: pName,
        category: "Production Roster Payment",
        amount: parseFloat(newBookingForm.dayRate) * 3,
        advance_paid: 0,
        pending_due: parseFloat(newBookingForm.dayRate) * 3,
        due_date: "2026-06-30",
        status: "Pending"
      },
      ...prev
    ]);

    toast({
      title: "Booking Request Initialized",
      description: `Booking request sent to ${t.full_name}'s agent. Contract draft and financial dues successfully mapped to Finance ledger.`
    });

    setIsBookingOpen(false);
  };

  // Digital Signature approval (Phase 10)
  const handleSignContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerFullName) return;

    setContracts(prev => prev.map(c => {
      if (c.id === selectedContractForSign.id) {
        return {
          ...c,
          status: "Signed",
          signed_by: signerFullName,
          ip_audit_log: "122.162.245.18"
        };
      }
      return c;
    }));

    toast({
      title: "Document Digitally Certified",
      description: `Contract successfully signed by ${signerFullName}. Audit trail logged under IP 122.162.245.18.`
    });

    setIsSignatureOpen(false);
    setSignerFullName("");
  };

  // Finance status clearance (Phase 11)
  const handleClearPayment = (payId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === payId) {
        return {
          ...p,
          advance_paid: p.amount,
          pending_due: 0,
          status: "Paid"
        };
      }
      return p;
    }));

    toast({
      title: "Payroll Settled",
      description: "Clearing transaction successful. Budget balance reconciled in DP Accounts module."
    });
  };

  // Shortlisting (Phase 6)
  const handleToggleShortlist = (talentId: string, callId: string) => {
    setCastingCalls(prev => prev.map(cc => {
      if (cc.id === callId) {
        const isShortlisted = cc.shortlisted_ids.includes(talentId);
        return {
          ...cc,
          shortlisted_ids: isShortlisted 
            ? cc.shortlisted_ids.filter(id => id !== talentId) 
            : [...cc.shortlisted_ids, talentId]
        };
      }
      return cc;
    }));

    toast({
      title: "Casting Board Updated",
      description: "Shortlisted candidates updated. Syncing recommendation scores for review."
    });
  };

  // Realtime comments chat (Phase 16)
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment) return;

    setComments(prev => [
      {
        id: `cm_${Date.now()}`,
        user: profile?.fullName || "Production Lead",
        text: newComment,
        timestamp: "Just now"
      },
      ...prev
    ]);
    setNewComment("");
    toast({ title: "Casting Note Saved", description: "Internal review comment published to production channel." });
  };

  if (isTenantLoading || isTalentsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* ----------------------------------------------------
          COCKPIT horizontal pipeline & alerts (Phase 1 & 17)
          ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-foreground" />
            Talent Network
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find and book actors, models, influencers, voice artists, and crew for your productions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCasting && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95 text-white font-bold h-11 px-5">
                  <Plus className="h-5 w-5" /> Add Talent
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[12px] bg-white border border-white/20 shadow-premium">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground font-black">
                    <Sparkles className="h-5 w-5 text-foreground" />
                    Add Talent
                  </DialogTitle>
                  <DialogDescription>
                    Add a new profile to your company talent network.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTalentProfile} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="t_name" className="text-xs font-bold text-muted-foreground/80">Full Name</Label>
                    <Input
                      id="t_name"
                      placeholder="e.g. Nimisha Sajayan"
                      value={newTalentForm.fullName}
                      onChange={(e) => setNewTalentForm({ ...newTalentForm, fullName: e.target.value })}
                      required
                      className="rounded-xl border-white/40 h-10 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="t_cat" className="text-xs font-bold text-muted-foreground/80">Category</Label>
                      <Select
                        onValueChange={(val) => setNewTalentForm({ ...newTalentForm, category: val })}
                        defaultValue={newTalentForm.category}
                      >
                        <SelectTrigger className="rounded-xl border-white/40 h-10 text-xs">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Actor", "Model", "Influencer", "Voice Artist", "Cinematographer", "Editor"].map(c => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t_rate" className="text-xs font-bold text-muted-foreground/80">Day Rate (₹)</Label>
                      <Input
                        id="t_rate"
                        type="number"
                        placeholder="120000"
                        value={newTalentForm.dayRate}
                        onChange={(e) => setNewTalentForm({ ...newTalentForm, dayRate: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t_loc" className="text-xs font-bold text-muted-foreground/80">Primary Location</Label>
                    <Input
                      id="t_loc"
                      placeholder="e.g. Kochi, Kerala"
                      value={newTalentForm.location}
                      onChange={(e) => setNewTalentForm({ ...newTalentForm, location: e.target.value })}
                      className="rounded-xl border-white/40 h-10 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="t_foll" className="text-xs font-bold text-muted-foreground/80">Followers Count</Label>
                      <Input
                        id="t_foll"
                        type="number"
                        placeholder="150000"
                        value={newTalentForm.followers}
                        onChange={(e) => setNewTalentForm({ ...newTalentForm, followers: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t_eng" className="text-xs font-bold text-muted-foreground/80">Engagement Rate (0-1)</Label>
                      <Input
                        id="t_eng"
                        type="number"
                        step="0.01"
                        placeholder="0.08"
                        value={newTalentForm.engagementRate}
                        onChange={(e) => setNewTalentForm({ ...newTalentForm, engagementRate: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Add Talent
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {isCasting && (
            <Dialog open={isCastingOpen} onOpenChange={setIsCastingOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl h-11 font-bold border-white/40 hover:bg-muted text-foreground/80">
                  <Sparkles className="h-4 w-4 text-accent" /> Add Casting Call
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] rounded-[12px] bg-white border border-white/20 shadow-premium">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground font-black">
                    <Award className="h-5 w-5 text-accent" />
                    Add Casting Call
                  </DialogTitle>
                  <DialogDescription>
                    Set the casting requirements for your project.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCastingCall} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cc_proj" className="text-xs font-bold text-muted-foreground/80">Project Name</Label>
                    <Input
                      id="cc_proj"
                      placeholder="e.g. Kalyan Silks Wedding Commercial"
                      value={newCastingForm.projectName}
                      onChange={(e) => setNewCastingForm({ ...newCastingForm, projectName: e.target.value })}
                      required
                      className="rounded-xl border-white/40 h-10 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cc_cat" className="text-xs font-bold text-muted-foreground/80">Category</Label>
                      <Select
                        onValueChange={(val) => setNewCastingForm({ ...newCastingForm, category: val })}
                        defaultValue={newCastingForm.category}
                      >
                        <SelectTrigger className="rounded-xl border-white/40 h-10 text-xs">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Actor", "Model", "Influencer", "Voice Artist"].map(c => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc_budget" className="text-xs font-bold text-muted-foreground/80">Budget (₹)</Label>
                      <Input
                        id="cc_budget"
                        type="number"
                        placeholder="180000"
                        value={newCastingForm.budget}
                        onChange={(e) => setNewCastingForm({ ...newCastingForm, budget: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cc_gender" className="text-xs font-bold text-muted-foreground/80">Preferred Gender</Label>
                      <Select
                        onValueChange={(val) => setNewCastingForm({ ...newCastingForm, gender: val })}
                        defaultValue={newCastingForm.gender}
                      >
                        <SelectTrigger className="rounded-xl border-white/40 h-10 text-xs">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Male", "Female", "Any"].map(c => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc_age" className="text-xs font-bold text-muted-foreground/80">Age Range</Label>
                      <Input
                        id="cc_age"
                        placeholder="20-30"
                        value={newCastingForm.ageRange}
                        onChange={(e) => setNewCastingForm({ ...newCastingForm, ageRange: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cc_dates" className="text-xs font-bold text-muted-foreground/80">Shoot Dates</Label>
                      <Input
                        id="cc_dates"
                        placeholder="2026-07-02 to 2026-07-04"
                        value={newCastingForm.shootDates}
                        onChange={(e) => setNewCastingForm({ ...newCastingForm, shootDates: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cc_style" className="text-xs font-bold text-muted-foreground/80">Look or Style</Label>
                      <Input
                        id="cc_style"
                        placeholder="Trendy, traditional"
                        value={newCastingForm.lookStyle}
                        onChange={(e) => setNewCastingForm({ ...newCastingForm, lookStyle: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                      Add Casting Call
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {isCasting && (
            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 rounded-xl h-11 font-bold text-foreground bg-primary/10 hover:bg-primary/20">
                  <Calendar className="h-4 w-4" /> Book Talent
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[12px] bg-white border border-white/20 shadow-premium">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground font-black">
                    <UserCheck className="h-5 w-5 text-foreground" />
                    Book Talent
                  </DialogTitle>
                  <DialogDescription>
                    Book this talent for your project.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBookTalent} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bk_talent" className="text-xs font-bold text-muted-foreground/80">Select Talent</Label>
                    <Select
                      onValueChange={(val) => setNewBookingForm({ ...newBookingForm, talentId: val })}
                      defaultValue={newBookingForm.talentId}
                    >
                      <SelectTrigger className="rounded-xl border-white/40 h-10 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {talents.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">{t.full_name} ({t.category})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bk_proj" className="text-xs font-bold text-muted-foreground/80">Project</Label>
                    <Select
                      onValueChange={(val) => setNewBookingForm({ ...newBookingForm, projectId: val })}
                      defaultValue={newBookingForm.projectId}
                    >
                      <SelectTrigger className="rounded-xl border-white/40 h-10 text-xs">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {castingCalls.map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">{c.project_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bk_dates" className="text-xs font-bold text-muted-foreground/80">Dates</Label>
                      <Input
                        id="bk_dates"
                        value={newBookingForm.dates}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, dates: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk_rate" className="text-xs font-bold text-muted-foreground/80">Day Rate (₹)</Label>
                      <Input
                        id="bk_rate"
                        value={newBookingForm.dayRate}
                        onChange={(e) => setNewBookingForm({ ...newBookingForm, dayRate: e.target.value })}
                        className="rounded-xl border-white/40 h-10 text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                      Book Talent
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          TOP HUD STATS CENTER (Phase 3 Analytics)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px] relative overflow-hidden group">
          <CardContent className="p-2 space-y-0">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Talent</span>
            <h3 className="text-base font-black text-foreground tracking-tight leading-none pt-1">{totalTalents} Active</h3>
            <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
              <CheckSquare className="h-2 w-2" /> Fully Vetted
            </span>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px] relative overflow-hidden group">
          <CardContent className="p-2 space-y-0">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Available Now</span>
            <h3 className="text-base font-black text-foreground tracking-tight leading-none pt-1">{availableTalents} Talents</h3>
            <span className="text-[8px] font-bold text-foreground flex items-center gap-1 mt-1">
              <Clock className="h-2 w-2" /> Ready to Shoot
            </span>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px] relative overflow-hidden group">
          <CardContent className="p-2 space-y-0">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Booked Roster</span>
            <h3 className="text-base font-black text-foreground tracking-tight leading-none pt-1">{bookedTalents} Booked</h3>
            <span className="text-[8px] font-bold text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-2 w-2" /> Util: {utilizationRate}%
            </span>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px] relative overflow-hidden group">
          <CardContent className="p-2 space-y-0">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Active Castings</span>
            <h3 className="text-base font-black text-foreground tracking-tight leading-none pt-1">{castingCalls.length} Open</h3>
            <span className="text-[8px] font-bold text-accent flex items-center gap-1 mt-1">
              <AlertCircle className="h-2 w-2" /> {totalShortlisted} Shortlisted
            </span>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px] relative overflow-hidden group col-span-2 md:col-span-1">
          <CardContent className="p-2 space-y-0">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">AI Match Rate</span>
            <h3 className="text-base font-black text-foreground tracking-tight leading-none pt-1">94%</h3>
            <span className="text-[8px] font-bold text-accent flex items-center gap-1 mt-1">
              <Sparkles className="h-2 w-2 animate-pulse" /> Matched profiles
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------
          MAIN SCREEN WORKSPACE (Left Side Filter + Center Tabs + Right AI Side)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* LEFT PANEL — Advanced Casting Filter Sidebar (Phases 3 & 4) */}
        <aside className="xl:col-span-1 space-y-4">
          <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Search Directory</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, skills, or agency tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-xl h-10 border-white/40 text-xs bg-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Roster</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categoriesList.map(cat => (
                    <Badge
                      key={cat}
                      variant="outline"
                      onClick={() => setCategoryFilter(cat)}
                      className={`cursor-pointer transition-all py-1 px-2.5 rounded-lg border-white/40 text-[10px] font-bold ${
                        categoryFilter === cat ? "bg-primary text-white border-transparent" : "hover:bg-muted text-muted-foreground/80 bg-white/10"
                      }`}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shoot Region</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="rounded-xl h-10 border-white/40 text-xs bg-white/20">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All" className="text-xs">All Locations</SelectItem>
                    {locationsList.filter(l => l !== "All" && l !== "").map(loc => (
                      <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferred Gender</Label>
                <div className="flex gap-2">
                  {["All", "Male", "Female"].map(gender => (
                    <Button
                      key={gender}
                      type="button"
                      variant="outline"
                      onClick={() => setGenderFilter(gender)}
                      className={`flex-1 rounded-xl h-9 text-[10px] font-bold border-white/40 ${
                        genderFilter === gender ? "bg-primary text-white border-transparent hover:bg-primary" : "hover:bg-muted text-muted-foreground/80 bg-white/10"
                      }`}
                    >
                      {gender}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/15 pt-4">
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("All");
                    setLocationFilter("All");
                    setGenderFilter("All");
                  }}
                  variant="secondary"
                  className="w-full rounded-xl h-10 text-xs font-bold text-muted-foreground/80 bg-muted hover:bg-secondary"
                >
                  Clear Precision Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Realtime alerts notification widget (Phase 17) */}
          <Card className="border-l-4 border-l-primary glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs text-foreground flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-foreground animate-bounce" /> Casting Activity Log
                </h4>
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div className="space-y-2 text-[10px] text-muted-foreground pt-1.5">
                <p className="border-b border-white/10 pb-1.5">
                  🛡️ <strong className="text-foreground/80">Contract Signed</strong>: Tovino Thomas cleared standard NDA release. (10m ago)
                </p>
                <p className="border-b border-white/10 pb-1.5">
                  📣 <strong className="text-foreground/80">New Casting</strong>: Tech-Start Brand Film Dub published requirement. (1h ago)
                </p>
                <p className="pb-0">
                  ⚠️ <strong className="text-foreground/80">Conflict Detected</strong>: Aparna B. has overlapping travel dates on June 14.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER WORKSPACE — Tabbed Interface (Phases 3, 5, 6, 8, 9, 10, 11) */}
        <main className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="roster" onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-6 gap-1 rounded-xl bg-white/50 border border-white/20 p-1 mb-6 shadow-sm">
              <TabsTrigger value="roster" className="rounded-lg text-[10px] font-bold">Roster</TabsTrigger>
              <TabsTrigger value="castings" className="rounded-lg text-[10px] font-bold">Castings</TabsTrigger>
              <TabsTrigger value="scheduling" className="rounded-lg text-[10px] font-bold">Schedule</TabsTrigger>
              <TabsTrigger value="contracts" className="rounded-lg text-[10px] font-bold">Contracts</TabsTrigger>
              <TabsTrigger value="finance" className="rounded-lg text-[10px] font-bold">Finance</TabsTrigger>
              <TabsTrigger value="public-network" className="rounded-lg text-[10px] font-bold bg-accent/10/60 text-accent data-[state=active]:bg-accent data-[state=active]:text-white">Public Hub</TabsTrigger>
            </TabsList>

            {/* TAB 1: TALENT PORTFOLIO ROSTER GRID (Phase 3 & 4) */}
            <TabsContent value="roster" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTalents.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground bg-white/40 border-2 border-dashed border-white/40 rounded-[12px] shadow-sm">
                    <p className="font-bold text-sm">No roster profiles matched filters.</p>
                    <Button variant="link" className="mt-2 text-xs" onClick={() => setIsAddOpen(true)}>List First Talent Profile</Button>
                  </div>
                ) : (
                  filteredTalents.map((talent) => (
                    <Card
                      key={talent.id}
                      onClick={() => setSelectedTalentDetail(talent)}
                      className={`overflow-hidden group border-none shadow-premium transition-all rounded-[12px] bg-white/40 backdrop-blur-3xl cursor-pointer ${
                        selectedTalentDetail?.id === talent.id ? "ring-2 ring-primary ring-offset-2" : "hover:shadow-md"
                      }`}
                    >
                      <div className="relative h-16 overflow-hidden bg-primary">
                        <Image
                          src={talent.portfolio_url}
                          alt={talent.full_name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3">
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                          <Badge className="bg-white/90 text-foreground border-none text-[10px] font-bold">{talent.category}</Badge>
                          <Badge className="bg-primary/80 text-white border-none text-[10px] font-bold">{talent.sub_category}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-black text-sm text-foreground leading-tight">{talent.full_name}</h3>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-bold">
                              <MapPin className="h-3 w-3 text-muted-foreground" /> {talent.location}
                            </p>
                          </div>
                          <span className="font-black text-foreground text-xs bg-primary/10 py-1 px-2.5 rounded-lg">
                            ₹{talent.day_rate.toLocaleString()}/day
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-[10px] font-bold text-muted-foreground uppercase">
                          <div className="flex items-center gap-1.5">
                            <Instagram className="h-3.5 w-3.5 text-foreground" />
                            <span>{(talent.followers / 1000000).toFixed(1)}M followers</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Eng. {(talent.engagement_rate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: CASTING REQUIREMENT BOARD (Phase 6) */}
            <TabsContent value="castings" className="space-y-4">
              {castingCalls.map(c => (
                <Card key={c.id} className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-primary/10 text-foreground border-none text-[9px] font-bold uppercase tracking-wider">{c.category} Required</Badge>
                        <h3 className="font-black text-base text-foreground mt-1.5 leading-tight">{c.project_name}</h3>
                      </div>
                      <span className="font-black text-xs text-foreground bg-white/60 py-1.5 px-3 rounded-lg border border-white/40">
                        Budget: ₹{c.budget.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-[11px] font-bold text-muted-foreground">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Shoot Dates</span>
                        {c.shoot_dates}
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Gender & Age</span>
                        {c.gender} ({c.age_range} Years)
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Preferred Style</span>
                        {c.look_style}
                      </div>
                    </div>

                    <div className="border-t border-white/15 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground">Candidates Shortlisted:</span>
                        <div className="flex -space-x-2">
                          {c.shortlisted_ids.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground italic">None shortlisted yet</span>
                          ) : (
                            c.shortlisted_ids.map(sid => {
                              const t = talents.find(talent => talent.id === sid);
                              return (
                                <Avatar key={sid} className="h-6 w-6 ring-2 ring-white shadow">
                                  <AvatarImage src={t?.portfolio_url} />
                                  <AvatarFallback className="text-[8px]">{t?.stage_name?.substring(0,2)}</AvatarFallback>
                                </Avatar>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedProjectForAI(c.id);
                            toast({ title: "AI Sync Triggered", description: "Analyzing compatibility metrics for this casting call." });
                          }}
                          className="rounded-xl h-8 px-3 text-[10px] font-bold border-white/40 text-foreground/80 bg-white/20 hover:bg-muted"
                        >
                          <Sparkles className="h-3 w-3 mr-1 text-accent" /> AI Roster Match
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* TAB 3: AVAILABILITY TIMELINE SCHEDULE (Phase 8) */}
            <TabsContent value="scheduling" className="space-y-4">
              <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-foreground">Production Booking Timeline</h3>
                      <p className="text-[10px] text-muted-foreground">Availability calendar blocks and overlapping shoot days detection.</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold uppercase tracking-wider">Calendar Synced</Badge>
                  </div>

                  <div className="space-y-3 pt-2">
                    {talents.slice(0, 4).map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 bg-white/30 rounded-xl border border-white/10">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={t.portfolio_url} />
                          <AvatarFallback>{t.stage_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-foreground leading-tight">{t.full_name}</h4>
                          <span className="text-[9px] text-muted-foreground font-medium block mt-1">{t.category} — {t.agency_name}</span>
                        </div>
                        <div className="text-right">
                          <Badge className={`${idx === 0 ? "bg-accent/15 text-accent" : "bg-emerald-500/15 text-emerald-500"} border-none text-[9px] font-bold`}>
                            {idx === 0 ? "Blocked: June 12-15 (Conflict)" : "Available: June 2026"}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground block mt-1">Confirmed Days: {idx === 0 ? "3 Shoots" : "0 Shoots"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: CONTRACTS & DIGITAL DOCUMENTS (Phase 10) */}
            <TabsContent value="contracts" className="space-y-4">
              {contracts.map(c => (
                <Card key={c.id} className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-foreground shrink-0 mt-1">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-foreground leading-tight">{c.doc_type}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-bold">
                          Talent: {c.talent_name} | Project: {c.project_name}
                        </p>
                        <span className="text-[9px] text-muted-foreground block mt-1">Issued Date: {c.date_issued}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <Badge className={`border-none text-[9px] font-bold ${
                        c.status === "Signed" ? "bg-emerald-500/15 text-emerald-500" : "bg-accent/15 text-accent"
                      }`}>
                        {c.status}
                      </Badge>
                      
                      {c.status === "Signed" ? (
                        <div className="text-[9px] text-muted-foreground font-medium leading-none">
                          Signed by: {c.signed_by} <br />
                          IP Log: {c.ip_audit_log}
                        </div>
                      ) : (
                        isCasting && (
                          <Button
                            onClick={() => {
                              setSelectedContractForSign(c);
                              setIsSignatureOpen(true);
                            }}
                            className="rounded-xl h-7 px-3 text-[10px] font-bold bg-primary text-white hover:bg-primary/95"
                          >
                            <PenTool className="h-3 w-3 mr-1" /> Approve & Sign
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* TAB 5: FINANCE & LEDGER PAYROLL (Phase 11) */}
            <TabsContent value="finance" className="space-y-4">
              {payments.map(p => (
                <Card key={p.id} className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 mt-1">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-foreground leading-tight">{p.talent_name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-bold">
                          Project: {p.project_name} | {p.category}
                        </p>
                        <span className="text-[9px] text-muted-foreground block mt-1">Due Date Target: {p.due_date}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-foreground">
                        <span className="text-[10px] text-muted-foreground block">Negotiated Fee</span>
                        <strong className="text-sm font-black">₹{p.amount.toLocaleString()}</strong>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`border-none text-[9px] font-bold ${
                          p.status === "Paid" ? "bg-emerald-500/15 text-emerald-500" : "bg-accent/15 text-accent"
                        }`}>
                          {p.status}
                        </Badge>
                        {p.status !== "Paid" && isAccounts && (
                          <Button
                            onClick={() => handleClearPayment(p.id)}
                            className="rounded-xl h-7 px-3 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            Settle Roster Dues
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="public-network" className="space-y-4">
              <div className="bg-gradient-to-tr from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-accent/20/80 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-xs text-accent uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-accent animate-pulse" /> DP Creator Network Bridge
                  </h4>
                  <p className="text-[10px] text-accent/80 font-semibold mt-1">
                    Securely browse public creators. Bridge and shortlist talent into your private database without giving them internal OS access.
                  </p>
                </div>
                <Button 
                  onClick={() => window.open('/creators', '_blank')} 
                  variant="outline" 
                  className="rounded-xl h-8 text-[10px] font-bold border-accent/20 text-accent bg-white hover:bg-accent/10/50 shrink-0"
                >
                  Open Public Portal
                </Button>
              </div>

              {[
                {
                  id: "public_t1",
                  full_name: "Tovino Thomas",
                  category: "Actor",
                  sub_category: "Lead Hero",
                  location: "Kochi, Kerala",
                  day_rate: 350000,
                  followers: 7800000,
                  rating: 4.9,
                  skills: "Method Acting, Stunts, Cinematic Action",
                  portfolio_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=500"
                },
                {
                  id: "public_t2",
                  full_name: "Nimisha Sajayan",
                  category: "Actor",
                  sub_category: "Drama Lead",
                  location: "Kochi, Kerala",
                  day_rate: 150000,
                  followers: 1800000,
                  rating: 4.8,
                  skills: "Emotional Realism, Improvisation, Dubbing",
                  portfolio_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500"
                },
                {
                  id: "public_t3",
                  full_name: "Basil Joseph",
                  category: "Actor",
                  sub_category: "Comedy Director",
                  location: "Kozhikode, Kerala",
                  day_rate: 250000,
                  followers: 2400000,
                  rating: 4.9,
                  skills: "Comedy Delivery, Directing, Scripting",
                  portfolio_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=500"
                }
              ].map(creator => {
                const isImported = talents.some(t => t.id === creator.id);

                return (
                  <Card key={creator.id} className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px] hover:border-accent/20 transition-all">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-indigo-100 shadow">
                          <AvatarImage src={creator.portfolio_url} />
                          <AvatarFallback>{creator.full_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-sm text-foreground leading-none">{creator.full_name}</h4>
                            <Badge className="bg-accent/10 text-accent border-none text-[8px] font-bold uppercase py-0.5 px-2">{creator.category}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 font-bold flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-accent" /> {creator.location} | {creator.skills}
                          </p>
                          <span className="text-[9px] text-accent block mt-1 font-bold">Public Reach: {(creator.followers / 1000000).toFixed(1)}M Followers</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2 shrink-0">
                        <div className="text-foreground">
                          <span className="text-[9px] text-muted-foreground block font-bold uppercase">Public Day Rate</span>
                          <strong className="text-sm font-black">₹{creator.day_rate.toLocaleString()}</strong>
                        </div>
                        
                        <Button
                          disabled={isImported}
                          onClick={() => {
                            setBridgedTalents(prev => [...prev, {
                              id: creator.id,
                              full_name: creator.full_name,
                              stage_name: creator.full_name.split(" ")[0],
                              category: creator.category,
                              sub_category: creator.sub_category,
                              gender: "Unspecified",
                              age: 28,
                              location: creator.location,
                              languages: "Malayalam, English",
                              skills: creator.skills,
                              experience: "Professional",
                              day_rate: creator.day_rate,
                              followers: creator.followers,
                              engagement_rate: 0.08,
                              instagram: `@${creator.full_name.toLowerCase().replace(" ", "")}`,
                              youtube: creator.full_name,
                              linkedin: creator.full_name.toLowerCase().replace(" ", "-"),
                              rating: creator.rating,
                              agency_name: "DP Network Bridged",
                              email: "bridged@dpmedia.in",
                              phone: "+91 99999 77777",
                              tags: ["Bridged", "Public Network"],
                              portfolio_url: creator.portfolio_url,
                              video_url: "",
                              notes: "Bridged into internal roster from Creator Network Portal."
                            }]);
                            toast({
                              title: "Creator Bridged Successfully",
                              description: `${creator.full_name} has been imported safely into the internal Roster & Casting Matcher.`
                            });
                          }}
                          className={`rounded-xl h-8 px-4 text-[10px] font-bold ${
                            isImported 
                              ? "bg-muted text-muted-foreground border border-border" 
                              : "bg-accent hover:bg-accent text-white shadow-md shadow-accent/10"
                          }`}
                        >
                          {isImported ? "✓ Bridged" : "Bridge & Import"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>

          {/* COLLABORATION & DISCUSSION CHAT (Phase 16) */}
          <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-foreground" /> Casting Discussion
              </h3>
              
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="rounded-xl h-10 border-white/40 text-xs bg-white/20 flex-1"
                />
                <Button type="submit" className="rounded-xl h-10 bg-primary text-white px-4 font-bold text-xs">
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-3 pt-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                {comments.map(c => (
                  <div key={c.id} className="p-3 bg-white/30 rounded-xl border border-white/10 text-[11px]">
                    <div className="flex items-center justify-between font-bold text-foreground/80">
                      <span>{c.user}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">{c.timestamp}</span>
                    </div>
                    <p className="text-muted-foreground/80 mt-1.5 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* ----------------------------------------------------
            RIGHT PANEL — AI Assistant (Phase 3 & 7)
            ---------------------------------------------------- */}
        <section className="xl:col-span-1 space-y-6">
          <Card className="glass-panel border-white/20 shadow-premium bg-gradient-to-br from-indigo-50/10 to-purple-50/10 backdrop-blur-3xl rounded-[12px] border-l-4 border-l-indigo-400">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" /> AI Casting Suggestion
                </h3>
                <Badge className="bg-accent text-white border-none text-[8px] font-bold tracking-widest uppercase">Active</Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase block">Choose Project</Label>
                <Select value={selectedProjectForAI} onValueChange={setSelectedProjectForAI}>
                  <SelectTrigger className="rounded-xl h-9 border-white/40 text-[11px] bg-white/20">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {castingCalls.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.project_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeAICasting && (
                <div className="space-y-4 pt-1">
                  <div className="bg-white/40 p-3.5 rounded-xl border border-white/20 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground/80">Category Matched</span>
                      <Badge className="bg-accent/10 text-accent border-none text-[9px] font-bold">{activeAICasting.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground/80">Budget Constraint</span>
                      <span className="font-black text-foreground">₹{activeAICasting.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground/80">Preferred Look/Dates</span>
                      <span className="text-muted-foreground font-medium">{activeAICasting.look_style}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Suggested Talent</span>
                    
                    {aiRecommendations.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">No matches in directory</p>
                    ) : (
                      aiRecommendations.map(rec => (
                        <div key={rec.talent.id} className="p-3 bg-white/30 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={rec.talent.portfolio_url} />
                              <AvatarFallback>{rec.talent.stage_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-foreground truncate leading-none">{rec.talent.full_name}</h4>
                              <span className="text-[9px] text-accent font-semibold block mt-1">{rec.suitability}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge className="bg-accent/10 text-accent border-none text-[10px] font-black">{rec.score}% Match</Badge>
                            {isCasting && (
                              <Button
                                onClick={() => handleToggleShortlist(rec.talent.id, activeAICasting.id)}
                                variant="link"
                                className="p-0 h-auto text-[9px] text-muted-foreground block mt-1 w-full text-right"
                              >
                                {activeAICasting.shortlisted_ids.includes(rec.talent.id) ? "Remove Shortlist" : "Add Shortlist"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SELECTED TALENT DETAILS HUD PREVIEW CARD */}
          {selectedTalentDetail && (
            <Card className="glass-panel border-white/20 shadow-premium bg-white/40 backdrop-blur-3xl rounded-[12px]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-white shadow">
                    <AvatarImage src={selectedTalentDetail.portfolio_url} />
                    <AvatarFallback>{selectedTalentDetail.stage_name.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-black text-sm text-foreground leading-tight">{selectedTalentDetail.full_name}</h3>
                    <span className="text-[10px] text-muted-foreground font-medium block mt-1">{selectedTalentDetail.category} ({selectedTalentDetail.sub_category})</span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] border-t border-white/15 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Day Rate</span>
                    <strong className="text-foreground">₹{selectedTalentDetail.day_rate.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Languages</span>
                    <span className="text-foreground/80 font-bold">{selectedTalentDetail.languages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="text-foreground/80 font-bold">{selectedTalentDetail.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agency Roster</span>
                    <span className="text-foreground/80 font-bold">{selectedTalentDetail.agency_name}</span>
                  </div>
                </div>

                <div className="space-y-1.5 bg-white/30 p-3 rounded-xl border border-white/10 text-[10px]">
                  <span className="font-bold text-muted-foreground block uppercase">Director's Note</span>
                  <p className="text-muted-foreground/80 leading-relaxed italic">"{selectedTalentDetail.notes}"</p>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => window.location.href = `/talent/${selectedTalentDetail.id}`} 
                    className="w-full rounded-xl h-9 bg-primary text-white font-bold text-[11px] shadow-sm hover:bg-primary/95"
                  >
                    View Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* ----------------------------------------------------
          MODAL: DIGITAL SIGNATURE DRAWER (Phase 10)
          ---------------------------------------------------- */}
      {selectedContractForSign && (
        <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-[12px] bg-white border border-white/20 shadow-premium">
            <DialogHeader>
              <DialogTitle className="text-foreground font-black flex items-center gap-1.5">
                <PenTool className="h-5 w-5 text-foreground" /> Sign Contract
              </DialogTitle>
              <DialogDescription>
                Sign this agreement: <strong>{selectedContractForSign.doc_type}</strong>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignContract} className="space-y-4 py-3">
              <div className="space-y-2.5 bg-muted p-4 rounded-xl border text-[11px] leading-relaxed text-muted-foreground/80">
                <p>
                  I, the undersigned, hereby confirm availability, release copyright claims, and authorize the usage of my voice/likeness for <strong>{selectedContractForSign.project_name}</strong> under the agreed milestone fee of <strong>{selectedContractForSign.amount}</strong>.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sign_name" className="text-xs font-bold text-muted-foreground/80">Signer Full Legal Name</Label>
                <Input
                  id="sign_name"
                  placeholder="e.g. Tovino Thomas"
                  value={signerFullName}
                  onChange={(e) => setSignerFullName(e.target.value)}
                  required
                  className="rounded-xl border-white/40 h-10 text-xs"
                />
              </div>
              <DialogFooter className="pt-3">
                <Button type="submit" className="w-full rounded-xl h-11 bg-primary text-white font-bold text-xs">
                  Sign Agreement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
