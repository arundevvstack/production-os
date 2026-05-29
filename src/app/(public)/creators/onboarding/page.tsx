"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, ArrowRight, UserCheck, ShieldCheck, Sparkles, 
  MapPin, Camera, DollarSign, Globe, CheckCircle2, ChevronRight,
  Flame, Lock, HelpCircle, Layers, Sliders, Users, Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function PublicCreatorsOnboarding() {
  const { toast } = useToast();
  
  // Onboarding Wizard step
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<string>("Talent"); // Talent, Influencer
  const [formData, setFormData] = useState({
    fullName: "",
    stageName: "",
    category: "Actor",
    location: "Kochi, Kerala",
    dayRate: "120000",
    languages: "Malayalam, English",
    skills: "Method Acting, Stunts",
    instagram: "",
    bio: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["Actor", "Anchor / Actor", "Director / Actor", "Voice Artist", "DOP / Cinematographer", "Stylist"];

  const handleNext = () => {
    if (step === 1 && !formData.fullName) {
      toast({
        title: "Name Required",
        description: "Please enter your name to proceed.",
        variant: "destructive"
      });
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Registration Successful!",
        description: `Congratulations, ${formData.fullName}! Your profile has been queued for verification.`,
      });
      // Redirect to creators directory
      window.location.href = "/creators";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col justify-between selection:bg-destructive selection:text-white">
      
      {/* Top Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-destructive/10 rounded-xl flex items-center justify-center font-black text-sm text-destructive shadow-sm shrink-0">DP</div>
            <div>
              <span className="font-bold text-base tracking-tight block text-foreground">Creator Network</span>
              <span className="text-[9px] font-bold text-destructive uppercase tracking-widest leading-none">Talent Registration</span>
            </div>
          </div>

          <a href="/creators">
            <Button variant="ghost" className="text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-full h-9 px-4 border border-border shadow-sm bg-white transition">
              <ArrowLeft className="h-4 w-4 mr-1" /> Exit
            </Button>
          </a>
        </div>
      </header>

      {/* Main wizard layout */}
      <main className="max-w-xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center w-full">
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-between text-xs mb-8 text-muted-foreground font-bold uppercase tracking-widest px-1">
          <span className={step >= 1 ? "text-destructive font-bold" : ""}>1. Details</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className={step >= 2 ? "text-destructive font-bold" : ""}>2. Skills</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className={step >= 3 ? "text-destructive font-bold" : ""}>3. Review</span>
        </div>

        <Card className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
          <CardContent className="p-8 space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1: Personal Profile details */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5 leading-tight">
                      <Sparkles className="h-5 w-5 text-red-650" /> Create your profile
                    </h2>
                    <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                      Choose your profile type and enter your details to register.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div 
                      onClick={() => setUserType("Talent")}
                      className={`p-4 rounded-2xl border text-center cursor-pointer transition shadow-sm ${
                        userType === "Talent" ? "bg-destructive/5 border-destructive/30 text-red-650" : "bg-muted border-border/85 hover:bg-muted text-foreground/80"
                      }`}
                    >
                      <Users className="h-5 w-5 mx-auto mb-2 text-destructive" />
                      <span className="font-bold text-xs block">Actor / Model</span>
                    </div>

                    <div 
                      onClick={() => setUserType("Influencer")}
                      className={`p-4 rounded-2xl border text-center cursor-pointer transition shadow-sm ${
                        userType === "Influencer" ? "bg-destructive/5 border-destructive/30 text-red-650" : "bg-muted border-border/85 hover:bg-muted text-foreground/80"
                      }`}
                    >
                      <Flame className="h-5 w-5 mx-auto mb-2 text-destructive" />
                      <span className="font-bold text-xs block">Creator / Influencer</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Full Legal Name</label>
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
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Stage Name (Optional)</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Aparna"
                      value={formData.stageName}
                      onChange={(e) => setFormData({...formData, stageName: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                      <select 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="bg-muted border border-border h-10 px-3 text-xs rounded-xl focus:border-destructive text-foreground/80 w-full outline-none font-bold"
                      >
                        {categories.map(c => (
                          <option key={c} value={c} className="bg-white text-foreground font-bold">{c}</option>
                        ))}
                      </select>
                    </div>

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
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      className="w-full bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      Next Step <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Skills & Social media */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight">Skills & Reach</h2>
                    <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                      Highlight your specialties and add reach stats for advertising matches.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Skills (Comma Separated)</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Method Acting, Classical Dance, Dialect Voiceover"
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Languages (Comma Separated)</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Malayalam, English, Tamil"
                      value={formData.languages}
                      onChange={(e) => setFormData({...formData, languages: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Instagram Handle</label>
                    <Input 
                      type="text" 
                      placeholder="@username"
                      value={formData.instagram}
                      onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                      className="bg-muted border-border h-10 text-xs rounded-xl focus:border-destructive text-foreground font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Biography / About You</label>
                    <textarea 
                      placeholder="Short professional intro for directors..."
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="bg-muted border border-border h-20 text-xs rounded-xl focus:border-destructive text-foreground w-full p-3 resize-none focus:outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button 
                      type="button" 
                      onClick={handleBack} 
                      variant="ghost" 
                      className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition"
                    >
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      Review Details <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Preview Details & Sandbox Auth */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight font-sans">Review Profile</h2>
                    <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                      Check your profile details before submitting.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted border border-border space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-red-550 shadow-sm ring-4 ring-white">
                        <AvatarFallback className="bg-muted text-foreground font-bold">{formData.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{formData.fullName}</h4>
                        <span className="text-[10px] text-destructive font-bold uppercase block mt-0.5">{formData.category}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs border-t border-slate-150 pt-4 font-bold text-slate-650">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Day Rate:</span>
                        <strong className="text-foreground">₹{parseFloat(formData.dayRate || "0").toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Locations Base:</span>
                        <strong className="text-foreground">{formData.location}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Languages:</span>
                        <strong className="text-foreground">{formData.languages}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Skills:</span>
                        <strong className="text-foreground">{formData.skills}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground font-bold bg-muted p-3 rounded-xl border border-slate-150 flex gap-2 items-start leading-relaxed shadow-sm">
                    <Lock className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>Public Registration</strong>: This form is for creators to register. It does not provide access to staff dashboards or internal team tools.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button 
                      type="button" 
                      onClick={handleBack} 
                      variant="ghost" 
                      className="rounded-full border border-border hover:bg-muted font-bold h-11 text-xs text-foreground/80 bg-white shadow-sm transition"
                    >
                      Modify
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow-sm transition"
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

            </form>

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
