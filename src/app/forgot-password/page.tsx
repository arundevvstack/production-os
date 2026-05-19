
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import { Loader2, MailCheck, Bot, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
      });
    } else {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden relative z-10">
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="mx-auto h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600 mb-4 shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">System Recovery</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            {submitted ? "Recovery link has been dispatched." : "Initiate a secure password reset."} 
          </p>
        </div>

        <div className="p-8">
          {submitted ? (
            <div className="text-center flex flex-col items-center gap-4 py-6 animate-in fade-in duration-300">
              <MailCheck className="h-16 w-16 text-emerald-600 bg-emerald-50 p-3.5 rounded-full ring-4 ring-emerald-500/10" />
              <p className="text-sm text-slate-600 font-bold">
                Check your inbox for a secure recovery link.
              </p>
              <Link href="/login" className="font-bold text-red-650 hover:text-red-700 transition-colors mt-4 text-xs">
                &larr; Back to System Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1" htmlFor="email">Authenticated Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="operator@domain.com"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 h-11 text-xs rounded-xl focus:border-red-500 text-slate-800 font-bold w-full"
                />
              </div>
              
              <Button disabled={loading} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md mt-4 transition">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Recovery Link"}
              </Button>
            </form>
          )}
        </div>

        {!submitted && (
          <div className="px-8 py-4 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold">
              Remember your passcode?{" "}
              <Link href="/login" className="text-red-650 hover:underline">Login Here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
