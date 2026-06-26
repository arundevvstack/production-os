"use client";

import { use, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Receipt, 
  ArrowLeft, 
  Loader2, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  Mail, 
  Building2, 
  DollarSign, 
  PieChart, 
  User, 
  FileText, 
  MapPin, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Phone, 
  CreditCard, 
  ChevronRight, 
  Plus,
  Target,
  IndianRupee,
  AlertCircle,
  Layers,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseDoc } from "@/supabase/hooks/use-doc";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { PIPELINE_STAGES } from "@/lib/constants";
import { CreateProjectWizard } from "@/components/projects/create-project-wizard";
import ProjectWorkspacePage from "@/app/(dashboard)/projects/[projectId]/page";

export default function ClientPortfolioPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const { companyId, isLoading: isTenantLoading, roleId } = useTenant();
  const router = useRouter();

  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasFinancialInsightsAccess = useMemo(() => {
    return roleId !== 'EMPLOYEE' && roleId !== 'MANAGER';
  }, [roleId]);

  const [newLead, setNewLead] = useState({
    title: "",
    value: ""
  });
  
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [openWorkspaceId, setOpenWorkspaceId] = useState<string | null>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);

  const handleUpload = async (file: File, type: 'logo' | 'wallpaper') => {
    if (!companyId || !client) return;
    
    const isLogo = type === 'logo';
    isLogo ? setIsUploadingLogo(true) : setIsUploadingWallpaper(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const res = await fetch(`/api/v1/clients/${clientId}/assets`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      toast({ title: 'Success', description: `${type === 'logo' ? 'Logo' : 'Wallpaper'} updated successfully` });
      // Force reload to see changes
      window.location.reload();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      isLogo ? setIsUploadingLogo(false) : setIsUploadingWallpaper(false);
    }
  };

  // 1. Fetch Client Info from Supabase Client table
  const { data: rawClient, isLoading: isClientLoading } = useSupabaseDoc('Client', clientId);
  const client = useMemo(() => rawClient ? { ...rawClient, company_name: rawClient.name } : null, [rawClient]);

  // 2. Fetch Projects for this client from Supabase
  const { data: projects, isLoading: isProjectsLoading, refetch: reloadProjects } = useSupabaseCollection('Project', {
    where: { company_id: companyId, client_id: clientId },
    orderBy: { created_at: 'desc' }
  });

  // 3. Fetch Invoices for this client from Supabase
  const { data: invoices, isLoading: isInvoicesLoading } = useSupabaseCollection('Invoice', {
    where: { client_id: clientId },
    orderBy: { created_at: 'desc' }
  });

  // 4. Fetch All Expenses for the company from Supabase
  const { data: allExpenses } = useSupabaseCollection('Expense', {
    where: { company_id: companyId }
  });

  // 5. Fetch all leads for this company from Supabase
  const { data: allRelatedLeads, refetch: reloadLeads } = useSupabaseCollection('Prospect', {
    where: { company_name: client?.company_name }
  });

  // --- ANALYTICS ---

  const pipelineStats = useMemo(() => {
    if (!allRelatedLeads) return { count: 0, totalValue: 0, items: [] };
    const pipelineItems = allRelatedLeads.filter(l => 
      !['client', 'won', 'lost'].includes(l.stage || '')
    );
    const totalValue = pipelineItems.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    return { count: pipelineItems.length, totalValue, items: pipelineItems };
  }, [allRelatedLeads]);

  const activeProjectsStats = useMemo(() => {
    if (!projects) return { count: 0, totalValue: 0 };
    const active = projects.filter(p => p.status === 'in_progress' || p.status === 'active');
    const totalValue = active.reduce((sum, p) => sum + (p.budget || 0), 0);
    return { count: active.length, totalValue };
  }, [projects]);

  const invoiceStats = useMemo(() => {
    if (!invoices) return { pendingCount: 0, pendingValue: 0 };
    const pending = invoices.filter(inv => inv.payment_status === 'unpaid');
    const total = pending.reduce((sum, inv) => sum + (inv.total || 0), 0);
    return { pendingCount: pending.length, pendingValue: total };
  }, [invoices]);

  const projectAnalytics = useMemo(() => {
    if (!projects) return [];
    
    return projects.map(proj => {
      const projectInvoices = invoices?.filter(inv => inv.project_id === proj.id) || [];
      const revenue = projectInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
      const billed = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      const projectExpenses = allExpenses?.filter(ex => ex.project_id === proj.id) || [];
      const burn = projectExpenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
      
      const profit = revenue - burn;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        ...proj,
        revenue,
        billed,
        burn,
        profit,
        margin
      };
    });
  }, [projects, invoices, allExpenses]);

  const totals = useMemo(() => {
    const revenue = projectAnalytics.reduce((sum, p) => sum + p.revenue, 0);
    const burn = projectAnalytics.reduce((sum, p) => sum + p.burn, 0);
    const profit = revenue - burn;
    return { revenue, burn, profit };
  }, [projectAnalytics]);

  // --- ACTIONS ---

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !client || !newLead.title) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('Prospect').insert({
        id: crypto.randomUUID(),
        company_id: companyId,
        company_name: client.company_name,
        industry: client.industry,
        service_vertical: newLead.title,
        deal_value: parseFloat(newLead.value) || 0,
        stage: 'new_lead',
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ 
        title: "Sales Lead Created", 
        description: `A new opportunity for ${client.company_name} has been added to the pipeline.` 
      });

      setNewLead({ title: "", value: "" });
      setIsCreateLeadOpen(false);
      reloadLeads();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error?.message || "Could not create sales lead." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTenantLoading || isClientLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Partner Profile Not Found</h2>
        <Button variant="link" onClick={() => router.push("/clients")} className="mt-2">Return to Directory</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden -m-4 md:-m-8 bg-slate-50 dark:bg-slate-950">
      {/* OUTLOOK HEADER / RIBBON */}
      <div 
        className="flex-none border-b border-border px-6 py-4 flex items-center justify-between z-10 shadow-sm shrink-0 relative overflow-hidden group"
        style={{ backgroundColor: client.wallpaper_url ? 'transparent' : undefined }}
      >
        {/* WALLPAPER LAYER */}
        <div 
          className={cn(
            "absolute inset-0 z-0 bg-white dark:bg-slate-900 transition-all",
            client.wallpaper_url && "bg-cover bg-center"
          )}
          style={{ backgroundImage: client.wallpaper_url ? `url(${client.wallpaper_url})` : undefined }}
        >
          {client.wallpaper_url && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm" />}
        </div>

        {/* Edit Wallpaper Button (Visible on Hover) */}
        <div className="absolute top-2 right-1/2 translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Label className="cursor-pointer bg-black/50 hover:bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md transition-colors">
            {isUploadingWallpaper ? "Uploading..." : "Change Wallpaper"}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'wallpaper')}
              disabled={isUploadingWallpaper}
            />
          </Label>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <Button variant="ghost" size="icon" className="rounded-xl bg-muted/50 hover:bg-muted" onClick={() => router.push("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* LOGO UPLOAD AREA */}
          <div className="relative group/logo">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-border shrink-0 shadow-sm">
              {client.logo_url ? (
                <img src={client.logo_url} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <Label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover/logo:opacity-100 cursor-pointer transition-opacity rounded-xl backdrop-blur-sm">
              {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="text-[8px] font-bold uppercase mt-0.5">Edit</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
                disabled={isUploadingLogo}
              />
            </Label>
          </div>

          <div>
            <h1 className="text-xl font-black text-foreground leading-none tracking-tight">{client.company_name}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge className="bg-primary/10 text-foreground border-none text-[9px] font-black uppercase tracking-widest">{client.industry}</Badge>
              <span className="text-muted-foreground text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                <MapPin className="h-3 w-3" /> {client.location || 'Registry Focus'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button onClick={() => setIsCreateProjectOpen(true)} variant="outline" className="rounded-xl font-bold text-xs h-9 gap-2 border-primary/20 text-foreground hover:bg-primary/5 bg-white/50 backdrop-blur-md">
            <Briefcase className="h-3.5 w-3.5" /> Create Workspace
          </Button>
          {hasFinancialInsightsAccess && (
          <Button onClick={() => setIsCreateLeadOpen(true)} className="rounded-xl shadow-lg shadow-primary/20 font-bold text-xs h-9 gap-2">
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </Button>
          )}
        </div>
      </div>

      {/* PANES CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: INBOX / LIST */}
        <div className="w-80 lg:w-96 flex-none bg-white dark:bg-slate-900 border-r border-border flex flex-col shadow-sm relative z-0">
          <Tabs defaultValue="history" className="w-full flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-border shrink-0">
              <TabsList className="bg-muted p-1 h-10 w-full grid grid-cols-3 rounded-[10px]">
                <TabsTrigger value="history" className="text-[9px] font-black uppercase tracking-widest rounded-md">Workspaces</TabsTrigger>
                {hasFinancialInsightsAccess && <TabsTrigger value="pipeline" className="text-[9px] font-black uppercase tracking-widest rounded-md">Pipeline</TabsTrigger>}
                {hasFinancialInsightsAccess && <TabsTrigger value="finance" className="text-[9px] font-black uppercase tracking-widest rounded-md">Ledger</TabsTrigger>}
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {/* PROJECTS LIST */}
              <TabsContent value="history" className="m-0 space-y-2 h-full">
                {isProjectsLoading ? (
                  <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-50" /></div>
                ) : projectAnalytics.length === 0 ? (
                  <div className="py-10 text-center px-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground opacity-20 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Workspaces</p>
                  </div>
                ) : (
                  projectAnalytics.map((proj) => (
                    <div 
                      key={proj.id} 
                      onClick={() => setOpenWorkspaceId(proj.id)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all text-left",
                        openWorkspaceId === proj.id 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-transparent hover:border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{proj.status?.replace('_', ' ')}</span>
                        <span className="text-[9px] font-black bg-muted px-2 py-0.5 rounded-full">{proj.progress}%</span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground leading-tight mb-2">{proj.project_name}</h4>
                      {hasFinancialInsightsAccess && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Margin: {proj.margin.toFixed(0)}%</span>
                        <span className={proj.profit >= 0 ? "text-emerald-500" : "text-rose-500"}>₹{proj.profit.toLocaleString()}</span>
                      </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              {/* PIPELINE LIST */}
              <TabsContent value="pipeline" className="m-0 space-y-2 h-full">
                {pipelineStats.items.length === 0 ? (
                  <div className="py-10 text-center px-4">
                    <Target className="h-8 w-8 text-muted-foreground opacity-20 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Empty Pipeline</p>
                  </div>
                ) : (
                  pipelineStats.items.map((lead) => {
                    const stage = PIPELINE_STAGES.find(s => s.id === lead.stage);
                    return (
                      <Link href={`/crm/${lead.id}`} key={lead.id} className="block p-4 rounded-xl border border-transparent hover:border-border bg-white dark:bg-slate-900 hover:bg-muted/50 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", stage?.color || 'bg-muted')}>{stage?.name || 'Prospect'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground leading-tight mb-2">{lead.service_vertical || 'General Opportunity'}</h4>
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                          <span>Est. Value</span>
                          <span className="text-accent">₹{lead.deal_value?.toLocaleString()}</span>
                        </div>
                      </Link>
                    )
                  })
                )}
              </TabsContent>

              {/* FINANCE LIST */}
              <TabsContent value="finance" className="m-0 space-y-2 h-full">
                {isInvoicesLoading ? (
                  <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-50" /></div>
                ) : !invoices || invoices.length === 0 ? (
                  <div className="py-10 text-center px-4">
                    <Receipt className="h-8 w-8 text-muted-foreground opacity-20 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Invoices</p>
                  </div>
                ) : (
                  invoices.map((inv) => (
                    <Link href={`/invoices/${inv.id}`} key={inv.id} className="block p-4 rounded-xl border border-transparent hover:border-border bg-white dark:bg-slate-900 hover:bg-muted/50 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">{inv.invoice_number}</span>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                          {inv.payment_status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{inv.issue_date}</span>
                        <span className="text-sm font-black text-foreground">₹{inv.total?.toLocaleString()}</span>
                      </div>
                    </Link>
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* RIGHT PANE: READING PANE */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 relative overflow-y-auto custom-scrollbar">
          {openWorkspaceId ? (
            <div className="p-6 min-h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex-1 border border-border rounded-2xl overflow-hidden shadow-premium bg-white dark:bg-slate-900 relative min-h-[600px]">
                <ProjectWorkspacePage providedProjectId={openWorkspaceId} onBack={() => setOpenWorkspaceId(null)} />
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* OVERVIEW STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Work</p>
                    <h4 className="text-2xl font-black text-foreground">{activeProjectsStats.count}</h4>
                    {hasFinancialInsightsAccess && <p className="text-[9px] text-muted-foreground font-bold mt-1">₹{activeProjectsStats.totalValue.toLocaleString()} Value</p>}
                  </CardContent>
                </Card>
                {hasFinancialInsightsAccess && (
                  <>
                  <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pipeline</p>
                      <h4 className="text-2xl font-black text-foreground">{pipelineStats.count}</h4>
                      <p className="text-[9px] text-muted-foreground font-bold mt-1">₹{pipelineStats.totalValue.toLocaleString()} Value</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-rose-500">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Unpaid</p>
                      <h4 className="text-2xl font-black text-foreground">{invoiceStats.pendingCount}</h4>
                      <p className="text-[9px] text-muted-foreground font-bold mt-1">₹{invoiceStats.pendingValue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className={cn("border-none shadow-sm rounded-2xl text-white border-l-4", totals.profit >= 0 ? "bg-emerald-600 border-l-emerald-400" : "bg-accent border-l-rose-400")}>
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Net Margin</p>
                      <h4 className="text-2xl font-black">₹{totals.profit.toLocaleString()}</h4>
                      <p className="text-[9px] text-white/40 font-bold mt-1">Life-to-date</p>
                    </CardContent>
                  </Card>
                  </>
                )}
              </div>

              {/* CLIENT DETAILS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900">
                  <CardHeader className="bg-muted/50 border-b pb-4 px-6">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Classification Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0"><User className="h-4 w-4" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Primary Liaison</p>
                          <p className="font-bold text-sm">{client.contact_person || 'Unassigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0"><Mail className="h-4 w-4" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Communication</p>
                          <p className="font-bold text-sm truncate">{client.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0"><CreditCard className="h-4 w-4" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">GSTIN Registry</p>
                          <p className="font-mono font-bold text-xs uppercase">{client.gstin || 'PENDING'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {hasFinancialInsightsAccess && (
                <Card className="border-none shadow-premium rounded-2xl bg-primary text-white p-8 relative overflow-hidden flex flex-col justify-center">
                  <Sparkles className="absolute top-0 right-0 p-8 opacity-10 h-32 w-32" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Zap className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-lg">Proposal Generator</h4>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed mb-6">
                    Generate a high-premium production strategy tailored for {client.company_name}.
                  </p>
                  <Link href={`/proposals?source=crm&leadId=${clientId}&companyName=${encodeURIComponent(client.company_name)}&vertical=${encodeURIComponent(client.service_vertical || '')}&industry=${encodeURIComponent(client.industry || '')}`}>
                    <Button className="w-full bg-white dark:bg-slate-900 text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest rounded-xl h-11 shadow-xl shadow-black/20">
                      Create Proposal
                    </Button>
                  </Link>
                </Card>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isCreateLeadOpen} onOpenChange={setIsCreateLeadOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-accent" /> Create Sales Lead
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Opportunity Title</Label>
              <Input 
                placeholder="e.g. Summer Campaign" 
                value={newLead.title}
                onChange={(e) => setNewLead({...newLead, title: e.target.value})}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Projected Value (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  value={newLead.value}
                  onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                  className="rounded-xl h-11 pl-9"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Initialize Opportunity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateProjectWizard 
        isOpen={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen} 
        defaultValues={{ client_name: client.company_name }}
        onSuccess={() => reloadProjects()}
      />
    </div>
  );
}

function Alert({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex items-start border p-4", className)}>
      {children}
    </div>
  );
}
