
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
  Activity,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection, broadcastTableUpdate } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { PIPELINE_STAGES } from "@/lib/constants";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [leadToPermanentDelete, setLeadToPermanentDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  
  // Pilot Video State
  const [leadToPromoteToPilot, setLeadToPromoteToPilot] = useState<any>(null);
  const [pilotProjectAssignee, setPilotProjectAssignee] = useState<string>("");
  const router = useRouter();

  const [newLead, setNewLead] = useState({
    lead_type: "Prospect", // "Prospect" | "Client"
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    whatsapp: "",
    service_vertical: "",
    sub_vertical: "",
    industry: "Luxury & Lifestyle",
    deal_value: "",
    stage: "new_lead",
    notes: "",
    billing_address: "",
    gstin: "",
    template: "Brand Identity"
  });

  // Fetch Prospects from Supabase
  const { data: allLeads, isLoading: isLeadsLoading, refetch: refetchLeads } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  const [localLeads, setLocalLeads] = useState<any[]>([]);

  const { data: companyUsers } = useSupabaseCollection('User');

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
    // Exclude converted prospects, direct clients, and won/lost from active pipeline board columns
    return localLeads.filter(l => 
      !l.is_converted && !['won', 'lost', 'client'].includes(l.stage || '') && (
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
      toast({ variant: "destructive", title: "Selection Required", description: "Please specify a company name." });
      return;
    }

    setIsSubmitting(true);

    try {
      if (newLead.lead_type === "Client") {
        const response = await fetch("/api/v1/crm/client/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: newLead.company_name,
            contact_person: newLead.contact_person,
            email: newLead.email,
            phone: newLead.phone || newLead.whatsapp,
            industry: newLead.industry,
            billing_address: newLead.billing_address,
            gstin: newLead.gstin,
            template: newLead.template,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Failed to onboard client.");
        }

        toast({
          title: "Client Onboarded",
          description: `${newLead.company_name} has been added to your directory and workspace.`,
        });

        window.location.reload();
      } else {
        const response = await fetch("/api/v1/crm/prospect/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: newLead.company_name,
            contact_person: newLead.contact_person,
            email: newLead.email,
            phone: newLead.phone || newLead.whatsapp,
            whatsapp: newLead.whatsapp || newLead.phone,
            service_vertical: newLead.service_vertical,
            sub_vertical: newLead.sub_vertical,
            industry: newLead.industry,
            deal_value: newLead.deal_value,
            stage: newLead.stage,
            notes: newLead.notes,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Failed to create prospect.");
        }

        toast({
          title: "Prospect Created",
          description: `${newLead.company_name} is now in your sales pipeline.`,
        });

        if (resData.data) {
          setLocalLeads(prev => [resData.data, ...prev]);
        }

        setNewLead({
          lead_type: "Prospect",
          company_name: "",
          contact_person: "",
          email: "",
          phone: "",
          whatsapp: "",
          service_vertical: "",
          sub_vertical: "",
          industry: "Luxury & Lifestyle",
          deal_value: "",
          stage: "new_lead",
          notes: "",
          billing_address: "",
          gstin: "",
          template: "Brand Identity"
        });
        setIsAddOpen(false);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsWon = async (lead: any) => {
    if (!companyId || !lead) return;

    // Spot Update! Update local stage instantly so it drops out of active columns
    setLocalLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'won', is_converted: true } : l));

    try {
      const response = await fetch(`/api/v1/crm/prospect/${lead.id}/convert`, {
        method: "POST",
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to convert prospect.");
      }

      toast({ 
        title: "Success! Deal Converted", 
        description: `"${lead.company_name}" has been converted to a client with an active workspace.` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Conversion Failed", description: err.message });
      // Rollback on error
      setLocalLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: lead.stage, is_converted: false } : l));
    }
  };

  const handleConfirmArchive = async () => {
    if (!companyId || !leadToArchive) return;
    
    const archivedLead = leadToArchive;
    // Optimistic UI: remove from local leads list instantly
    setLocalLeads(prev => prev.filter(l => l.id !== archivedLead.id));

    // Archive Prospect in Supabase — store all fields inside 'data' JSON column
    // (Archive table only has: id, company_id, archive_type, archived_at, data, created_at)
    const { error: archiveError } = await supabase.from('Archive').insert({
      company_id: companyId,
      archive_type: 'prospect',
      archived_at: new Date().toISOString(),
      data: archivedLead
    });

    if (archiveError) {
      toast({ variant: "destructive", title: "Archive Failed", description: archiveError.message });
      // Rollback optimistic update
      setLocalLeads(prev => [archivedLead, ...prev]);
      setLeadToArchive(null);
      return;
    }

    // Delete Prospect from active table
    await supabase.from('Prospect').delete().eq('id', archivedLead.id);

    toast({ title: "Lead Archived", description: "The lead has been moved to archives." });
    setLeadToArchive(null);
    refetchLeads();
    broadcastTableUpdate('Prospect');
    broadcastTableUpdate('Archive');
  };

  const handleConfirmPermanentDelete = async () => {
    if (!companyId || !leadToPermanentDelete) return;
    
    const archivedLead = leadToPermanentDelete;
    
    // Optimistic UI update
    setLocalLeads(prev => prev.filter(l => l.id !== archivedLead.id));

    // Delete Prospect from active table
    const { error } = await supabase.from('Prospect').delete().eq('id', archivedLead.id);

    if (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
      setLeadToPermanentDelete(null);
      return;
    }

    toast({ title: "Lead Deleted", description: "The lead has been permanently deleted." });
    setLeadToPermanentDelete(null);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedLeadId || !companyId) return;

    const lead = localLeads.find(l => l.id === draggedLeadId);
    if (!lead || lead.stage === targetStageId) {
      setDraggedLeadId(null);
      return;
    }

    if (targetStageId === 'pilot_video') {
      setLeadToPromoteToPilot(lead);
      setDraggedLeadId(null);
      return; // Stop here, wait for dialog
    }

    // Optimistic Update
    setLocalLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, stage: targetStageId } : l));
    
    try {
      const { error } = await supabase.from('Prospect').update({ stage: targetStageId }).eq('id', draggedLeadId);
      if (error) throw error;
      toast({ title: "Stage Updated", description: "Lead has been moved successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error moving lead", description: err.message });
      refetchLeads();
    } finally {
      setDraggedLeadId(null);
    }
  };

  const handlePilotProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadToPromoteToPilot || !companyId) return;
    setIsSubmitting(true);
    
    try {
      // Create Project
      const { data: newProject, error: projectError } = await supabase.from('Project').insert({
        company_id: companyId,
        project_name: `Pilot Video Creation - ${leadToPromoteToPilot.company_name}`,
        client_name: leadToPromoteToPilot.company_name,
        status: 'pre-prod',
        created_by: profile?.id || 'system'
      }).select().single();

      if (projectError) throw projectError;

      // Assign Objective if assignee selected
      if (pilotProjectAssignee && pilotProjectAssignee !== "Unassigned") {
        await supabase.from('Objective').insert({
          company_id: companyId,
          project_id: newProject.id,
          title: "Pilot Video Setup",
          assignedTo: pilotProjectAssignee,
          status: 'todo',
          priority: 'High'
        });
      }

      // Update lead stage
      const { error: updateError } = await supabase.from('Prospect')
        .update({ stage: 'pilot_video' })
        .eq('id', leadToPromoteToPilot.id);
        
      if (updateError) throw updateError;
      
      setLocalLeads(prev => prev.map(l => l.id === leadToPromoteToPilot.id ? { ...l, stage: 'pilot_video' } : l));
      toast({ title: "Project Created", description: `Pilot Video project created successfully.` });
      
      setLeadToPromoteToPilot(null);
      setPilotProjectAssignee("");
      
      // Navigate to the new project
      if (newProject?.id) {
        router.push(`/projects/${newProject.id}`);
      }
      
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
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
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Lead Type</Label>
                  <Select 
                    value={newLead.lead_type} 
                    onValueChange={(val) => setNewLead(prev => ({...prev, lead_type: val}))}
                  >
                    <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                      <SelectItem value="Prospect" className="text-xs font-bold rounded-xl m-1 cursor-pointer">Prospect</SelectItem>
                      <SelectItem value="Client" className="text-xs font-bold rounded-xl m-1 cursor-pointer">Client (Direct Onboard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                    Company Name
                  </Label>
                  <Input 
                    list="company-names"
                    placeholder="e.g. Nike Global" 
                    value={newLead.company_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLead(prev => ({...prev, company_name: val}));
                      
                      // Auto-fill other fields if it matches an existing lead/client
                      const existing = localLeads.find(l => l.company_name === val);
                      if (existing) {
                        setNewLead(prev => ({
                          ...prev,
                          contact_person: prev.contact_person || existing.contact_person || "",
                          email: prev.email || existing.email || "",
                          phone: prev.phone || existing.phone || existing.whatsapp || "",
                          whatsapp: prev.whatsapp || existing.whatsapp || existing.phone || "",
                          industry: existing.industry || prev.industry,
                          service_vertical: existing.service_vertical || prev.service_vertical,
                          sub_vertical: existing.sub_vertical || prev.sub_vertical
                        }));
                      }
                    }}
                    className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
                    required
                  />
                  <datalist id="company-names">
                    {Array.from(new Set(localLeads.map(l => l.company_name).filter(Boolean))).map((name, i) => (
                      <option key={i} value={name as string} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Contact Person</Label>
                    <Input 
                      placeholder="John Doe" 
                      value={newLead.contact_person}
                      onChange={(e) => setNewLead(prev => ({...prev, contact_person: e.target.value}))}
                      className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="john@doe.com" 
                      value={newLead.email}
                      onChange={(e) => setNewLead(prev => ({...prev, email: e.target.value}))}
                      className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Phone / WhatsApp</Label>
                  <Input 
                    placeholder="+91 99999 99999" 
                    value={newLead.phone}
                    onChange={(e) => setNewLead(prev => ({...prev, phone: e.target.value, whatsapp: e.target.value}))}
                    className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                {newLead.lead_type === "Prospect" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Service Category</Label>
                        <Select 
                          value={newLead.service_vertical} 
                          onValueChange={(val) => setNewLead(prev => ({...prev, service_vertical: val, sub_vertical: ""}))}
                        >
                          <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                            <SelectValue placeholder="Select Vertical" />
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
                            <SelectValue placeholder={newLead.service_vertical ? "Select Service" : "Select Category First"} />
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
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Expected Deal (₹)</Label>
                        <Input 
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
                            <SelectValue placeholder="Select Stage" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                            {PIPELINE_STAGES.filter(s => !['won', 'lost', 'client'].includes(s.id)).map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-xs focus:bg-red-50 focus:text-red-700 rounded-xl cursor-pointer">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Notes</Label>
                      <Textarea 
                        placeholder="Enter Prospect Details..." 
                        value={newLead.notes}
                        onChange={(e) => setNewLead(prev => ({...prev, notes: e.target.value}))}
                        className="rounded-[10px] bg-slate-50 border-slate-200 text-slate-800 text-sm shadow-sm"
                      />
                    </div>
                  </>
                )}

                {newLead.lead_type === "Client" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Industry</Label>
                        <Select 
                          value={newLead.industry} 
                          onValueChange={(val) => setNewLead(prev => ({...prev, industry: val}))}
                        >
                          <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl max-h-[200px] overflow-y-auto">
                            <SelectItem value="Luxury & Lifestyle" className="text-xs rounded-xl m-1 cursor-pointer">Luxury & Lifestyle</SelectItem>
                            <SelectItem value="Tech & SaaS" className="text-xs rounded-xl m-1 cursor-pointer">Tech & SaaS</SelectItem>
                            <SelectItem value="Gaming & Esports" className="text-xs rounded-xl m-1 cursor-pointer">Gaming & Esports</SelectItem>
                            <SelectItem value="Automotive & Mobility" className="text-xs rounded-xl m-1 cursor-pointer">Automotive & Mobility</SelectItem>
                            <SelectItem value="E-commerce & D2C" className="text-xs rounded-xl m-1 cursor-pointer">E-commerce & D2C</SelectItem>
                            <SelectItem value="Broadcasting & Media Production" className="text-xs rounded-xl m-1 cursor-pointer">Broadcasting & Media</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">GSTIN (Optional)</Label>
                        <Input 
                          placeholder="GSTIN Code" 
                          value={newLead.gstin}
                          onChange={(e) => setNewLead(prev => ({...prev, gstin: e.target.value}))}
                          className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Billing Address</Label>
                      <Textarea 
                        placeholder="Corporate Billing Address" 
                        value={newLead.billing_address}
                        onChange={(e) => setNewLead(prev => ({...prev, billing_address: e.target.value}))}
                        className="rounded-[10px] bg-slate-50 border-slate-200 text-slate-800 text-sm shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Roadmap Template</Label>
                      <Select 
                        value={newLead.template} 
                        onValueChange={(val) => setNewLead(prev => ({...prev, template: val}))}
                      >
                        <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                          <SelectValue placeholder="Select Onboarding Template" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                          <SelectItem value="Brand Identity" className="text-xs rounded-xl m-1 cursor-pointer">Brand Identity</SelectItem>
                          <SelectItem value="AI TVC" className="text-xs rounded-xl m-1 cursor-pointer">AI TVC</SelectItem>
                          <SelectItem value="Corporate Film" className="text-xs rounded-xl m-1 cursor-pointer">Corporate Film</SelectItem>
                          <SelectItem value="Social Media Campaign" className="text-xs rounded-xl m-1 cursor-pointer">Social Media Campaign</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-[10px] h-12 font-black text-xs uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {newLead.lead_type === "Client" ? "Onboard Client" : "Add Lead"}
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

      <div className="flex-1 min-h-[600px] relative w-full overflow-hidden">
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-6">
          <div className="flex h-full gap-6 w-max min-w-full pr-8">
            {PIPELINE_STAGES.filter(s => s.id !== 'won').map((stage) => {
              const leadsInStage = filteredLeads.filter(l => l.stage === stage.id);
              const totalValue = leadsInStage.reduce((sum, l) => sum + (l.deal_value || 0), 0);

              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col gap-4 w-[320px] shrink-0 h-full bg-slate-50/50 rounded-[10px] p-3 border border-slate-200/50"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
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
                      <Card 
                        key={lead.id} 
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="hover:ring-2 hover:ring-primary/10 transition-all border-none shadow-sm group bg-white rounded-[10px] cursor-grab active:cursor-grabbing"
                      >
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
                                <DropdownMenuItem className="rounded-lg m-1 py-2 cursor-pointer text-slate-600 focus:text-slate-700 focus:bg-slate-50" onClick={() => setLeadToArchive(lead)}>
                                  <Archive className="h-3.5 w-3.5" /> Archive Lead
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="rounded-lg m-1 py-2 cursor-pointer text-rose-500 font-bold focus:text-rose-600 focus:bg-rose-50 force-cache-bust-1" onClick={() => setLeadToPermanentDelete(lead)}>
                                  <Trash2 className="h-3.5 w-3.5" /> Delete Lead
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
            <AlertDialogTitle className="text-2xl font-bold">Delete Lead Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will move "{leadToArchive?.company_name}" to your archives. It will no longer appear in the active sales pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-rose-500 hover:bg-rose-600 rounded-xl h-11 font-bold px-8">
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!leadToPermanentDelete} onOpenChange={(open) => !open && setLeadToPermanentDelete(null)}>
        <AlertDialogContent className="rounded-3xl p-8 max-w-md border-0 bg-white">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-rose-50 rounded-[10px] flex items-center justify-center text-rose-500 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Permanently Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will permanently delete "{leadToPermanentDelete?.company_name}" from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermanentDelete} className="bg-rose-500 hover:bg-rose-600 rounded-xl h-11 font-bold px-8">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Promote to Pilot Video Project */}
      <Dialog open={!!leadToPromoteToPilot} onOpenChange={(open) => !open && setLeadToPromoteToPilot(null)}>
        <DialogContent className="sm:max-w-[460px] rounded-[10px] p-0 border border-slate-100 bg-white shadow-2xl">
          <div className="relative p-8 pb-6 border-b border-slate-100">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent" />
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
            <DialogHeader className="relative">
              <DialogTitle className="flex items-center gap-3 text-2xl font-black text-slate-800">
                <div className="h-10 w-10 rounded-[10px] bg-fuchsia-50 border border-fuchsia-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-fuchsia-500" />
                </div>
                Pilot Video Activation
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs mt-1">
                This will create a new pilot project for <strong className="text-slate-800">{leadToPromoteToPilot?.company_name}</strong>. Assign a producer or manager to take charge.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handlePilotProjectSubmit} className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Primary Assignee</Label>
              <Select 
                value={pilotProjectAssignee} 
                onValueChange={setPilotProjectAssignee}
              >
                <SelectTrigger className="rounded-[10px] h-11 bg-slate-50 border-slate-200 text-slate-800 shadow-sm">
                  <SelectValue placeholder="Select Assignee (Optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-[10px] shadow-xl">
                  {companyUsers?.map(user => (
                    <SelectItem key={user.id} value={user.id} className="text-xs font-bold rounded-xl m-1 cursor-pointer">
                      {user.fullName || user.email} <span className="text-[10px] text-slate-400 font-normal uppercase ml-1">({user.role_id?.replace('_', ' ') || 'User'})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="Unassigned" className="text-xs italic text-slate-400 rounded-xl m-1 cursor-pointer">Leave Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setLeadToPromoteToPilot(null)} className="rounded-[10px] h-11 font-black text-xs uppercase tracking-widest text-slate-600 bg-white">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-[10px] h-11 font-black text-xs uppercase tracking-widest bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-xl shadow-fuchsia-600/20 transition-all">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
