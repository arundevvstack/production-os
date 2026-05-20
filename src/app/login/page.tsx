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
  Loader2, Eye, EyeOff, ShieldCheck, Radio, Sparkles, ChevronRight, Building2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import {
  Carousel, CarouselContent, CarouselItem
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const features = [
  {
    title: "Manage your production",
    description: "Keep track of all your video campaigns, rentals, and team schedules in one place.",
    icon: <Radio className="w-8 h-8 text-red-600" />,
    bgColor: "bg-red-500/10",
    image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "AI Media Assistant",
    description: "Quickly find clips, generate subtitles, and organize your editing workflow.",
    icon: <Sparkles className="w-8 h-8 text-red-600" />,
    bgColor: "bg-red-500/10",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Review & Feedback",
    description: "Share videos with clients and get precise feedback on every frame securely.",
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

  const { user, isLoading } = useSupabase();
  const router = useRouter();
  const plugin = useRef(Autoplay({ delay: 5500, stopOnInteraction: false }));

  // Route authenticated users to correct portal
  useEffect(() => {
    if (!user || isLoading) return;

    const checkStatus = async () => {
      const { data } = await supabase
        .from('User')
        .select('*, company:Company(name)')
        .eq('id', user.id)
        .single();
      
      if (data) {
        if (data.status === 'suspended') {
          router.push('/access-blocked');
          return;
        } else if (data.status === 'pending') {
          const { data: admin } = await supabase
            .from('SuperAdmin')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!admin && data.role_id !== 'SUPER_ADMIN') {
            router.push('/pending-approval');
            return;
          }
        }
        
        if (data.role_id === 'TALENT') {
          router.push("/talent/dashboard");
        } else if (data.role_id === 'CLIENT') {
          router.push("/client/dashboard");
        } else {
          router.push("/dashboard");
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: err.message || "Invalid credentials. Please check your email and password.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Ambient gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
        
        {/* LEFT — Account Center Login */}
        <div className="flex flex-col justify-center p-8 lg:p-12 relative bg-white">
          <div className="w-full space-y-8">

            {/* Brand Header */}
            <div className="space-y-1">
              <div className="mb-8">
                <Logo />
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Log in to manage your projects, team, and media.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="email">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium transition"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="password">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-red-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium w-full pr-12 transition"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-800 rounded-xl"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 transition duration-300"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Sign In <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            {/* Security note */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 leading-relaxed font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Secure access. Your data is private and protected.</span>
            </div>

            {/* Register link */}
            <div className="text-center border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">
                Don't have an account?{" "}
                <Link href="/signup" className="font-bold text-red-600 hover:underline">
                  Sign up
                </Link>
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Link href="/talent/login" className="hover:text-indigo-600 transition">Talent Portal</Link>
                <span className="text-slate-200">|</span>
                <Link href="/client/login" className="hover:text-emerald-600 transition">Business Portal</Link>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT — Cinematic Showcase */}
        <div className="hidden md:block relative p-4 lg:p-6 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-indigo-600/5 mix-blend-overlay z-10 pointer-events-none" />
          
          {/* Account Center info overlay at bottom */}
          <div className="absolute bottom-8 left-8 right-8 z-20 text-white space-y-1">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Account Center</div>
            <div className="text-xs font-black text-white/80">Define Perspective</div>
            <div className="text-[10px] text-white/40 font-medium">Registered Name · Media Production Agency</div>
          </div>

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
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white">
                      <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} backdrop-blur-xl flex items-center justify-center mb-6 border border-white/10 shadow-2xl`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-black mb-3 tracking-tight">{feature.title}</h3>
                      <p className="text-slate-300 max-w-sm text-xs font-medium leading-relaxed">{feature.description}</p>
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
