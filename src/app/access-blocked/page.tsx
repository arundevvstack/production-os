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
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
        <Ban className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-foreground tracking-tight mb-3">Access Suspended</h1>
      <p className="text-muted-foreground font-medium max-w-md mb-8">
        Your access to MediaOS has been suspended by an administrator. Please contact support if you believe this is an error.
      </p>
      <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-xl border-border text-muted-foreground/80 font-bold hover:bg-muted">
        Return to Home <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
