
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
    <div className="min-h-screen bg-[#F0F1F4] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[10px] overflow-hidden">
        <CardHeader className="space-y-4 pt-10 pb-6 text-center bg-accent text-white relative">
          <Sparkles className="absolute top-6 right-6 h-6 w-6 text-white opacity-50" />
          <div className="mx-auto h-12 w-12 bg-white/20 rounded-[10px] flex items-center justify-center backdrop-blur-md">
            <span className="font-bold text-xl">DP</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline font-bold">Get Started</CardTitle>
            <CardDescription className="text-white/70">Create your secure multi-tenant account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-10">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="alex@dpstudios.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="At least 8 characters" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pr-10"
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
            <div className="bg-muted/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Security Guarantee
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your data is isolated at the tenant level. We enforce strict cross-company data access blocks by default.
              </p>
            </div>
            <Button disabled={loading} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Workspace"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 text-center flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-bold hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
