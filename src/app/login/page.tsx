"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2, Eye, EyeOff, Bot, ShieldAlert, Radio, ShieldCheck, 
  Clock, KeyRound, Sparkles, ChevronRight, ArrowLeft, Building2, Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Carousel, CarouselContent, CarouselItem
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Production Command Center",
    description: "Manage cinematic video campaigns, camera rentals, and edit schedules in real-time.",
    icon: <Radio className="w-8 h-8 text-red-600" />,
    bgColor: "bg-red-500/10",
    image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "AI Media Assistant",
    description: "Find b-roll, generate automated audio transcripts, and plan editing workflows.",
    icon: <Sparkles className="w-8 h-8 text-red-600" />,
    bgColor: "bg-red-500/10",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Review & Feedback Tools",
    description: "Get frame-accurate client feedback and manage multi-version exports under secure keys.",
    icon: <ShieldCheck className="w-8 h-8 text-red-600" />,
    bgColor: "bg-red-500/10",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom interface states: 'login' | 'pending' | 'suspended'
  const [entryState, setEntryState] = useState<'login' | 'pending' | 'suspended'>('login');
  const [pendingCompany, setPendingCompany] = useState<string>("DP Studios");
  
  // Portal Picker active states
  const [portalMode, setPortalMode] = useState<'picker' | 'internal'>('picker');

  const { user, isLoading } = useSupabase();
  const router = useRouter();
  const plugin = useRef(Autoplay({ delay: 5500, stopOnInteraction: false }));

  useEffect(() => {
    if (!user || isLoading) return;

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('User')
        .select('*, company:Company(name)')
        .eq('id', user.id)
        .single();
      
      if (data) {
        if (data.status === 'suspended') {
          await supabase.auth.signOut();
          setEntryState('suspended');
          toast({
            variant: "destructive",
            title: "Access Restricted",
            description: "The active security token has been revoked by your administrator."
          });
        } else if (data.status === 'pending') {
          // Check if they are a SuperAdmin. SuperAdmins skip verification.
          const { data: admin } = await supabase
            .from('SuperAdmin')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!admin && data.role_id !== 'SUPER_ADMIN') {
            await supabase.auth.signOut();
            setPendingCompany(data.company?.name || "DP Studios");
            setEntryState('pending');
            toast({
              variant: "destructive",
              title: "Onboarding Pending",
              description: "Your operational clearance is awaiting manager approval."
            });
            return;
          }
          router.push("/");
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    };

    checkStatus();
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "Invalid credentials. Please check your secure key.",
      });
    }
  };

  const handleSignoutReset = async () => {
    await supabase.auth.signOut();
    setEntryState('login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Subtle light background gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
        
        {/* Left Panel: Dynamic Access Gateway */}
        <div className="flex flex-col justify-center items-center p-8 lg:p-12 relative bg-white">
          
          {entryState === 'login' && (
            <div className="w-full z-10 space-y-8">
              
              {/* Header Logo */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shadow-md">
                  <Bot className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-xl font-black tracking-wider uppercase text-slate-900">Define Perspective</span>
              </div>

              {/* MODE 1: Platform Access Hub */}
              {portalMode === 'picker' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Log In Portal</h2>
                    <p className="text-xs text-slate-500 font-bold">Choose your portal to get started.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    
                    {/* Portal Option 1: Internal OS (DP Team) */}
                    <div 
                      onClick={() => setPortalMode('internal')}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-red-500/30 transition-all cursor-pointer group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-650 group-hover:scale-105 transition-transform shrink-0">
                          <Bot className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors">DP Team Portal</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug font-bold">Secure access for DP internal staff and managers.</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-9 px-5 text-xs font-black gap-1.5 transition shadow-md">
                          Staff Sign In <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Portal Option 2: Talent & Business Network */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-500/30 transition-all text-left shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">Talent & Business Network</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug font-bold">For actors, creators, brand managers, and business clients.</p>
                        </div>
                      </div>
                      
                      <div className="mt-5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Link href="/talent/login" className="w-full">
                            <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] h-9 font-black rounded-full transition shadow-md">
                              Talent Sign In
                            </Button>
                          </Link>
                          <Link href="/talent/signup" className="w-full">
                            <Button size="sm" variant="outline" className="w-full border-slate-300 bg-white hover:bg-slate-50 text-[11px] h-9 font-black rounded-full transition text-slate-700 shadow-sm">
                              Talent Sign Up
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Link href="/client/login" className="w-full">
                            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-9 font-black rounded-full transition shadow-md">
                              Business Sign In
                            </Button>
                          </Link>
                          <Link href="/client/login?mode=signup" className="w-full">
                            <Button size="sm" variant="outline" className="w-full border-slate-300 bg-white hover:bg-slate-50 text-[11px] h-9 font-black rounded-full transition text-slate-700 shadow-sm">
                              Business Sign Up
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">
                      Looking for custom casting briefs?{" "}
                      <Link href="/creators" className="font-bold text-red-600 hover:underline">Explore Creators Network</Link>
                    </p>
                  </div>
                </div>
              )}

              {/* MODE 2: Classical Email/Password login Form */}
              {portalMode === 'internal' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
                  
                  <div className="flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">Staff Sign In</h2>
                      <p className="text-xs text-slate-500 font-bold">Enter your email and password to log in.</p>
                    </div>
                    <Button 
                      onClick={() => setPortalMode('picker')}
                      variant="outline" 
                      className="rounded-full h-8 px-3 text-[10px] font-bold text-slate-500 hover:text-slate-900 gap-1 border-slate-200 shadow-sm"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:ring-red-500/20 focus:border-red-600 text-xs w-full font-bold transition"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400" htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:underline">Forgot Password?</Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:ring-red-500/20 focus:border-red-600 text-xs w-full pr-12 font-bold transition"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-800 rounded-xl"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </Button>
                      </div>
                    </div>
                    
                    <Button disabled={loading} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs active:scale-[0.98] mt-2 flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 transition duration-300">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ChevronRight className="h-4 w-4" /></>}
                    </Button>
                  </form>

                  <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 leading-relaxed font-bold">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Single Agency validation active. Public registration is locked.</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">
                      Awaiting an invite?{" "}
                      <Link href="/signup" className="font-bold text-red-600 hover:underline">Register</Link>
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ⏳ PENDING APPROVAL SCREEN */}
          {entryState === 'pending' && (
            <div className="w-full max-w-sm z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-white">
              <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-spin duration-[10000ms]" />
                <Clock className="h-10 w-10 text-amber-600" />
              </div>

              <div className="space-y-3">
                <Badge className="bg-amber-500/10 text-amber-650 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                  Waiting for Approval
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Account Under Review</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto font-bold">
                  Your request for <span className="font-black text-slate-900">"{pendingCompany}"</span> is registered. An administrator will review your account soon.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs font-bold space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Access Type:</span>
                  <span className="font-black text-slate-900">Workspace Access</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status:</span>
                  <span className="font-black text-amber-600 flex items-center gap-1.5"><Radio className="h-3 w-3 animate-pulse" /> Pending Review</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleSignoutReset} className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-black text-xs border border-slate-200 transition">
                  Back to Sign In
                </Button>
                <p className="text-[10px] text-slate-400 font-bold">Administrators usually review accounts within 15 minutes.</p>
              </div>
            </div>
          )}

          {/* 🔒 SUSPENDED SCREEN */}
          {entryState === 'suspended' && (
            <div className="w-full max-w-sm z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-white">
              <div className="mx-auto w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="h-10 w-10 text-rose-600 animate-pulse" />
              </div>

              <div className="space-y-3">
                <Badge className="bg-rose-500/10 text-rose-600 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
                  Account Locked
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Locked</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto font-bold">
                  Your account has been suspended. Please contact support.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs font-bold space-y-2">
                <p className="text-slate-500 text-center font-bold leading-relaxed">
                  Please contact an administrator to reactivate your account.
                </p>
              </div>

              <Button onClick={handleSignoutReset} className="w-full h-11 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-black text-xs border border-slate-200 transition">
                Back to Sign In
              </Button>
            </div>
          )}

        </div>

        {/* Right Panel: Cinematic Showcase with Light Overlays */}
        <div className="hidden md:block relative p-4 lg:p-6 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-indigo-600/5 mix-blend-overlay z-10 pointer-events-none" />
          <Carousel 
            className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/5" 
            plugins={[plugin.current]}
            opts={{ loop: true }}
          >
            <CarouselContent>
              {features.map((feature, index) => (
                <CarouselItem key={index}>
                  <div className="w-full h-[600px] relative">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover opacity-45"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-12 text-center text-white">
                      <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} backdrop-blur-xl flex items-center justify-center mb-6 border border-white/10 shadow-2xl`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-black mb-3 tracking-tight">{feature.title}</h3>
                      <p className="text-slate-300 max-w-sm text-xs font-bold leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
}
