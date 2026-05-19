"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useRouter } from "next/navigation";
import { Ban, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessBlockedPage() {
  const { user, profile, isLoading, isSuperAdmin } = useTenant();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile?.status !== 'suspended' && !isSuperAdmin) {
        router.push(profile?.status === 'pending' ? '/pending-approval' : '/');
      }
    }
  }, [user, profile, isLoading, isSuperAdmin, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <Ban className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Access Suspended</h1>
      <p className="text-slate-500 font-medium max-w-md mb-8">
        Your access to MediaOS has been suspended by an administrator. Please contact support if you believe this is an error.
      </p>
      <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-100">
        Return to Home <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
