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

export default function ClientPortfolioPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const router = useRouter();

  // Create Lead State
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLead, setNewLead] = useState({
    title: "",
    value: ""
  });

  // 1. Fetch Client Info from Supabase Client table
  const { data: rawClient, isLoading: isClientLoading } = useSupabaseDoc('Client', clientId);
  const client = useMemo(() => rawClient ? { ...rawClient, company_name: rawClient.name } : null, [rawClient]);

  // 2. Fetch Projects for this client from Supabase
  const { data: projects, isLoading: isProjectsLoading } = useSupabaseCollection('Project', {
    where: { client_name: client?.company_name },
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
  const { data: allRelatedLeads } = useSupabaseCollection('Prospect', {
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
    const active = projects.filter(p => p.status === 'in_progress');
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
      await supabase.from('Prospect').insert({
        company_id: companyId,
        company_name: client.company_name,
        industry: client.industry,
        service_vertical: client.service_vertical,
        deal_value: parseFloat(newLead.value) || 0,
        stage: 'lead',
      });

      toast({ 
        title: "Sales Lead Created", 
        description: `A new opportunity for ${client.company_name} has been added to the pipeline.` 
      });

      setNewLead({ title: "", value: "" });
      setIsCreateLeadOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not create sales lead." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTenantLoading || isClientLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-primary">Partner Profile Not Found</h2>
        <Button variant="link" onClick={() => router.push("/clients")} className="mt-2">Return to Directory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm border" onClick={() => router.push("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{client.company_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest">{client.industry}</Badge>
              <span className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {client.location || 'Registry Focus'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateLeadOpen(true)} className="rounded-xl shadow-lg shadow-primary/20 font-bold text-xs h-10 gap-2">
            <Plus className="h-4 w-4" /> Create Lead
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-none shadow-sm rounded-[10px] bg-white border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Active Work</p>
            <h4 className="text-2xl font-black text-primary">{activeProjectsStats.count} Projects</h4>
            <p className="text-[9px] text-primary font-bold mt-1">₹{activeProjectsStats.totalValue.toLocaleString()} Aggregate Value</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm rounded-[10px] bg-accent/10 border-l-4 border-l-indigo-500">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Sales Pipeline</p>
            <h4 className="text-2xl font-black text-accent">{pipelineStats.count} Opportunities</h4>
            <p className="text-[9px] text-accent font-bold mt-1">₹{pipelineStats.totalValue.toLocaleString()} Projected Value</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[10px] bg-accent/10 border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Pending Invoices</p>
            <h4 className="text-2xl font-black text-accent">{invoiceStats.pendingCount} Unpaid</h4>
            <p className="text-[9px] text-accent font-bold mt-1">₹{invoiceStats.pendingValue.toLocaleString()} Outstanding</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-none shadow-sm rounded-[10px] text-white border-l-4 transition-colors",
          totals.profit >= 0 ? "bg-emerald-600 border-l-emerald-400" : "bg-accent border-l-rose-400"
        )}>
          <CardContent className="pt-6">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Net Performance</p>
            <h4 className="text-2xl font-black">₹{totals.profit.toLocaleString()}</h4>
            <p className="text-[9px] text-white/40 font-bold mt-1">Life-to-date Margin</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Context */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-[10px] overflow-hidden bg-white">
            <CardHeader className="bg-muted/50 border-b pb-6 px-8">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Classification Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Primary Liaison</p>
                    <p className="font-bold text-sm text-primary">{client.contact_person || 'Liaison Unassigned'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Communication</p>
                    <p className="font-bold text-sm text-primary truncate max-w-[200px]">{client.email || 'No email provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">GSTIN Registry</p>
                    <p className="font-mono font-bold text-xs uppercase text-primary/80">{client.gstin || 'PENDING RECORD'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-2">
                  <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/5">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Billing Logic Context</p>
                    <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed italic">{client.billing_address || 'Address context pending update.'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Vertical Focus</span>
                  <Badge variant="secondary" className="rounded-lg text-[9px] font-black bg-primary/5 text-primary border-none">
                    {client.service_vertical || 'General Media'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft rounded-[10px] bg-primary text-white p-10 space-y-6 relative overflow-hidden">
            <Sparkles className="absolute top-0 right-0 p-8 opacity-10 h-24 w-24" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-lg">AI Architect</h4>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Generate a high-premium production strategy tailored for {client.company_name}.
            </p>
            <Link href={`/proposals?source=crm&leadId=${clientId}&companyName=${encodeURIComponent(client.company_name)}&vertical=${encodeURIComponent(client.service_vertical || '')}&industry=${encodeURIComponent(client.industry || '')}`} className="block pt-2">
              <Button className="w-full bg-white text-primary hover:bg-muted font-black uppercase text-[10px] tracking-widest rounded-xl h-11 shadow-xl shadow-black/20">
                Initialize Architect
              </Button>
            </Link>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-8 space-y-8">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-border w-full justify-start rounded-none mb-8">
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-black uppercase tracking-widest px-0 pb-3 transition-all">Production History</TabsTrigger>
              <TabsTrigger value="pipeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-black uppercase tracking-widest px-0 pb-3 transition-all">Sales Pipeline</TabsTrigger>
              <TabsTrigger value="finance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-black uppercase tracking-widest px-0 pb-3 transition-all">Financial Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isProjectsLoading ? (
                <div className="py-24 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
              ) : projectAnalytics.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[10px] border-2 border-dashed border-border px-8">
                  <div className="h-16 w-16 bg-muted rounded-[10px] flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Zero Productions Found</p>
                  <p className="text-xs text-muted-foreground mt-2">Initialize your first workspace to begin tracking.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projectAnalytics.map((proj) => (
                    <Card key={proj.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[10px] overflow-hidden group bg-white border border-slate-50 flex flex-col">
                      <CardHeader className="bg-muted/50 pb-6 pt-8 px-8 border-b border-white/50">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-white px-3">
                            {proj.status?.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{proj.progress}%</span>
                        </div>
                        <Link href={`/projects/${proj.id}`}>
                          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors cursor-pointer leading-tight">{proj.project_name}</CardTitle>
                        </Link>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Project Pulse</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full",
                              proj.profit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-accent/10 text-accent"
                            )}>
                              {proj.margin.toFixed(1)}% Margin
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/80 p-4 rounded-[10px] border border-white">
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">Billed</p>
                              <p className="text-sm font-bold text-primary">₹{proj.billed.toLocaleString()}</p>
                            </div>
                            <div className="bg-muted/80 p-4 rounded-[10px] border border-white">
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">Burn</p>
                              <p className="text-sm font-bold text-accent">₹{proj.burn.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-6 border-t flex justify-between items-center">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                                <Building2 className="h-3.5 w-3.5 opacity-20" />
                              </div>
                            ))}
                          </div>
                          <Link href={`/projects/${proj.id}`}>
                            <Button variant="ghost" size="sm" className="h-9 rounded-[10px] text-[10px] font-black uppercase tracking-widest gap-2 bg-muted hover:bg-primary hover:text-white transition-all px-5">
                              Open Workspace <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {pipelineStats.items.length === 0 ? (
                <div className="py-32 text-center bg-white rounded-[10px] border-2 border-dashed border-border px-8">
                  <div className="h-16 w-16 bg-muted rounded-[10px] flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Target className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Pipeline Empty</p>
                  <p className="text-xs text-muted-foreground mt-2">Create a new lead to start tracking opportunities for this client.</p>
                  <Button onClick={() => setIsCreateLeadOpen(true)} variant="outline" className="mt-6 rounded-xl font-black text-[10px] uppercase tracking-widest px-8">
                    Create Lead
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pipelineStats.items.map((lead) => {
                    const stage = PIPELINE_STAGES.find(s => s.id === lead.stage);
                    return (
                      <Card key={lead.id} className="border-none shadow-sm rounded-[10px] overflow-hidden group bg-white border border-slate-50 flex flex-col">
                        <CardHeader className="bg-accent/10/30 pb-6 pt-8 px-8">
                          <div className="flex justify-between items-start mb-4">
                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none px-3", stage?.color || 'bg-muted text-muted-foreground/80')}>
                              {stage?.name || 'Prospect'}
                            </Badge>
                            <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full">CRM Opportunity</span>
                          </div>
                          <Link href={`/crm/${lead.id}`}>
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors cursor-pointer leading-tight">
                              {lead.service_vertical || 'General Opportunity'}
                            </CardTitle>
                          </Link>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Pipeline Status</span>
                              <span>Est. Value</span>
                            </div>
                            <div className="bg-muted/80 p-5 rounded-[10px] border border-white flex justify-between items-center">
                              <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">Current Focus</p>
                                <p className="text-sm font-bold text-primary">{lead.industry || 'Media'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">Deal Projection</p>
                                <p className="text-lg font-black text-accent">₹{lead.deal_value?.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="pt-6 border-t flex justify-end">
                            <Link href={`/crm/${lead.id}`}>
                              <Button variant="ghost" size="sm" className="h-9 rounded-[10px] text-[10px] font-black uppercase tracking-widest gap-2 bg-muted hover:bg-primary hover:text-white transition-all px-5">
                                Manage Pipeline <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finance" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                {invoiceStats.pendingCount > 0 && (
                  <Alert className="bg-accent/10 border-accent/20 rounded-[10px] p-6">
                    <AlertCircle className="h-5 w-5 text-accent" />
                    <div className="ml-4">
                      <h4 className="text-sm font-black text-accent uppercase tracking-widest">Attention Required</h4>
                      <p className="text-xs text-accent mt-1">
                        There are <strong>{invoiceStats.pendingCount}</strong> outstanding invoices totaling <strong>₹{invoiceStats.pendingValue.toLocaleString()}</strong> for this client.
                      </p>
                    </div>
                  </Alert>
                )}

                <Card className="border-none shadow-sm rounded-[10px] overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="px-10 py-5 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Invoice #</th>
                            <th className="px-10 py-5 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Context Date</th>
                            <th className="px-10 py-5 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Total Amount</th>
                            <th className="px-10 py-5 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-10 py-5 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {isInvoicesLoading ? (
                            <tr><td colSpan={5} className="text-center py-16"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-20" /></td></tr>
                          ) : invoices?.length === 0 ? (
                            <tr><td colSpan={5} className="px-10 py-24 text-center text-muted-foreground italic text-xs font-bold uppercase tracking-widest opacity-40">No Billing Records Generated.</td></tr>
                          ) : (
                            invoices?.map((inv) => (
                              <tr key={inv.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="px-10 py-6 font-mono font-bold text-primary">{inv.invoice_number}</td>
                                <td className="px-10 py-6 text-muted-foreground font-bold text-xs uppercase tracking-tighter">{inv.issue_date}</td>
                                <td className="px-10 py-6 font-black text-primary text-xs">₹{inv.total?.toLocaleString()}</td>
                                <td className="px-10 py-6">
                                  <Badge variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} className={cn("text-[9px] font-black uppercase px-3 py-1 border-none", inv.payment_status !== 'paid' && "bg-accent/10 text-accent")}>
                                    {inv.payment_status}
                                  </Badge>
                                </td>
                                <td className="px-10 py-6 text-right">
                                  <Link href={`/invoices/${inv.id}`}>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 hover:bg-primary hover:text-white rounded-xl">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateLeadOpen} onOpenChange={setIsCreateLeadOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-accent" />
              Create Sales Lead
            </DialogTitle>
            <DialogDescription>
              Initialize a new sales opportunity for {client.company_name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="leadTitle">Opportunity Title</Label>
              <Input 
                id="leadTitle" 
                placeholder="e.g. Summer Campaign 2024" 
                value={newLead.title}
                onChange={(e) => setNewLead({...newLead, title: e.target.value})}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealValue">Projected Value (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="dealValue" 
                  type="number"
                  placeholder="50000" 
                  value={newLead.value}
                  onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                  className="rounded-xl h-11 pl-9"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Initialize Opportunity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
