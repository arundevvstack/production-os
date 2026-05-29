
"use client";

import { use, useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ArrowLeft, 
  Loader2, 
  IndianRupee, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Mail, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Zap, 
  Edit3, 
  FileText,
  ListTree
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseDoc } from "@/supabase/hooks/use-doc";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PIPELINE_STAGES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CONTENT_VERTICALS } from "../../clients/page";

export default function ProspectDetailPage({ params }: { params: Promise<{ prospectId: string }> }) {
  const { prospectId } = use(params);
  const { companyId, isLoading: isTenantLoading, profile } = useTenant();
  const router = useRouter();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: "",
    service_vertical: "",
    sub_vertical: "",
    industry: "",
    deal_value: ""
  });

  // 1. Fetch Prospect Details from Supabase
  const { data: prospect, isLoading: isProspectLoading } = useSupabaseDoc('Prospect', prospectId);

  const handleConvertToClient = async () => {
    if (!prospectId) return;
    setIsConverting(true);
    try {
      const response = await fetch(`/api/v1/crm/prospect/${prospectId}/convert`, {
        method: "POST",
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to convert prospect.");
      }

      toast({
        title: "Success! Prospect Converted",
        description: `"${prospect?.company_name || 'Prospect'}" has been successfully converted to a Client.`,
      });

      window.location.reload();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: err.message,
      });
    } finally {
      setIsConverting(false);
    }
  };

  // 2. Fetch Proposals linked to this prospect from Supabase
  const { data: proposals, isLoading: isProposalsLoading } = useSupabaseCollection('Proposal', {
    where: { prospect_id: prospectId },
    orderBy: { created_at: 'desc' }
  });

  // Sync edit form with prospect data when opened
  useEffect(() => {
    if (prospect && isEditOpen) {
      setEditForm({
        company_name: prospect.company_name || "",
        service_vertical: prospect.service_vertical || "",
        sub_vertical: prospect.sub_vertical || "",
        industry: prospect.industry || "",
        deal_value: prospect.deal_value?.toString() || ""
      });
    }
  }, [prospect, isEditOpen]);

  const handleUpdateStage = async (newStage: string) => {
    if (!prospect) return;
    
    if (newStage === 'won') {
      await handleConvertToClient();
    } else {
      await supabase.from('Prospect').update({ stage: newStage }).eq('id', prospectId);
      toast({ title: "Deal Progressed", description: `Prospect moved to ${newStage.toUpperCase()}` });
    }
  };

  const handleUpdateAddressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prospect) return;
    const formData = new FormData(e.currentTarget);
    const address = formData.get('billing_address') as string;
    const gstin = formData.get('gstin') as string;
    const legalName = formData.get('legal_business_name') as string;
    const state = formData.get('state') as string;
    const gstType = formData.get('gst_type') as string;

    await supabase.from('Prospect').update({ 
      billing_address: address,
      gstin: gstin,
      legal_business_name: legalName,
      state: state,
      gst_type: gstType
    }).eq('id', prospectId);
    
    toast({ title: "Client Data Saved", description: "Billing address and GST updated." });
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospect) return;

    await supabase.from('Prospect').update({
      company_name: editForm.company_name,
      service_vertical: editForm.service_vertical,
      sub_vertical: editForm.sub_vertical,
      industry: editForm.industry,
      deal_value: parseFloat(editForm.deal_value) || 0,
    }).eq('id', prospectId);
    
    toast({ title: "Details Updated", description: "Prospect record has been synced." });
    setIsEditOpen(false);
  };

  const activeVertical = useMemo(() => 
    CONTENT_VERTICALS.find(v => v.name === editForm.service_vertical), 
  [editForm.service_vertical]);

  if (isTenantLoading || isProspectLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Prospect not found</h2>
        <Button variant="link" onClick={() => router.push("/crm")}>Back to Pipeline</Button>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === prospect.stage);
  const progressValue = ((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/crm")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{prospect.company_name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Prospect ID: <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded uppercase">{prospectId.slice(0,8)}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {prospect.is_converted ? (
            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-xs h-9 px-4 gap-2 flex items-center">
              <CheckCircle2 className="h-4 w-4" /> Converted to Client
            </Badge>
          ) : (
            <Button
              className="rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 gap-2 font-bold"
              onClick={handleConvertToClient}
              disabled={isConverting}
            >
              {isConverting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
              Convert to Client
            </Button>
          )}
          <Link href={`/clients`} className="hidden sm:block">
            <Button variant="outline" className="rounded-xl text-xs h-9 gap-2">
              <Building2 className="h-3.5 w-3.5" /> Full Directory
            </Button>
          </Link>
          <Button 
            className="rounded-xl text-xs h-9 shadow-lg shadow-primary/20 gap-2"
            onClick={() => setIsEditOpen(true)}
            disabled={prospect.is_converted}
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-[10px] bg-white overflow-hidden">
            <CardHeader className="bg-muted/50 pb-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Deal Progression</CardTitle>
                  <CardDescription>Current stage in the sales lifecycle</CardDescription>
                </div>
                <Select onValueChange={handleUpdateStage} defaultValue={prospect.stage}>
                  <SelectTrigger className="w-[180px] rounded-xl h-10">
                    <SelectValue placeholder="Move Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Pipeline Velocity</span>
                  <span className="text-xl font-bold">{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2 rounded-full" />
              </div>
              
              <div className="flex flex-col gap-6 relative px-2">
                {PIPELINE_STAGES.map((s, idx) => {
                  const isCompleted = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const isLast = idx === PIPELINE_STAGES.length - 1;
                  
                  return (
                    <div key={s.id} className="flex gap-6 relative group">
                      {!isLast && (
                        <div className={cn(
                          "absolute left-[15px] top-8 w-0.5 h-[calc(100%+8px)] z-0",
                          idx < currentStageIndex ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                      
                      <div className={cn(
                        "relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                        isCompleted 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                          : "bg-muted text-slate-300"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex flex-col gap-1 pt-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest transition-colors",
                            isCompleted ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {s.name}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] h-4">ACTIVE</Badge>
                          )}
                        </div>
                        {isCompleted && (
                          <div className="space-y-3">
                            <p className="text-[10px] text-muted-foreground font-medium italic prospecting-relaxed">
                              Stage reached successfully.
                            </p>
                            {s.id === 'meeting' && (
                              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                                <Link href={`/proposals?source=crm&prospectId=${prospectId}&companyName=${encodeURIComponent(prospect.company_name)}&vertical=${encodeURIComponent(prospect.service_vertical || '')}&industry=${encodeURIComponent(prospect.industry || '')}`}>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all shadow-sm"
                                  >
                                    <Sparkles className="h-3 w-3 text-accent" /> 
                                    Create Proposal
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[10px] bg-white overflow-hidden">
            <CardHeader className="bg-accent/10/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-foreground" /> Drafted Proposals
              </CardTitle>
              <CardDescription>AI-generated proposals linked to this prospect.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isProposalsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : proposals?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic text-xs">
                  No proposals generated yet. Reach the "Meeting" stage to launch the AI Architect.
                </div>
              ) : (
                <div className="divide-y">
                  {proposals?.map(prop => (
                    <div key={prop.id} className="p-6 flex items-center justify-between hover:bg-muted transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{prop.title}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">{prop.proposal_number} • {prop.status}</p>
                        </div>
                      </div>
                      <Link href={`/proposals`}>
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 text-[10px] font-bold uppercase tracking-wider gap-2">
                          Manage <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[10px] bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-foreground" /> Billing Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAddressSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_business_name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legal Business Name</Label>
                  <Input id="legal_business_name" name="legal_business_name" placeholder="e.g. Acme Corp Pvt Ltd" defaultValue={prospect.legal_business_name} className="rounded-xl font-medium text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">GSTIN (Optional)</Label>
                    <Input id="gstin" name="gstin" placeholder="e.g. 32AAQCM..." defaultValue={prospect.gstin} className="rounded-xl font-mono text-sm uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst_type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">GST Type</Label>
                    <Select name="gst_type" defaultValue={prospect.gst_type || "Intra-state"}>
                      <SelectTrigger className="rounded-xl bg-white shadow-sm h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Intra-state">Intra-state (CGST/SGST)</SelectItem>
                        <SelectItem value="Inter-state">Inter-state (IGST)</SelectItem>
                        <SelectItem value="Export">Export / SEZ</SelectItem>
                        <SelectItem value="Exempt">GST Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">State / Province</Label>
                  <Input id="state" name="state" placeholder="e.g. Maharashtra" defaultValue={prospect.state} className="rounded-xl font-medium text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_address" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Billing Address</Label>
                  <Textarea id="billing_address" name="billing_address" placeholder="Address..." defaultValue={prospect.billing_address} className="rounded-xl min-h-[100px] text-sm" />
                </div>
                <Button type="submit" className="rounded-xl font-bold px-8">Save Context</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-[10px] bg-white">
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-widest text-muted-foreground font-bold">Commercials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Est. Deal Value</p>
                  <h4 className="text-3xl font-bold flex items-center gap-1">
                    <IndianRupee className="h-5 w-5 text-foreground" />
                    {(prospect.deal_value || 0).toLocaleString()}
                  </h4>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[9px] font-bold">Active Deal</Badge>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Probability</span>
                  <span className="font-bold">{prospect.stage === 'won' ? '100%' : prospect.stage === 'negotiation' ? '85%' : '45%'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Expected Close</span>
                  <span className="font-bold">Mar 30, 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[10px] bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Prospect Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[10px] bg-accent/5 flex items-center justify-center text-accent">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-base prospecting-none">{prospect.service_vertical || 'General Production'}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Service Vertical</p>
                  </div>
                </div>
                {prospect.sub_vertical && (
                  <div className="flex items-center gap-4 pl-4 border-l-2 border-border">
                    <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center text-foreground">
                      <ListTree className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm prospecting-none">{prospect.sub_vertical}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Sub Category</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-xs">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Industry: {prospect.industry || 'Media Production'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Prospect Source: Referral</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created: {prospect.created_at?.toDate ? prospect.created_at.toDate().toLocaleDateString() : 'Just now'}</span>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="w-full rounded-xl h-10 text-xs font-bold uppercase tracking-wider"
                onClick={() => setIsEditOpen(true)}
              >
                Update Context
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Edit Prospect
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDetails} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={editForm.company_name} onChange={(e) => setEditForm({...editForm, company_name: e.target.value})} required className="rounded-xl" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Service Vertical</Label>
                <Select value={editForm.service_vertical} onValueChange={(val) => setEditForm({...editForm, service_vertical: val, sub_vertical: ""})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_VERTICALS.map(v => (
                      <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub Vertical</Label>
                <Select 
                  disabled={!editForm.service_vertical}
                  value={editForm.sub_vertical} 
                  onValueChange={(val) => setEditForm({...editForm, sub_vertical: val})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select sub category" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVertical?.services.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={editForm.industry} onChange={(e) => setEditForm({...editForm, industry: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Deal Value (₹)</Label>
                <Input type="number" value={editForm.deal_value} onChange={(e) => setEditForm({...editForm, deal_value: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full rounded-xl h-11 font-bold">Save Prospect Details</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
