"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Weak Passcode",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Mismatch",
        description: "Passwords do not match.",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to update your password.",
      });
    } else {
      setLoading(false);
      setCompleted(true);
      toast({
        title: "Password Updated",
        description: "Your security passcode has been changed successfully.",
      });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden relative z-10">
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="mx-auto h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600 mb-4 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Create New Passcode</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">Set a secure, new password for your account.</p>
        </div>

        <div className="p-8">
          {completed ? (
            <div className="text-center flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-emerald-600 bg-emerald-50 p-3.5 rounded-full ring-4 ring-emerald-500/10" />
              <p className="text-sm text-slate-600 font-bold">
                Password updated successfully!
              </p>
              <p className="text-xs text-slate-400">
                Redirecting to secure login interface...
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min. 8 characters"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-11 text-xs rounded-xl focus:border-red-500 text-slate-800 font-bold w-full pr-10"
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

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Re-enter password"
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-11 text-xs rounded-xl focus:border-red-500 text-slate-800 font-bold w-full pr-10"
                  />
                </div>
              </div>
              
              <Button disabled={loading} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md mt-4 transition">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save & Authenticate"}
              </Button>
            </form>
          )}
        </div>

        {!completed && (
          <div className="px-8 py-4 bg-slate-50 text-center border-t border-slate-100">
            <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">&larr; Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
