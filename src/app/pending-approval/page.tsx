"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  const { user, profile, isLoading, isSuperAdmin } = useTenant();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile?.status === 'approved' || isSuperAdmin) {
        router.push(profile?.role_id === 'TALENT' ? '/talent/dashboard' : profile?.role_id === 'CLIENT' ? '/client/dashboard' : '/dashboard');
      }
    }
  }, [user, profile, isLoading, isSuperAdmin, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-foreground tracking-tight mb-3">Your account is waiting for approval</h1>
      <p className="text-muted-foreground font-medium max-w-md mb-8">
        Your registration was successful. An administrator is currently reviewing your account. You will receive access once you have been cleared.
      </p>
      <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-xl border-border text-muted-foreground/80 font-bold hover:bg-muted">
        Return to Home <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
