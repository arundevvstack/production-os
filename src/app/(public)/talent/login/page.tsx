"use client";

import React, { useState } from "react";
import { 
  Sparkles, Lock, ArrowRight, ShieldCheck, Mail, Key, 
  Instagram, ArrowLeft, ArrowUpRight, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";
import Link from "next/link";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4 mr-1">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691c-1.959 3.238-3.029 6.961-3.029 10.959C3.277 30.638 4.347 34.361 6.306 37.601l5.657-5.657C10.854 29.803 10 27.025 10 24s.854-5.803 1.964-8.148l-5.658-5.161z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657C30.012 35.636 27.211 37 24 37c-3.743 0-6.945-1.936-8.791-4.792l-5.657 5.657C12.012 40.353 17.512 44 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083L43.594 20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.657 5.657C41.289 35.796 44 30.338 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);

export default function TalentLoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials provided."
      });
      return;
    }

    toast({
      title: "Talent Login Successful",
      description: "Welcome back! Redirecting to your Creator Network Dashboard...",
    });
    window.location.href = "/talent/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased flex flex-col justify-between selection:bg-destructive selection:text-white">
      
      {/* Header */}
      <header className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-destructive/10 rounded-xl flex items-center justify-center font-black text-sm text-red-650 shadow-sm shrink-0">DP</div>
          <div>
            <span className="font-bold text-base tracking-tight block text-foreground">Creator Network</span>
            <span className="text-[9px] font-bold text-destructive uppercase tracking-widest leading-none">Public Portal</span>
          </div>
        </div>

        <a href="/creators" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </a>
      </header>

      {/* Main Login */}
      <main className="max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center w-full">
        <Card className="bg-white border border-border rounded-3xl shadow-sm">
          <CardContent className="p-8 space-y-6">
            
            <div className="space-y-1.5 text-center">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-5 w-5 text-red-650" /> Sign In to Creator Portal
              </h2>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                Access your public portfolio, availability calendar, and bookings.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="creator@network.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted border border-border h-11 text-xs rounded-xl pl-11 focus:border-destructive text-foreground font-bold w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                  <Link href="/forgot-password" className="text-[9px] text-destructive font-bold uppercase hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted border border-border h-11 text-xs rounded-xl pl-11 pr-10 focus:border-destructive text-foreground font-bold w-full"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-destructive hover:bg-destructive text-white font-bold h-11 rounded-full text-xs flex items-center justify-center gap-1 shadow shadow-red-500/10 transition"
              >
                {isSubmitting ? (
                  <>Logging in...</>
                ) : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-[9px] text-muted-foreground font-bold uppercase">or connect with</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-border bg-white hover:bg-muted rounded-full h-10 text-xs font-bold gap-1 text-foreground/80 shadow-sm transition">
                <GoogleIcon /> Google
              </Button>
              <Button variant="outline" className="border-border bg-white hover:bg-muted rounded-full h-10 text-xs font-bold gap-1 text-foreground/80 shadow-sm transition">
                <Instagram className="h-4 w-4 text-[#e1306c]" /> Instagram
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center font-bold">
              Don't have a public profile?{" "}
              <a href="/talent/signup" className="text-red-650 font-bold hover:underline">
                Create One Now
              </a>
            </p>

            <div className="p-4 bg-muted rounded-2xl border border-slate-150 flex gap-2 items-start leading-relaxed text-[10px] text-muted-foreground font-bold shadow-sm">
              <Lock className="h-4.5 w-4.5 text-red-650 shrink-0 mt-0.5" />
              <span>
                <strong>Public Registration</strong>: This form is for creators to register. It does not provide access to staff dashboards or internal team tools.
              </span>
            </div>

          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-white text-center text-[10px] text-muted-foreground font-bold">
        © 2026 Creator Network. All rights reserved.
      </footer>

    </div>
  );
}
