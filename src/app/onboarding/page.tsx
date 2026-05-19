"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/supabase/provider";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Building, Terminal, CheckCircle2, ShieldCheck, Cpu, Database, Network } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface InitStep {
  label: string;
  status: 'idle' | 'loading' | 'done';
  icon: any;
}

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useSupabase();
  const router = useRouter();

  // Workspace Setup Loading Sequences
  const [steps, setSteps] = useState<InitStep[]>([
    { label: "Checking security tenant isolation...", status: 'idle', icon: ShieldCheck },
    { label: "Allocating database indexes & RLS bounds...", status: 'idle', icon: Database },
    { label: "Syncing financial & CRM commands...", status: 'idle', icon: Network },
    { label: "Booting AI planning engine...", status: 'idle', icon: Cpu }
  ]);

  // Step sequencer effect
  useEffect(() => {
    if (!isInitializing) return;

    let currentStep = 0;
    const interval = setInterval(() => {
      setSteps(prev => {
        const nextSteps = [...prev];
        if (currentStep > 0) {
          nextSteps[currentStep - 1].status = 'done';
        }
        if (currentStep < nextSteps.length) {
          nextSteps[currentStep].status = 'loading';
        }
        return nextSteps;
      });

      setInitProgress(Math.min((currentStep + 1) * 25, 100));
      currentStep++;

      if (currentStep > steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          toast({ title: "Workspace Operational", description: "Successfully routed into agency core." });
          router.push("/dashboard");
        }, 1200);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isInitializing, router, steps.length]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Single Agency Workspace Gate: Check if a company already exists
      const { data: existingCompanies, error: fetchError } = await supabase
        .from("Company")
        .select("id, name")
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingCompanies && existingCompanies.length > 0) {
        const singleCompany = existingCompanies[0];

        // Route user into the single preconfigured agency pool
        const { error: userError } = await supabase
          .from("User")
          .upsert({ 
            id: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
            company_id: singleCompany.id,
            role_id: "EMPLOYEE",
            status: "pending",
            onboarding_status: "awaiting_approval",
            department: "Production"
          });

        if (userError) throw userError;

        toast({
          title: "Registration Synced",
          description: `You have joined the internal team pool of "${singleCompany.name}". Your clearance is pending Administrator approval.`,
        });

        router.push("/login");
        return;
      }

      // No company exists yet: Let the first bootstrapper initialize the single preconfigured agency
      const { data: company, error: companyError } = await supabase
        .from("Company")
        .insert({
          name: companyName,
          onboardingStatus: "completed",
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Initialize default company settings
      const { error: settingsError } = await supabase
        .from("CompanySettings")
        .insert({
          company_id: company.id,
          modules_enabled: ['dashboard', 'projects', 'crm', 'finance', 'talents', 'proposals'],
          currency: "INR",
          timezone: "Asia/Kolkata"
        });

      if (settingsError) throw settingsError;

      // 3. Update the matching public User profile with company ID and SUPER_ADMIN role
      const { error: userError } = await supabase
        .from("User")
        .upsert({ 
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          company_id: company.id,
          role_id: "SUPER_ADMIN",
          status: "approved",
          onboarding_status: "completed",
          department: "Administration"
        });

      if (userError) throw userError;

      // Launch high-end initialization sequence screen!
      setIsInitializing(true);

    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Onboarding Failed",
        description: error.message || "Could not complete workspace onboarding. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none opacity-40" />

      <Card className="w-full max-w-lg border border-white/5 bg-[#0d0f14]/80 backdrop-blur-3xl shadow-2xl rounded-[10px] overflow-hidden">
        
        {!isInitializing ? (
          <>
            <CardHeader className="space-y-4 pt-10 pb-6 text-center bg-primary/5 border-b border-white/5 text-white relative">
              <div className="mx-auto h-12 w-12 bg-primary/10 border border-primary/20 rounded-[10px] flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2.5xl font-black tracking-tight text-white">Initialize Production Space</CardTitle>
                <CardDescription className="text-slate-400 text-sm">Register the primary internal operations company record.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 lg:p-10">
              <form onSubmit={handleOnboarding} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Production Agency Name</Label>
                  <Input 
                    id="companyName" 
                    type="text" 
                    placeholder="e.g., Define Perspective Studios" 
                    required 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 rounded-[10px] border-white/5 bg-white/5 focus:bg-white/10 text-white placeholder-slate-500 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <Button disabled={loading} className="w-full h-12 rounded-[10px] bg-primary hover:bg-primary/95 text-white font-black text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Boot Command Center"}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          /* Cinematic Bootstrapper view */
          <div className="p-10 space-y-8 animate-in fade-in zoom-in-95 duration-500 text-white">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <Terminal className="h-6 w-6 text-primary shrink-0 animate-pulse" />
                <h3 className="font-black text-lg uppercase tracking-wider">Workspace Initialization</h3>
              </div>
              <span className="font-mono text-sm text-primary font-black">{initProgress}%</span>
            </div>

            <div className="space-y-4">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-[10px] bg-white/[0.01] border border-white/[0.03] transition-all">
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <StepIcon className={cn(
                        "h-4.5 w-4.5 shrink-0",
                        step.status === 'done' ? 'text-emerald-500' : (step.status === 'loading' ? 'text-primary animate-pulse' : 'text-slate-600')
                      )} />
                      <span className={cn(
                        step.status === 'done' ? 'text-slate-300 font-bold' : (step.status === 'loading' ? 'text-white' : 'text-slate-500')
                      )}>{step.label}</span>
                    </div>
                    <div>
                      {step.status === 'done' && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />}
                      {step.status === 'loading' && <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />}
                      {step.status === 'idle' && <span className="h-2 w-2 rounded-full bg-slate-800 mr-1.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-4">
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${initProgress}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center font-bold">Mapping intranet bounds. Do not close terminal window.</p>
            </div>
          </div>
        )}

      </Card>
    </div>
  );
}
