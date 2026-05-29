"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, ArrowRight, UserCheck, ShieldCheck, Sparkles, 
  MapPin, Camera, DollarSign, Globe, CheckCircle2, ChevronRight,
  Flame, Lock, HelpCircle, Layers, Sliders, Users, Star,
  Mail, Phone, Laptop, Check, Upload, Calendar, PlayCircle, Eye, EyeOff,
  Shield, Award, Sparkle, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";

// Available Categories
const CATEGORY_OPTIONS = [
  "Actor", "Anchor", "Influencer", "Model", "DOP", "Editor", 
  "Photographer", "Voice Artist", "Stylist", "Motion Designer", 
  "AI Creator", "Freelancer", "Agency"
];

export default function TalentSignupFlow() {
  const { toast } = useToast();
  
  // Wizard steps: 0 (Welcome), 1 (Basic Details), 2 (Profile Identity), 3 (Portfolio), 4 (Pricing/Availability), 5 (Verification)
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  // Fields state
  const [formData, setFormData] = useState({
    // Step 1: Basic
    fullName: "",
    emailAddress: "",
    phoneNumber: "",
    password: "",
    city: "Kochi",
    language: "English",
    selectedCategories: [] as string[],

    // Step 2: Identity
    avatarUrl: "",
    bannerUrl: "",
    bio: "",
    experienceLevel: "Mid-level",
    languagesSpoken: "Malayalam, English",
    instagramLink: "",
    youtubeLink: "",
    portfolioWebsite: "",

    // Step 3: Portfolio
    uploadedItems: [] as { name: string; type: string; progress: number; compressed: boolean; previewUrl: string }[],

    // Step 4: Preferences
    dayRate: "150000",
    hourlyRate: "20000",
    projectMinimum: "50000",
    travelAvailability: true,
    availableCities: "Kochi, Bangalore, Mumbai",
    remoteWork: true,
    urgentBooking: true,
    calendarAvailability: {} as Record<string, "available" | "booked" | "unavailable">,

    // Step 5: Verification
    verifiedId: false,
    verifiedInstagram: false,
    verifiedPortfolio: false,
    verifiedAgency: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Category toggle
  const toggleCategory = (cat: string) => {
    setFormData(prev => {
      const selected = prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat];
      return { ...prev, selectedCategories: selected };
    });
  };

  // Availability calendar date selector mock
  const toggleCalendarDate = (day: string) => {
    setFormData(prev => {
      const current = prev.calendarAvailability[day] || "available";
      const next: "available" | "booked" | "unavailable" = 
        current === "available" ? "booked" : current === "booked" ? "unavailable" : "available";
      return {
        ...prev,
        calendarAvailability: { ...prev.calendarAvailability, [day]: next }
      };
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.emailAddress || !formData.password) {
        toast({
          title: "Missing Fields",
          description: "Please fill out all basic account fields to proceed.",
          variant: "destructive"
        });
        return;
      }
      if (formData.selectedCategories.length === 0) {
        toast({
          title: "Category Selection Required",
          description: "Please select at least one role category to proceed.",
          variant: "destructive"
        });
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Mock upload action
  const triggerMockUpload = () => {
    setUploadingMedia(true);
    const mockFile = {
      name: "Showreel_2026_QuickCut.mp4",
      type: "video/mp4",
      progress: 0,
      compressed: false,
      previewUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e330120d9e5e783ae91620d436e&profile_id=139&oauth2_token_id=57447761"
    };

    setFormData(prev => ({
      ...prev,
      uploadedItems: [...prev.uploadedItems, mockFile]
    }));

    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 20;
      setFormData(prev => ({
        ...prev,
        uploadedItems: prev.uploadedItems.map(item => 
          item.name === mockFile.name ? { ...item, progress: progressVal } : item
        )
      }));

      if (progressVal >= 100) {
        clearInterval(interval);
        setUploadingMedia(false);
        setFormData(prev => ({
          ...prev,
          uploadedItems: prev.uploadedItems.map(item => 
            item.name === mockFile.name ? { ...item, compressed: true } : item
          )
        }));
        toast({
          title: "Upload Successful!",
          description: "Video transcoded and compressed for mobile preview automatically."
        });
      }
    }, 400);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: formData.emailAddress,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: 'TALENT'
        }
      }
    });

    if (error) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not register your profile at this time.",
      });
      return;
    }

    // Store in local storage for sandbox preservation/hydration
    localStorage.setItem("dp_talent_onboarded", JSON.stringify(formData));

    toast({
      title: "Profile Live!",
      description: `Welcome aboard, ${formData.fullName}! Redirecting to your Talent Dashboard...`,
    });

    setTimeout(() => {
      window.location.href = "/talent/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col justify-between selection:bg-destructive selection:text-white">
      
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-destructive/10 rounded-xl flex items-center justify-center font-black text-sm text-destructive shadow-sm shrink-0">DP</div>
            <div>
              <span className="font-bold text-base tracking-tight block text-foreground">Creator Network</span>
              <span className="text-[9px] font-bold text-destructive uppercase tracking-widest leading-none">Onboarding Lifecycle</span>
            </div>
          </div>

          <a href="/creators">
            <Button variant="ghost" className="text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-full h-9 px-4 border border-border shadow-sm bg-white transition">
              Exit
            </Button>
          </a>
        </div>
      </header>

      {/* Main wizard layout */}
      <main className="max-w-xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center w-full">
        
        {/* Progress Tracker (Only visible during signup steps 1-5) */}
        {step > 0 && (
          <div className="flex items-center justify-between text-[10px] mb-8 text-muted-foreground font-bold uppercase tracking-widest px-1">
            <span className={step >= 1 ? "text-destructive font-bold" : ""}>1. Details</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 2 ? "text-destructive font-bold" : ""}>2. Setup</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 3 ? "text-destructive font-bold" : ""}>3. Portfolio</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 4 ? "text-destructive font-bold" : ""}>4. Pricing</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={step >= 5 ? "text-destructive font-bold" : ""}>5. Trust</span>
          </div>
        )}

        <Card className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-8">

            {/* PHASE 1 — TALENT SIGNUP WELCOME FLOW */}
            {step === 0 && (
              <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center shadow-sm">
                    <Sparkle className="h-8 w-8 text-destructive animate-pulse" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
                    Create Your Talent Profile
                  </h1>
                  <p className="text-sm text-muted-foreground font-bold leading-relaxed max-w-sm mx-auto">
                    Show your work, get discovered, and receive booking requests.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setStep(1)} 
                    className="w-full bg-destructive hover:bg-destructive text-white font-bold h-12 rounded-full text-xs flex items-center justify-center shadow-sm transition"
                  >
                    Continue with Email
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast({ title: "Google Auth Initialized", description: "Connecting securely to identity gateway..." });
                      setStep(1);
                    }} 
                    className="w-full border-border bg-white hover:bg-muted text-foreground/80 font-bold h-12 rounded-full text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                      <path fill="#FF3D00" d="M6.306 14.691c-1.959 3.238-3.029 6.961-3.029 10.959C3.277 30.638 4.347 34.361 6.306 37.601l5.657-5.657C10.854 29.803 10 27.025 10 24s.854-5.803 1.964-8.148l-5.658-5.161z"></path>
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657C30.012 35.636 27.211 37 24 37c-3.743 0-6.945-1.936-8.791-4.792l-5.657 5.657C12.012 40.353 17.512 44 24 44z"></path>
                      <path fill="#1976D2" d="M43.611 20.083L43.594 20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.657 5.657C41.289 35.796 44 30.338 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                <div className="pt-4 border-t border-border text-center">
                  <a href="/talent/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition">
                    Already have an account? <span className="text-red-650 hover:underline">Sign In</span>
                  </a>
                </div>
              </div>
            )}

            {/* PHASE 2 — ACCOUNT CREATION (STEP 1) */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-red-650 animate-pulse" /> Basic Details
                  </h2>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                    Set up your basic account details and pick your specialties.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Aparna Balamurali"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="name@company.com"
                      value={formData.emailAddress}
                      onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                      <Input 
                        type="text" 
                        placeholder="+91 98765 43210"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="bg-muted border-border h-10 text-xs rounded-xl pr-10 focus:border-destructive text-foreground font-bold w-full"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Base City</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Kochi"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Language</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. English"
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                  </div>

                  {/* Multiple Categories */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Categories (Select All That Apply)</label>
                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-2 bg-muted border border-border rounded-2xl">
                      {CATEGORY_OPTIONS.map(cat => {
                        const active = formData.selectedCategories.includes(cat);
                        return (
                          <Badge 
                            key={cat} 
                            onClick={() => toggleCategory(cat)}
                            className={`cursor-pointer font-bold text-[9px] py-1 px-3 rounded-full border transition ${
                              active 
                                ? "bg-destructive/10 text-red-650 border-destructive/20 hover:bg-destructive/15" 
                                : "bg-white text-muted-foreground/80 border-border hover:bg-muted"
                            }`}
                          >
                            {cat} {active && "✓"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-4">
                  <Button 
                    type="button" 
                    onClick={() => setStep(0)} 
                    variant="ghost" 
                    className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition px-6"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition px-6"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* PHASE 3 — PROFILE SETUP FLOW (STEP 2) */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Profile Identity</h2>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                    Set up your photos, bio, and visual branding links.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Photo Mocks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Profile Photo Link</label>
                      <Input 
                        type="text" 
                        placeholder="https://image-url.com"
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Cover Banner Link</label>
                      <Input 
                        type="text" 
                        placeholder="https://banner-url.com"
                        value={formData.bannerUrl}
                        onChange={(e) => setFormData({...formData, bannerUrl: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Biography</label>
                      <span className="text-[9px] font-bold text-muted-foreground">"Tell people about your work."</span>
                    </div>
                    <textarea 
                      placeholder="Outline your acting history, client TVC experience, or crew projects..."
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="bg-muted border border-border h-20 text-xs rounded-xl focus:border-destructive text-foreground w-full p-3 resize-none focus:outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Experience Level</label>
                      <select 
                        value={formData.experienceLevel} 
                        onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                        className="bg-muted border border-border h-10 px-3 text-xs rounded-xl focus:border-destructive text-foreground/80 w-full outline-none font-bold animate-none"
                      >
                        <option value="Entry-level">Entry-level</option>
                        <option value="Mid-level">Mid-level</option>
                        <option value="Senior">Senior / 10+ Years</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Languages Spoken</label>
                      <Input 
                        type="text" 
                        placeholder="Malayalam, English, Tamil"
                        value={formData.languagesSpoken}
                        onChange={(e) => setFormData({...formData, languagesSpoken: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Instagram Link</label>
                    <Input 
                      type="text" 
                      placeholder="https://instagram.com/username"
                      value={formData.instagramLink}
                      onChange={(e) => setFormData({...formData, instagramLink: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">YouTube Channel</label>
                      <Input 
                        type="text" 
                        placeholder="https://youtube.com/channel"
                        value={formData.youtubeLink}
                        onChange={(e) => setFormData({...formData, youtubeLink: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Portfolio Website</label>
                      <Input 
                        type="text" 
                        placeholder="https://mywork.com"
                        value={formData.portfolioWebsite}
                        onChange={(e) => setFormData({...formData, portfolioWebsite: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-4">
                  <Button 
                    type="button" 
                    onClick={handleBack} 
                    variant="ghost" 
                    className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition px-6"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition px-6"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* PHASE 4 — PORTFOLIO & REELS (STEP 3) */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Portfolio Upload</h2>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                    Upload showreels, campaign photos, b-roll, or PDFs.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Drag and Drop mockup container */}
                  <div 
                    onClick={triggerMockUpload}
                    className="border-2 border-dashed border-border hover:border-destructive/50 rounded-2xl p-8 text-center cursor-pointer bg-muted transition shadow-sm relative group"
                  >
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3 group-hover:scale-105 transition-transform duration-300" />
                    <span className="font-bold text-xs block text-foreground">Drag & Drop files here</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Supports video reels, photos, and PDF brochures (Max 100MB)</span>
                  </div>

                  {/* Active upload items and progress */}
                  {formData.uploadedItems.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Active Uploads</label>
                      {formData.uploadedItems.map((item, idx) => (
                        <div key={idx} className="bg-muted border border-border rounded-2xl p-4 space-y-2 shadow-sm">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-850 truncate max-w-xs">{item.name}</span>
                            <span className="text-muted-foreground font-bold">{item.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div className="bg-destructive h-full transition-all duration-300" style={{ width: `${item.progress}%` }}></div>
                          </div>
                          {item.compressed && (
                            <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mobile optimization & transcoding completed
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reels preview mock */}
                  <div className="p-4 bg-muted border border-border rounded-2xl text-[10px] text-muted-foreground leading-relaxed font-bold shadow-sm">
                    <Sparkles className="h-4.5 w-4.5 text-red-650 shrink-0 inline mr-1" />
                    <span>Our system automatically compresses and transcodes your video uploads to ensure fast loading on mobile devices.</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-4">
                  <Button 
                    type="button" 
                    onClick={handleBack} 
                    variant="ghost" 
                    className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition px-6"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={uploadingMedia}
                    className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition px-6"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* PHASE 5 — PRICING & AVAILABILITY (STEP 4) */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Work Preferences</h2>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                    Set up your day rates and calendar availability.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Day Rate (₹)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 150000"
                        value={formData.dayRate}
                        onChange={(e) => setFormData({...formData, dayRate: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Hourly Rate (₹)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 20000"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Project Minimum (₹)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 50000"
                        value={formData.projectMinimum}
                        onChange={(e) => setFormData({...formData, projectMinimum: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Available Cities</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Kochi, Bangalore"
                        value={formData.availableCities}
                        onChange={(e) => setFormData({...formData, availableCities: e.target.value})}
                        className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                      />
                    </div>
                  </div>

                  {/* Calendar Mock */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Availability Calendar (Tap to toggle status)</label>
                    <div className="grid grid-cols-7 gap-2 p-3 bg-muted border border-border rounded-2xl text-center text-[10px]">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                        <div key={d} className="font-bold text-muted-foreground pb-1">{d}</div>
                      ))}
                      {["22", "23", "24", "25", "26", "27", "28"].map(day => {
                        const status = formData.calendarAvailability[day] || "available";
                        const bg = status === "available" ? "bg-emerald-500 text-white" : status === "booked" ? "bg-destructive text-white" : "bg-secondary text-muted-foreground/80";
                        return (
                          <div 
                            key={day} 
                            onClick={() => toggleCalendarDate(day)}
                            className={`p-2.5 rounded-lg cursor-pointer transition font-bold ${bg}`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI insights panel */}
                  <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl space-y-2 text-[10px] text-red-650 font-bold shadow-sm">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-destructive shrink-0" />
                      <span>AI Pricing Analysis</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Profiles with availability updated weekly receive 40% more booking inquiries.</li>
                      <li>Setting clear project minimums accelerates booking discussion speed.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-4">
                  <Button 
                    type="button" 
                    onClick={handleBack} 
                    variant="ghost" 
                    className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition px-6"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition px-6"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* PHASE 6 — TRUST & VERIFICATION (STEP 5) */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" /> Account Trust
                  </h2>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                    Verify your identity and social profiles to unlock trust badges (Optional).
                  </p>
                </div>

                <div className="space-y-4">
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, verifiedId: !prev.verifiedId }))}
                    className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition shadow-sm ${
                      formData.verifiedId ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted border-border hover:bg-muted"
                    }`}
                  >
                    <div className="text-left">
                      <strong className="font-bold text-xs block text-foreground">ID Verification</strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Submit legal passport or driver's license for absolute verification trust.</span>
                    </div>
                    {formData.verifiedId ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]">Verified</Badge>
                    ) : (
                      <Badge className="bg-secondary text-muted-foreground border-none font-bold text-[9px]">Optional</Badge>
                    )}
                  </div>

                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, verifiedInstagram: !prev.verifiedInstagram }))}
                    className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition shadow-sm ${
                      formData.verifiedInstagram ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted border-border hover:bg-muted"
                    }`}
                  >
                    <div className="text-left">
                      <strong className="font-bold text-xs block text-foreground">Instagram Verification</strong>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Link and audit social reach counts automatically.</span>
                    </div>
                    {formData.verifiedInstagram ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]">Linked</Badge>
                    ) : (
                      <Badge className="bg-secondary text-muted-foreground border-none font-bold text-[9px]">Optional</Badge>
                    )}
                  </div>

                  {/* Trust badge showcase */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Available Badges</label>
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="p-3 bg-muted border border-border rounded-2xl flex flex-col items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-red-650" />
                        <span className="font-bold text-foreground">Verified Talent</span>
                      </div>
                      <div className="p-3 bg-muted border border-border rounded-2xl flex flex-col items-center gap-1 shadow-sm">
                        <Award className="h-5 w-5 text-red-650" />
                        <span className="font-bold text-foreground">Top Rated</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-4">
                  <Button 
                    type="button" 
                    onClick={handleBack} 
                    variant="ghost" 
                    className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition px-6"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition px-6"
                  >
                    {isSubmitting ? (
                      <>Registering...</>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Submit Registration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-border py-6 bg-white text-center text-[10px] text-muted-foreground font-bold">
        © 2026 Creator Network. All rights reserved.
      </footer>

    </div>
  );
}
