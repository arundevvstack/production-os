
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useSupabase();
  const router = useRouter();

  // If user is already authenticated, send them to root to decide where to go
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0], // Fallback name
          role: 'EMPLOYEE',
        }
      }
    });

    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Account Creation Failed",
        description: error.message || "Could not create your account at this time.",
      });
    } else {
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox to verify your account.",
      });
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Ambient gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-destructive/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white border border-border shadow-2xl rounded-3xl overflow-hidden">
        
        {/* LEFT — Account Center Signup */}
        <div className="flex flex-col justify-center p-8 lg:p-12 relative bg-white">
          <div className="w-full space-y-8">

            {/* Brand Header */}
            <div className="space-y-1">
              <div className="mb-8">
                <Logo />
              </div>

              <h1 className="text-3xl font-black text-primary tracking-tight leading-tight">
                Create your account
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Join your team and start managing media production together.
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-primary/80 ml-1" htmlFor="email">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-border bg-muted focus:bg-white text-primary placeholder-slate-400 focus:ring-red-500/20 focus:border-destructive text-sm font-medium transition"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-primary/80 ml-1" htmlFor="password">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-border bg-muted focus:bg-white text-primary placeholder-slate-400 focus:ring-red-500/20 focus:border-destructive text-sm font-medium w-full pr-12 transition"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary rounded-xl"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-destructive hover:bg-destructive text-white font-black rounded-xl text-sm active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 transition duration-300"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            {/* Security note */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 leading-relaxed font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Your work is private and secure, accessible only by your team.</span>
            </div>

            {/* Login link */}
            <div className="text-center border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-destructive hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* RIGHT — Static Visual (To match new aesthetic) */}
        <div className="hidden md:flex relative p-4 lg:p-6 bg-primary items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-indigo-600/5 mix-blend-overlay z-10 pointer-events-none" />
          
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2070&auto=format&fit=crop" 
               alt="Creative Production" 
               className="w-full h-full object-cover opacity-40"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          </div>

          <div className="relative z-20 text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Built for Creators</h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Everything you need to manage your media production workflow in one place.
            </p>
          </div>
          
          <div className="absolute bottom-8 left-8 right-8 z-20 text-white space-y-1">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Account Center</div>
            <div className="text-xs font-black text-white/80">Define Perspective</div>
            <div className="text-[10px] text-white/40 font-medium">Media Production Agency</div>
          </div>
        </div>

      </div>
    </div>
  );
}
