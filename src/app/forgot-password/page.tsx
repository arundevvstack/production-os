
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[10px] shadow-2xl shadow-purple-500/10 overflow-hidden">
          <div className="p-8 text-center">
            <motion.div 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center items-center gap-3 mb-4"
            >
              <Shield className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold tracking-widest text-purple-400 uppercase font-mono">System Recovery</h1>
            </motion.div>
            <motion.p 
              initial={{ y: -10, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-sm text-gray-400"
            >
              {submitted ? "Recovery link has been dispatched." : "Initiate a secure password reset."} 
            </motion.p>
          </div>

          <div className="px-8 pb-8">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-center flex flex-col items-center gap-4 py-8"
              >
                <MailCheck className="h-16 w-16 text-green-400 bg-green-500/10 p-3 rounded-full" />
                <p className="text-gray-300">
                  Check your inbox for a secure link to reset your passcode. 
                </p>
                <Link href="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors mt-4 text-sm">
                  &larr; Back to System Login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
                  <Label className="text-xs font-bold text-gray-400" htmlFor="email">Authenticated Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="operator@domain.sec"
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/20 border-white/10 h-12 rounded-lg mt-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </motion.div>
                
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
                  <Button disabled={loading} className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Recovery Link"}
                  </Button>
                </motion.div>
              </form>
            )}
          </div>

          {!submitted &&
            <div className="px-8 py-4 bg-black/10 text-center">
              <p className="text-xs text-gray-500">
                Remember your passcode?{" "}
                <Link href="/login" className="font-bold text-gray-300 hover:text-white transition-colors">Login Here</Link>
              </p>
            </div>
          }
        </div>
      </motion.div>

      {/* Background glowing shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse [animation-delay:2s]"></div>
      </div>
    </div>
  );
}
