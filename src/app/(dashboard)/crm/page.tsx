
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MoreHorizontal, 
  Building2, 
  Search, 
  Loader2, 
  IndianRupee, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Database, 
  Zap, 
  Archive, 
  List,
  Target,
  CheckCircle2,
  ListTree,
  X,
  Lock,
  BarChart3,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { PIPELINE_STAGES } from "@/lib/mock-data";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
} from "@/components/ui/alert-dialog";
import { CONTENT_VERTICALS } from "../clients/page";
import { UnifiedClientSelector } from "@/components/unified-client-selector";

export default function CRMPage() {
  const { profile, isLoading: isTenantLoading, companyId, roleId, isSuperAdmin } = useTenant();
  
  // Strict page-level permission guard (Phase 3)
  const isAuthorized = roleId === 'SUPER_ADMIN' || roleId === 'MANAGER' || roleId === 'MARKETING_SALES' || isSuperAdmin;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadToArchive, setLeadToArchive] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Quick Add State
  const [newLead, setNewLead] = useState({
    company_name: "",
    service_vertical: "",
    sub_vertical: "",
    industry: "",
    deal_value: "",
    stage: "lead"
  });

  // Fetch Prospects from Supabase
  const { data: allLeads, isLoading: isLeadsLoading } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  const [localLeads, setLocalLeads] = useState<any[]>([]);

  useEffect(() => {
    if (allLeads) {
      setLocalLeads(allLeads);
    }
  }, [allLeads]);

  // Derived: Verified partners for the dropdown
  const uniqueClients = useMemo(() => {
    if (!localLeads) return [];
    const partnersMap: Record<string, any> = {};
    
    // Only pick companies that are officially onboarded ('client' stage)
    localLeads.forEach(l => {
      if (l.stage === 'client') {
        partnersMap[l.company_name] = {
          id: l.id,
          name: l.company_name,
          industry: l.industry
        };
      }
    });
    
    return Object.values(partnersMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [localLeads]);

  const filteredLeads = useMemo(() => {
    if (!localLeads) return [];
    // Movement Logic: Only show active pipeline items (exclude official partners and closed/won deals)
    return localLeads.filter(l => 
      !['client', 'won'].includes(l.stage || '') && (
        (l.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.service_vertical || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.sub_vertical || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [localLeads, searchQuery]);

  const handleSelectUnified = (cData: any) => {
    setNewLead(prev => ({
      ...prev,
      company_name: String(cData.company_name || ""),
      industry: String(cData.industry || ""),
      service_vertical: String(cData.service_vertical || ""),
      sub_vertical: String(cData.sub_vertical || "")
    }));
    
    toast({
      title: "Client Linked",
      description: `Lead context inherited from ${cData.company_name}.`,
    });
  };

  const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newLead.company_name) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a client company from your directory." });
      return;
    }

    setIsSubmitting(true);
    
    const newLeadId = generateId();
    const { error } = await supabase.from('Prospect').insert({
      id: newLeadId,
      company_id: companyId,
      ...newLead,
      deal_value: parseFloat(newLead.deal_value) || 0,
    });

    if (error) {
      toast({ variant: "destructive", title: "Creation Failed", description: error.message });
    } else {
      toast({
        title: "Lead Created",
        description: `${newLead.company_name} opportunity is now live in the pipeline.`,
      });
      // Spot Update!
      setLocalLeads(prev => [
        {
          id: newLeadId,
          company_id: companyId,
          ...newLead,
          deal_value: parseFloat(newLead.deal_value) || 0,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setNewLead({ company_name: "", service_vertical: "", sub_vertical: "", industry: "", deal_value: "", stage: "lead" });
      setIsAddOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleMarkAsWon = async (lead: any) => {
    if (!companyId || !lead) return;

    // Spot Update! Update local stage instantly so it drops out of active columns
    setLocalLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'won' } : l));

    // 1. Update Prospect Status in Supabase
    await supabase.from('Prospect').update({ stage: 'won' }).eq('id', lead.id);

    // 2. Create Project Workspace in Supabase
    const projectRefCode = `PROJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newProjectId = generateId();
    
    const { error } = await supabase.from('Project').insert({
      id: newProjectId,
      company_id: companyId,
      project_name: lead.company_name,
      client_name: lead.company_name,
      project_ref: projectRefCode,
      budget: lead.deal_value || 0,
      status: 'in_progress',
      progress: 0,
      color: 'card-purple',
    });

    if (error) {
      toast({ variant: "destructive", title: "Project Creation Failed", description: error.message });
      // Rollback on error
      setLocalLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: lead.stage } : l));
    } else {
      toast({ 
        title: "Success! Deal Converted", 
        description: `"${lead.company_name}" has moved from the pipeline to an active production workspace.` 
      });
    }
  };

  const handleConfirmArchive = async () => {
    if (!companyId || !leadToArchive) return;
    
    const archivedLead = leadToArchive;
    // Spot Update! Remove from local leads list instantly
    setLocalLeads(prev => prev.filter(l => l.id !== archivedLead.id));

    // Archive Prospect in Supabase
    await supabase.from('Archive').insert({
      ...archivedLead,
      archive_type: 'prospect',
      archived_at: new Date().toISOString()
    });

    // Delete Prospect from active table
    await supabase.from('Prospect').delete().eq('id', archivedLead.id);

    toast({ title: "Lead Archived", description: "The lead has been moved to archives." });
    setLeadToArchive(null);
  };

  const activeVertical = useMemo(() => 
    CONTENT_VERTICALS.find(v => v.name === newLead.service_vertical), 
  [newLead.service_vertical]);

  if (isTenantLoading) {
    return (
      <div className="flex h-full items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initializing CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-6 font-body">
        <div className="p-4 bg-rose-50 rounded-full text-rose-500 shadow-xl shadow-rose-100/50">
          <Lock className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Clearance Blocked</h2>
          <p className="text-slate-500 font-medium max-w-sm">You do not possess the required credentials to access the Corporate Growth pipeline.</p>
        </div>
        <Link href="/dashboard">
          <Button className="rounded-xl h-11 px-6 font-bold gap-2">
             Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (isLeadsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Cinematic Header Block */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
        {/* Background glow */}
        <div className="absolute -top-4 -left-4 w-72 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-red-500 rounded-full shadow-lg shadow-red-500/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">DP Media OS</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Leads</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Track potential projects and manage client relations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Find a lead..." 
              className="pl-10 h-11 rounded-[10px] bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-[10px] bg-red-600 hover:bg-red-500 text-white h-11 px-6 font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px] rounded-[10px] p-0 border border-slate-100 bg-white text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="relative p-8 pb-6 border-b border-slate-100">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                <DialogHeader className="relative">
                  <DialogTitle className="flex items-center gap-3 text-2xl font-black text-slate-800">
                    <div className="h-10 w-10 rounded-[10px] bg-red-50 border border-red-100 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-red-500" />
                    </div>
                    Add New Lead
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs mt-1">
                    Enter details for a new potential project.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <form onSubmit={handleAddLead} className="p-8 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                    Select Client Company
                  </Label>
                  <UnifiedClientSelector 
                    companyId={companyId || ''} 
                    value={newLead.company_name}
                    onSelect={handleSelectUnified}
                    placeholder="Select a client..."
                    className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 shadow-sm"
                    showOnboardOption={false}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Service Category</Label>
                    <Select 
                      value={newLead.service_vertical} 
                      onValueChange={(val) => setNewLead(prev => ({...prev, service_vertical: val, sub_vertical: ""}))}
                    >
                      <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                        <SelectValue placeholder="Select vertical" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                        {CONTENT_VERTICALS.map(v => (
                          <SelectItem key={v.id} value={v.name} className="text-xs focus:bg-red-50 focus:text-red-700 rounded-xl cursor-pointer">{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Service</Label>
                    <Select 
                      disabled={!newLead.service_vertical}
                      value={newLead.sub_vertical} 
                      onValueChange={(val) => setNewLead(prev => ({...prev, sub_vertical: val}))}
                    >
                      <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 disabled:opacity-40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ListTree className="h-3 w-3 text-slate-500" />
                          <SelectValue placeholder={newLead.service_vertical ? "Select a service" : "Select category first"} />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                        {activeVertical?.services.map(s => (
                          <SelectItem key={s} value={s} className="text-xs focus:bg-red-50 focus:text-red-700 rounded-xl cursor-pointer">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Budget (₹)</Label>
                    <Input 
                      id="value" 
                      type="number"
                      placeholder="25000" 
                      value={newLead.deal_value}
                      onChange={(e) => setNewLead(prev => ({...prev, deal_value: e.target.value}))}
                      className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Status</Label>
                    <Select onValueChange={(val) => setNewLead(prev => ({...prev, stage: val}))} value={newLead.stage}>
                      <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                        {PIPELINE_STAGES.filter(s => s.id !== 'won').map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs focus:bg-red-50 focus:text-red-700 rounded-xl cursor-pointer">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-[10px] h-12 font-black text-xs uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={() => setShowAnalytics(!showAnalytics)} 
            className="gap-2 rounded-[10px] h-11 px-5 font-black text-xs uppercase tracking-wider border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
          >
            <BarChart3 className="h-4 w-4 text-red-500" /> 
            {showAnalytics ? "Hide Insights" : "Pipeline Insights"}
          </Button>
        </div>
      </div>

      {/* Collapsible CRM Intelligence Hub */}
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 bg-slate-50/50 p-6 rounded-[10px] border border-slate-200/50 backdrop-blur-md">
          {/* Funnel Widget */}
          <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" /> Sales Funnel Conversion
              </h3>
              <Badge variant="secondary" className="bg-primary/5 text-primary text-[8px] font-black uppercase">Active stages</Badge>
            </div>
            <div className="space-y-3 pt-1">
              {PIPELINE_STAGES.filter(s => s.id !== 'won').map(stage => {
                const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
                const stageVal = stageLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
                const totalActiveVal = filteredLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0) || 1;
                const percentage = Math.round((stageVal / totalActiveVal) * 100);

                return (
                  <div key={stage.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600 uppercase tracking-tighter">{stage.name}</span>
                      <span className="text-slate-400">{percentage}% (₹{(stageVal/1000).toFixed(0)}k)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                          stage.id === 'lead' ? 'bg-amber-400' :
                          stage.id === 'contact' ? 'bg-sky-400' :
                          stage.id === 'proposal' ? 'bg-indigo-400' : 'bg-primary'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecasting & Probability Weighting */}
          <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Probability Weighted Forecast
              </h3>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            
            <div className="space-y-4 pt-1">
              {/* Calculate weighted values */}
              {(() => {
                // Probabilities: Lead=15%, Contact=35%, Proposal=65%, Negotiation=85%
                const weightedSum = filteredLeads.reduce((sum, l) => {
                  const prob = l.stage === 'lead' ? 0.15 :
                               l.stage === 'contact' ? 0.35 :
                               l.stage === 'proposal' ? 0.65 :
                               l.stage === 'negotiation' ? 0.85 : 0;
                  return sum + (l.deal_value || 0) * prob;
                }, 0);
                const totalActiveVal = filteredLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0) || 1;
                const blendWinRate = Math.round((weightedSum / totalActiveVal) * 100) || 0;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Value</span>
                        <span className="text-2xl font-black text-slate-800">₹{Math.round(weightedSum).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blended Win Rate</span>
                        <span className="text-xl font-black text-emerald-600">{blendWinRate}%</span>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block">Forecast Model Insights</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        Based on deal-stage probability vectors, the corporate ledger forecasts an enterprise realization of <strong className="text-emerald-700">₹{Math.round(weightedSum).toLocaleString()}</strong> out of the raw ₹{totalActiveVal.toLocaleString()} active pipeline.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Service Vertical Share */}
          <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-indigo-500" /> Departmental Distribution
              </h3>
              <Activity className="h-4 w-4 text-indigo-500" />
            </div>

            <div className="space-y-2.5 pt-1 overflow-y-auto max-h-[140px] custom-scrollbar pr-1">
              {(() => {
                const verticalStats: Record<string, { count: number; val: number }> = {};
                filteredLeads.forEach(l => {
                  const vert = l.service_vertical || "General Production";
                  if (!verticalStats[vert]) verticalStats[vert] = { count: 0, val: 0 };
                  verticalStats[vert].count += 1;
                  verticalStats[vert].val += l.deal_value || 0;
                });

                const totalVal = filteredLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0) || 1;
                const sortedVerts = Object.entries(verticalStats).sort((a, b) => b[1].val - a[1].val);

                if (sortedVerts.length === 0) {
                  return (
                    <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                      No active category distributions.
                    </div>
                  );
                }

                return sortedVerts.map(([name, stat], idx) => {
                  const share = Math.round((stat.val / totalVal) * 100);
                  return (
                    <div key={name} className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-2 max-w-[65%]">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", 
                          idx === 0 ? "bg-primary" : 
                          idx === 1 ? "bg-indigo-500" :
                          idx === 2 ? "bg-sky-500" : "bg-slate-400"
                        )} />
                        <span className="text-slate-600 truncate">{name}</span>
                      </div>
                      <span className="text-slate-500">{share}% (₹{(stat.val/1000).toFixed(0)}k)</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Command Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-primary rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Pipeline Leads</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-black font-headline text-slate-800">{filteredLeads.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Active CRM opportunities</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500 rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-600 mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Pipeline Value</span>
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black font-headline text-slate-800">
              ₹{filteredLeads.reduce((sum, l) => sum + (l.deal_value || 0), 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Estimated project contracts</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500 rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-blue-600 mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Negotiations</span>
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black font-headline text-slate-800">
              {filteredLeads.filter(l => ['proposal', 'negotiation'].includes(l.stage || '')).length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Critical discussion phase</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-purple-500 rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-purple-600 mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Realtime Sync</span>
              <Zap className="h-4 w-4 text-purple-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-slate-700 flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
              Live Ledger Connected
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Automatic Postgres updates</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-[600px] relative">
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-6">
          <div className="flex h-full gap-6 w-max min-w-full">
            {PIPELINE_STAGES.filter(s => s.id !== 'won').map((stage) => {
              const leadsInStage = filteredLeads.filter(l => l.stage === stage.id);
              const totalValue = leadsInStage.reduce((sum, l) => sum + (l.deal_value || 0), 0);

              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col gap-4 w-[320px] shrink-0 h-full bg-slate-50/50 rounded-[10px] p-3 border border-slate-200/50"
                >
                  <div className="flex items-center justify-between px-3 shrink-0 py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", stage.color || 'bg-slate-200')} />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-600">{stage.name}</h3>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black bg-white border border-slate-100 shadow-sm">{leadsInStage.length}</Badge>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground bg-white px-2 py-0.5 rounded-full shadow-sm">
                      ₹{(totalValue / 100000).toFixed(1)}L
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 pb-4">
                    {leadsInStage.map((lead) => (
                      <Card key={lead.id} className="hover:ring-2 hover:ring-primary/10 transition-all border-none shadow-sm group bg-white rounded-[10px]">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/crm/${lead.id}`} className="flex-1">
                              <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors block line-clamp-2">{lead.company_name}</span>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg hover:bg-slate-50">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-52 shadow-2xl border-slate-100">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2 tracking-widest">Lead Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild className="rounded-lg m-1 py-2 cursor-pointer">
                                  <Link href={`/crm/${lead.id}`} className="flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5" /> View Lead
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="rounded-lg m-1 py-2 cursor-pointer text-emerald-600 font-bold"
                                  onClick={() => handleMarkAsWon(lead)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Convert to Project
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg m-1 py-2 cursor-pointer">
                                  <Link href={`/client/client_${lead.id}`} className="flex items-center gap-2 text-slate-500">
                                    <Building2 className="h-3.5 w-3.5" /> View Client Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="rounded-lg m-1 py-2 cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50" onClick={() => setLeadToArchive(lead)}>
                                  <Archive className="h-3.5 w-3.5" /> Archive Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-tighter">
                                <Zap className="h-3.5 w-3.5 text-accent" />
                                <span className="truncate">{lead.service_vertical || 'General Production'}</span>
                              </div>
                              {lead.sub_vertical && (
                                <span className="text-[9px] text-muted-foreground font-bold uppercase pl-5 border-l border-slate-100 ml-1.5 mt-0.5">
                                  {lead.sub_vertical}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-1 text-primary font-black text-xs bg-primary/5 px-2 py-1 rounded-lg">
                              <IndianRupee className="h-3 w-3" />
                              <span>{(lead.deal_value || 0).toLocaleString()}</span>
                            </div>
                            <Link href={`/crm/${lead.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 group/btn transition-colors">
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover/btn:text-primary" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button 
                      variant="ghost" 
                      className="w-full border-2 border-dashed border-slate-200 h-24 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all rounded-[10px] group shrink-0"
                      onClick={() => {
                        setNewLead({...newLead, stage: stage.id});
                        setIsAddOpen(true);
                      }}
                    >
                      <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-primary">
                        <Plus className="h-5 w-5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Quick Add Lead</span>
                      </div>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={!!leadToArchive} onOpenChange={(open) => !open && setLeadToArchive(null)}>
        <AlertDialogContent className="rounded-[10px] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-rose-50 rounded-[10px] flex items-center justify-center text-rose-500 mb-4">
              <Archive className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Archive Lead Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will move "{leadToArchive?.company_name}" to your archives. It will no longer appear in the active sales pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-rose-500 hover:bg-rose-600 rounded-xl h-11 font-bold px-8">
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
