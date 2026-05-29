"use client";

import React, { useState } from "react";
import { 
  Building2, Lock, ArrowRight, ShieldCheck, Mail, Key, 
  ArrowLeft, ArrowUpRight, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabase/client";
import Link from "next/link";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4 mr-2">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691c-1.959 3.238-3.029 6.961-3.029 10.959C3.277 30.638 4.347 34.361 6.306 37.601l5.657-5.657C10.854 29.803 10 27.025 10 24s.854-5.803 1.964-8.148l-5.658-5.161z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657C30.012 35.636 27.211 37 24 37c-3.743 0-6.945-1.936-8.791-4.792l-5.657 5.657C12.012 40.353 17.512 44 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083L43.594 20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.657 5.657C41.289 35.796 44 30.338 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);

export default function ClientLoginPage() {
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
      title: "Client Authorization Approved",
      description: "Welcome to your Partner Portal workspace. Loading campaign projects...",
    });
    window.location.href = "/client/dashboard";
  };

  return (
    <div className="min-h-screen bg-muted text-primary font-sans antialiased flex flex-col justify-between">
      
      {/* Premium White Header */}
      <header className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between w-full border-b border-border bg-white">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm">DP</div>
          <div>
            <span className="font-black text-base tracking-tight block text-primary">Define Perspective</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Partner Portal</span>
          </div>
        </div>

        <a href="/login" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-bold">
          Employee OS <ArrowUpRight className="h-4 w-4" />
        </a>
      </header>

      {/* Main Login */}
      <main className="max-w-md mx-auto px-6 py-12 flex-1 flex flex-col justify-center w-full">
        <Card className="bg-white border-border/80 shadow-premium rounded-2xl">
          <CardContent className="p-8 space-y-6">
            
            <div className="space-y-1.5 text-center">
              <h2 className="text-xl font-black tracking-tight text-primary flex items-center justify-center gap-1.5">
                <Building2 className="h-5 w-5 text-primary/80" /> Partner Sign In
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Review proposed contracts, approve design assets, and monitor payments.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Client Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="partner@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted border-border h-10 text-xs rounded-xl pl-9 focus:border-primary text-primary w-full"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Access Key</label>
                  <Link href="/forgot-password" className="text-[9px] text-muted-foreground font-black uppercase hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted border-border h-10 text-xs rounded-xl pl-9 pr-10 focus:border-primary text-primary w-full"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary rounded-xl"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary text-white font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
              >
                {isSubmitting ? (
                  <>Verifying key...</>
                ) : (
                  <>
                    Access Partner Hub <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-[9px] text-muted-foreground font-bold uppercase">or access with</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button variant="outline" className="w-full border-border bg-white hover:bg-muted rounded-xl h-10 text-xs font-bold gap-1 text-primary/80 shadow-sm">
              <GoogleIcon /> Sign In with Google Workspace
            </Button>

            <div className="p-3.5 bg-muted rounded-xl border border-border/80 flex gap-2.5 items-start leading-relaxed text-[9px] text-muted-foreground">
              <Lock className="h-4.5 w-4.5 text-muted-foreground/80 shrink-0 mt-0.5" />
              <span>
                <strong>Confidential Workspace Guard</strong>: Partner accounts are subject to Strict Client isolation rules. Internal campaigns and customer relationship records are 100% hidden.
              </span>
            </div>

          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-white text-center text-[10px] text-muted-foreground font-medium">
        © 2026 Define Perspective Ltd. All rights reserved. Secure Partner Access.
      </footer>

    </div>
  );
}
