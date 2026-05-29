"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Briefcase, 
  Mail, 
  Phone, 
  Loader2, 
  ExternalLink, 
  Zap, 
  Trash2, 
  Archive, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Package,
  Megaphone,
  Smartphone,
  Home,
  Ticket,
  Rocket,
  Film,
  Mic,
  BookOpen,
  Play,
  Scissors,
  X,
  User,
  Activity,
  DollarSign,
  TrendingUp,
  MapPin,
  FileText,
  Users,
  ShieldAlert,
  ArrowRight,
  IndianRupee,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UnifiedClientSelector } from "@/components/unified-client-selector";

export const INDUSTRIES = [
  'Agriculture & Forestry',
  'Aerospace & Defense',
  'Architecture & Planning',
  'Art, Entertainment & Music',
  'Automotive & Mobility',
  'Banking & Finance',
  'Beauty & Cosmetics',
  'Biotechnology',
  'Broadcasting & Media Production',
  'Chemicals & Plastics',
  'Construction & Engineering',
  'Consulting',
  'Consumer Goods (FMCG)',
  'E-commerce & D2C',
  'Education & EdTech',
  'Energy & Utilities',
  'Environmental Services',
  'Event Services',
  'Fashion & Apparel',
  'Food & Beverage',
  'Gaming & Esports',
  'Government & Public Administration',
  'Healthcare & Wellness',
  'Hospitality & Tourism',
  'Human Resources & Recruiting',
  'Information Technology & Services',
  'Insurance',
  'Legal Services',
  'Logistics & Supply Chain',
  'Luxury & Lifestyle',
  'Manufacturing',
  'Marketing & Advertising',
  'Media & Publishing',
  'Non-profit & Philanthropy',
  'Pharmaceuticals',
  'Real Estate',
  'Retail',
  'Sports & Recreation',
  'Tech & SaaS',
  'Telecommunications',
  'Transportation',
  'Veterinary Services',
  'Web3, Crypto & Blockchain',
  'Other'
];

export const CONTENT_VERTICALS = [
  { id: 'advertising', name: 'Advertising & Brand Films', icon: Megaphone, color: 'bg-accent', 
    services: ['TV Commercials', 'Digital Ads', 'Brand Story Films', 'Product Launch Ads', 'Festival Campaign Ads', 'Luxury Brand Commercials'] 
  },
  { id: 'ecommerce', name: 'Product & E-commerce', icon: Package, color: 'bg-accent', 
    services: ['Product Commercial Videos', 'Amazon Product Videos', 'Flipkart Listing Videos', 'Product Demo Videos', 'Unboxing Videos', 'Product Photography'] 
  },
  { id: 'social', name: 'Social Media Content', icon: Smartphone, color: 'bg-accent', 
    services: ['Instagram Reels', 'YouTube Shorts', 'Influencer Content', 'Social Media Ad Creatives', 'Monthly Content Packages'] 
  },
  { id: 'corporate', name: 'Corporate Videos', icon: Building2, color: 'bg-slate-700', 
    services: ['Company Profile Video', 'Corporate Brand Film', 'Recruitment Video', 'Training Video', 'Investor Presentation Video', 'CEO Interview Video'] 
  },
  { id: 'realestate', name: 'Real Estate Videos', icon: Home, color: 'bg-emerald-600', 
    services: ['Property Walkthrough Video', 'Luxury Property Ads', 'Drone Property Tour', 'Architecture Showcase', 'Construction Progress Video'] 
  },
  { id: 'events', name: 'Event Videos', icon: Ticket, color: 'bg-accent', 
    services: ['Event Coverage', 'Conference Highlight Video', 'Event Aftermovie', 'Product Launch Event Video', 'Brand Activation Coverage'] 
  },
  { id: 'startups', name: 'Startup & App Videos', icon: Rocket, color: 'bg-accent', 
    services: ['App Explainer Video', 'SaaS Product Demo', 'Startup Pitch Video', 'UI Demo Video', 'Animated Explainer Video'] 
  },
  { id: 'entertainment', name: 'Entertainment Production', icon: Film, color: 'bg-accent', 
    services: ['Music Video', 'Short Film', 'Fashion Film', 'Web Series', 'Creative Campaign Video'] 
  },
  { id: 'podcasts', name: 'Podcast & Interviews', icon: Mic, color: 'bg-accent', 
    services: ['Video Podcast Production', 'Interview Video', 'Customer Testimonial Video', 'Founder Story Video'] 
  },
  { id: 'educational', name: 'Educational Content', icon: BookOpen, color: 'bg-lime-600', 
    services: ['Online Course Video', 'Training Modules', 'Educational Explainer Video', 'Coaching Center Promo'] 
  },
  { id: 'animation', name: 'Animation & Motion', icon: Play, color: 'bg-destructive', 
    services: ['Motion Graphics Video', '2D Animation', '3D Animation', 'Infographic Animation'] 
  },
  { id: 'post', name: 'Post Production', icon: Scissors, color: 'bg-slate-500', 
    services: ['Video Editing', 'Color Grading', 'Sound Design', 'Visual Effects (VFX)', 'Subtitles'] 
  },
  { id: 'ai', name: 'AI Generated Content', icon: Sparkles, color: 'bg-accent', 
    services: ['AI Commercials', 'AI Product Ads', 'AI Fashion Campaigns', 'AI Cinematic Videos', 'AI Social Media Ads'] 
  },
];

export default function ClientsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  
  // UI Tabs State
  const [activeTab, setActiveTab] = useState<'directory' | 'pipeline' | 'intelligence_hub'>('directory');
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToArchive, setClientToArchive] = useState<any>(null);
  const [clientToPermanentDelete, setClientToPermanentDelete] = useState<any>(null);
  
  // Onboarding Form State
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState<'info' | 'services'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  
  const [newClient, setNewClient] = useState({
    company_name: "",
    industry: "Luxury & Lifestyle",
    email: "",
    contact_person: "",
    phone: "",
    gstin: "",
    billing_address: ""
  });

  const [selectedVerticalId, setSelectedVerticalId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});

  // Hub Selected Organization State
  const [selectedHubCompany, setSelectedHubCompany] = useState<string>("");
  
  // Quick Add Opportunity modal states inside Hub
  const [isQuickOppOpen, setIsQuickOppOpen] = useState(false);
  const [quickOpp, setQuickOpp] = useState({
    service_vertical: "Advertising & Brand Films",
    sub_vertical: "TV Commercials",
    deal_value: "150000",
    stage: "lead"
  });

  // DB Collections Sync
  const { data: leads, isLoading: isLeadsLoading, refetch: reloadLeads } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { company_name: 'asc' }
  });

  const { data: clients, isLoading: isClientsLoading, refetch: reloadClients } = useSupabaseCollection('Client', {
    where: { company_id: companyId },
    orderBy: { name: 'asc' }
  });

  const { data: projects, isLoading: isProjectsLoading } = useSupabaseCollection('Project', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  const { data: proposals, isLoading: isProposalsLoading } = useSupabaseCollection('Proposal', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  const { data: invoices } = useSupabaseCollection('Invoice', {
    where: { company_id: companyId }
  });

  // ----------------------------------------------------
  // Dynamic Derived Mappings (Relations Layer)
  // ----------------------------------------------------

  // 1. Existing Clients List (from Client table)
  const existingClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.service_vertical || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).map(c => ({
      ...c,
      company_name: c.name
    }));
  }, [clients, searchQuery]);

  // 2. Active Prospects List (stage: other pipeline stages)
  const prospectClients = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => 
      !['client', 'won', 'lost'].includes(l.stage || '') && (
        (l.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.service_vertical || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.sub_vertical || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [leads, searchQuery]);

  // 3. Consolidated Statistics Overview
  const hubStats = useMemo(() => {
    const activePartnersCount = existingClients.length;
    const activeLeadsCount = prospectClients.length;
    const totalPipelineVal = prospectClients.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    const activeProjCount = projects?.filter(p => p.status === 'in_progress').length || 0;
    
    return {
      activePartnersCount,
      activeLeadsCount,
      totalPipelineVal,
      activeProjCount
    };
  }, [existingClients, prospectClients, projects]);

  // 4. Intelligence Hub selected company data graph
  const selectedHubGraph = useMemo(() => {
    if (!selectedHubCompany || !leads) return null;
    
    // Base profiles matching this exact name
    const companyLeads = leads.filter(l => l.company_name === selectedHubCompany);
    const masterProfile = companyLeads.find(l => l.stage === 'client' || l.stage === 'won') || companyLeads[0];
    
    // Opportunities
    const activeOpps = companyLeads.filter(l => !['client', 'won', 'lost'].includes(l.stage || ''));
    
    // Projects
    const relatedProjects = projects?.filter(p => p.client_name === selectedHubCompany) || [];
    
    // Proposals
    const relatedProposals = proposals?.filter(p => p.client_name === selectedHubCompany) || [];
    
    // Invoices
    const relatedInvoices = invoices?.filter(inv => inv.client_id === masterProfile?.id) || [];
    const totalLTV = relatedInvoices.reduce((sum, inv) => inv.payment_status === 'paid' ? sum + (inv.total || 0) : sum, 0);

    // Multi-contact extraction (consolidate Poc and Email from all leads)
    const contactsMap = new Map();
    companyLeads.forEach(l => {
      const contactName = l.contact_person?.trim();
      const emailVal = l.email?.trim();
      if (contactName) {
        contactsMap.set(contactName, { name: contactName, email: emailVal || "Not Shared", role: "Primary Liaison" });
      }
    });
    const contacts = Array.from(contactsMap.values());

    return {
      masterProfile,
      activeOpps,
      relatedProjects,
      relatedProposals,
      relatedInvoices,
      totalLTV,
      contacts
    };
  }, [selectedHubCompany, leads, projects, proposals, invoices]);

  const activeVertical = useMemo(() => 
    CONTENT_VERTICALS.find(v => v.id === selectedVerticalId), 
  [selectedVerticalId]);

  const totalServicesCount = useMemo(() => 
    Object.values(selectedServices).flat().length, 
  [selectedServices]);

  const toggleService = (verticalId: string, service: string) => {
    setSelectedServices(prev => {
      const current = prev[verticalId] || [];
      const updated = current.includes(service)
        ? current.filter(s => s !== service)
        : [...current, service];
      
      const newMap = { ...prev };
      if (updated.length === 0) {
        delete newMap[verticalId];
      } else {
        newMap[verticalId] = updated;
      }
      return newMap;
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

  // ----------------------------------------------------
  // Onboarding & DB Handlers
  // ----------------------------------------------------

  const handleOnboardClient = async (shouldAdvance: boolean = false) => {
    if (!companyId || !newClient.company_name) {
      return;
    }

    setIsSubmitting(true);
    const primaryVertical = activeVertical?.name || "General Production";
    const allServices = Object.values(selectedServices).flat();

    try {
      if (shouldAdvance && onboardStep === 'info') {
        setOnboardStep('services');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/v1/crm/client/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: newClient.company_name,
          contact_person: newClient.contact_person,
          email: newClient.email,
          phone: newClient.phone,
          industry: newClient.industry,
          billing_address: newClient.billing_address,
          gstin: newClient.gstin,
          service_vertical: primaryVertical,
          sub_vertical: allServices.join(', '),
          template: "Brand Identity",
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to onboard client.");
      }

      toast({ 
        title: "Client Onboarded", 
        description: `${newClient.company_name} has been added to your directory.` 
      });
      resetOnboarding();
      reloadClients();
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Registration Error", 
        description: error.message || "Failed to save client profile." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOnboarding = () => {
    setNewClient({ company_name: "", industry: "Luxury & Lifestyle", email: "", contact_person: "", phone: "", gstin: "", billing_address: "" });
    setSelectedVerticalId(null);
    setSelectedServices({});
    setCreatedLeadId(null);
    setOnboardStep('info');
    setIsOnboardOpen(false);
  };

  const handleConfirmArchive = async () => {
    if (!companyId || !clientToArchive) return;
    const client = clientToArchive;

    // Archive the client lead record — let Supabase auto-generate id
    const { error: archiveError } = await supabase.from('Archive').insert({
      company_id: companyId,
      company_name: client.company_name,
      archive_type: 'client',
      archived_at: new Date().toISOString(),
      industry: client.industry,
      email: client.email,
      contact_person: client.contact_person,
      service_vertical: client.service_vertical,
      sub_vertical: client.sub_vertical,
    });

    if (archiveError) {
      toast({ variant: "destructive", title: "Archive Failed", description: archiveError.message });
      setClientToArchive(null);
      return;
    }

    // Also archive & delete associated projects
    try {
      const { data: projectsToArchive } = await supabase
        .from('Project')
        .select('*')
        .eq('client_name', client.company_name)
        .eq('company_id', companyId);
      
      if (projectsToArchive && projectsToArchive.length > 0) {
        for (const project of projectsToArchive) {
          await supabase.from('Archive').insert({
            company_id: companyId,
            project_name: project.project_name,
            archive_type: 'project',
            archived_at: new Date().toISOString(),
            budget: project.budget,
            status: project.status,
            deadline: project.deadline,
          });
          await supabase.from('Project').delete().eq('id', project.id);
        }
      }
    } catch (e) {
      console.error('Error archiving associated projects:', e);
    }

    // Delete the Client from Client table
    const { error: deleteClientError } = await supabase
      .from('Client')
      .delete()
      .eq('id', client.id);

    if (deleteClientError) {
      toast({ variant: "destructive", title: "Delete Client Failed", description: deleteClientError.message });
      setClientToArchive(null);
      return;
    }

    // Delete associated prospects
    await supabase.from('Prospect').delete().eq('converted_client_id', client.id);

    toast({ title: "Client Archived", description: `"${client.company_name}" and associated projects moved to Vault.` });
    setClientToArchive(null);
    reloadClients();
    reloadLeads();
  };

  const handleConfirmPermanentDelete = async () => {
    if (!companyId || !clientToPermanentDelete) return;
    const client = clientToPermanentDelete;

    // Delete associated projects
    await supabase.from('Project').delete().eq('client_id', client.id);
    
    // Delete associated prospects
    await supabase.from('Prospect').delete().eq('converted_client_id', client.id);

    // Delete the Client from Client table
    const { error: deleteClientError } = await supabase
      .from('Client')
      .delete()
      .eq('id', client.id);

    if (deleteClientError) {
      toast({ variant: "destructive", title: "Delete Client Failed", description: deleteClientError.message });
      setClientToPermanentDelete(null);
      return;
    }

    toast({ title: "Client Deleted", description: `"${client.company_name}" has been permanently deleted.` });
    setClientToPermanentDelete(null);
    reloadClients();
    reloadLeads();
  };

  // ----------------------------------------------------
  // Quick Relationship Generators (Intelligence Hub)
  // ----------------------------------------------------

  const handleQuickAddOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHubGraph || !companyId) return;
    const master = selectedHubGraph.masterProfile;

    const { error } = await supabase.from('Prospect').insert({
      company_id: companyId,
      company_name: master.company_name,
      industry: master.industry,
      service_vertical: quickOpp.service_vertical,
      sub_vertical: quickOpp.sub_vertical,
      deal_value: parseFloat(quickOpp.deal_value) || 0,
      stage: quickOpp.stage,
      email: master.email,
      contact_person: master.contact_person,
      gstin: master.gstin,
      billing_address: master.billing_address
    });

    if (error) {
      toast({ variant: "destructive", title: "Failed to Add Lead", description: error.message });
    } else {
      toast({ title: "New Opportunity Registered", description: `Recurring campaign opportunity launched for ${master.company_name}.` });
      setIsQuickOppOpen(false);
      reloadLeads();
    }
  };

  if (isTenantLoading || isLeadsLoading || isClientsLoading || isProjectsLoading || isProposalsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[85vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Loading Relationship Architectures...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Cinematic Header Block */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
        {/* Background glow */}
        <div className="absolute -top-4 -left-4 w-72 h-32 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-destructive rounded-full shadow-lg shadow-red-500/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-destructive">DP Media OS</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight leading-none">Clients Intelligence Hub</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2">Unified Relationship Directory & Pipeline</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter company profiles..." 
              className="pl-10 h-11 w-64 rounded-[10px] bg-white border border-border text-primary placeholder:text-muted-foreground focus:border-destructive focus:ring-1 focus:ring-red-500/20 transition-all shadow-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsOnboardOpen(true)} className="gap-2 rounded-[10px] bg-destructive hover:bg-destructive text-white h-11 px-6 font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]">
            <Plus className="h-4 w-4" /> Onboard Partner
          </Button>
        </div>
      </div>

      {/* Unified Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Partners', value: hubStats.activePartnersCount, sub: 'Onboarded client directories', icon: Building2, color: 'red' },
          { label: 'Opportunities', value: hubStats.activeLeadsCount, sub: 'Pipeline prospects tracked', icon: Users, color: 'indigo' },
          { label: 'Active Forecast', value: `₹${hubStats.totalPipelineVal.toLocaleString()}`, sub: 'Estimated project contracts', icon: TrendingUp, color: 'emerald' },
          { label: 'Workspaces Live', value: hubStats.activeProjCount, sub: 'Active production workspaces', icon: Briefcase, color: 'red' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={cn(
            "relative overflow-hidden rounded-[10px] p-5 border transition-all duration-300 hover:scale-[1.02] group",
            "bg-white border-border hover:border-border shadow-sm shadow-slate-100/50 hover:shadow-md"
          )}>
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none",
              color === 'red' ? 'bg-destructive/5' : color === 'indigo' ? 'bg-accent/5' : 'bg-emerald-500/5'
            )} />
            <div className="flex items-start justify-between mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
              <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center",
                color === 'red' ? 'bg-destructive/10 text-destructive border border-red-100' : color === 'indigo' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
              )}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-primary tracking-tight">{value}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{sub}</p>
            <div className={cn("absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500",
              color === 'red' ? 'bg-destructive' : color === 'indigo' ? 'bg-accent' : 'bg-emerald-500'
            )} />
          </div>
        ))}
      </div>

      {/* Directory Navigation Tabs */}
      <div className="flex items-center gap-1 p-1.5 rounded-[10px] bg-secondary/50 border border-border/40 w-fit backdrop-blur-xl shadow-sm">
        {[
          { id: 'directory', label: 'Active Partners', icon: Building2 },
          { id: 'pipeline', label: 'Prospect Pipelines', icon: Activity },
          { id: 'intelligence_hub', label: 'Relationship Hub', icon: Sparkles },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              "flex items-center gap-2 px-5 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200",
              activeTab === id
                ? 'bg-destructive text-white shadow-md shadow-red-500/20'
                : 'text-muted-foreground hover:text-primary hover:bg-secondary/80'
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", id === 'intelligence_hub' && activeTab === id && 'animate-pulse')} />
            {label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: ACTIVE PARTNERS */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {existingClients.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-muted rounded-[10px] border border-dashed border-border text-slate-450">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No onboarded partner clients detected.</p>
              {!searchQuery && (
                <Button variant="outline" size="sm" className="rounded-xl mt-4 border-border text-slate-650 hover:bg-muted" onClick={() => setIsOnboardOpen(true)}>Add Client</Button>
              )}
            </div>
          ) : (
            existingClients.map((client) => {
              const activeProj = projects?.filter(p => p.client_name === client.company_name && p.status === 'in_progress') || [];
              const companyProposals = proposals?.filter(p => p.client_name === client.company_name) || [];              return (
                <div key={client.id} className="group relative rounded-[10px] overflow-hidden border border-border bg-white flex flex-col transition-all duration-300 hover:border-destructive/20 hover:shadow-xl hover:shadow-slate-200/50">
                  {/* Top gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* BG glow on hover */}
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-destructive/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative p-6 pb-5">
                    <div className="flex justify-between items-start mb-5">
                      <div className="h-12 w-12 rounded-[10px] bg-destructive/10 text-destructive border border-red-100 flex items-center justify-center shadow-sm shadow-red-500/5 group-hover:scale-105 transition-transform">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted border border-border rounded-lg px-2 py-1">
                        {client.industry || 'Media'}
                      </span>
                    </div>
                    <h3 className="font-black text-xl text-primary group-hover:text-destructive transition-colors tracking-tight">
                      {client.company_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Zap className="h-3 w-3 text-destructive" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-destructive/80">{client.service_vertical || 'Media Production'}</span>
                    </div>
                  </div>

                  <div className="px-6 pb-5 space-y-2.5 flex-1">
                    <div className="h-px bg-muted" />
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground/80 truncate">{client.email || 'poc@company.com'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground/80">PoC: <span className="font-bold text-primary">{client.contact_person || 'Unassigned'}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-destructive bg-destructive/10 border border-red-100 rounded-lg px-2 py-0.5">{activeProj.length} Projects</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{companyProposals.length} Proposals</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-border">
                    <button
                      onClick={() => { setSelectedHubCompany(client.company_name); setActiveTab('intelligence_hub'); }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 hover:text-destructive bg-muted hover:bg-muted border border-border hover:border-red-200 rounded-xl h-9 px-4 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-destructive" /> Enter Hub
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-muted-foreground/80">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-[10px] w-48 bg-white border border-border text-primary/80 shadow-lg">
                        <DropdownMenuItem asChild className="rounded-xl hover:bg-muted cursor-pointer">
                          <Link href={`/clients/${client.id}`} className="gap-2"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Portfolio View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-muted-foreground/80 rounded-xl hover:bg-muted cursor-pointer" onClick={() => setClientToArchive(client)}>
                          <Archive className="h-3.5 w-3.5" /> Archive Partner
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-muted" />
                        <DropdownMenuItem className="gap-2 text-destructive rounded-xl hover:bg-destructive/10 cursor-pointer font-bold" onClick={() => setClientToPermanentDelete(client)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: PROSPECT OPPORTUNITIES */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {prospectClients.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-muted/50 rounded-[10px] border border-dashed border-border text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-xs font-black uppercase tracking-widest">No active prospect leads in sales pipeline.</p>
            </div>
          ) : (
            prospectClients.map((prospect) => {
              const masterPartner = leads?.find(l => l.company_name === prospect.company_name && (l.stage === 'client' || l.stage === 'won'));

              return (
                <div key={prospect.id} className="group relative rounded-[10px] overflow-hidden border border-border bg-white flex flex-col transition-all duration-300 hover:border-accent/20 hover:shadow-xl hover:shadow-slate-200/50">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative p-6 pb-5">
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[8px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 rounded-lg px-2.5 py-1">
                        {prospect.stage}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted border border-border rounded-lg px-2 py-1">
                        {prospect.industry || 'Media'}
                      </span>
                    </div>
                    <h3 className="font-black text-xl text-primary tracking-tight">
                      {prospect.company_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Zap className="h-3 w-3 text-destructive" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{prospect.service_vertical || 'General Scope'}</span>
                    </div>
                  </div>

                  <div className="px-6 pb-5 space-y-3 flex-1">
                    <div className="h-px bg-muted" />
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Projected Contract</span>
                        <span className="text-sm font-black text-primary">₹{prospect.deal_value?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PoC</span>
                        <span className="text-xs font-bold text-muted-foreground/80">{prospect.contact_person || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                        <span className={cn("text-[8px] font-black uppercase tracking-widest border rounded-lg px-2 py-0.5",
                          masterPartner ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-accent bg-accent/10 border-accent/20'
                        )}>
                          {masterPartner ? "Linked Partner" : "New Account"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-border">
                    <button
                      onClick={() => { setSelectedHubCompany(prospect.company_name); setActiveTab('intelligence_hub'); }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 hover:text-primary bg-muted hover:bg-muted border border-border hover:border-border rounded-xl h-9 px-4 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-destructive" /> Enter Hub
                    </button>
                    <Link href={`/crm/${prospect.id}`}>
                      <button className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-muted-foreground/80 flex items-center justify-center transition-all border border-border hover:border-border">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: RELATIONSHIP INTEL GRAPH HUB */}
      {activeTab === 'intelligence_hub' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Quick Select Client Bar */}
          <div className="relative overflow-hidden rounded-[10px] border border-border bg-white shadow-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <div className="absolute -top-16 -right-8 w-48 h-48 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 relative">
              <div>
                <h2 className="text-xl font-black text-primary tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-destructive" /> Matrix Relationship Cockpit
                </h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Cross-Module Pipeline Graph Integrations</p>
              </div>
              <div className="flex gap-3">
                <UnifiedClientSelector 
                  companyId={companyId || ''} 
                  value={selectedHubCompany}
                  onSelect={(c) => setSelectedHubCompany(c.company_name)}
                  placeholder="Select Client Organization..."
                  className="bg-white border border-border text-primary rounded-[10px] h-11"
                  showOnboardOption={false}
                />
              </div>
            </div>
          </div>

          {/* Master Hub Multi-Column Cockpit Workspace */}
          {selectedHubGraph ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch animate-in fade-in zoom-in-95 duration-300">
              
              {/* HUB LEFT: Master Organization Details & Sentiment Index */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                
                {/* Org Card */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium overflow-hidden relative group hover:border-destructive/20 transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-indigo-500" />
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" /> Corporate Registry
                      </h3>
                      <Badge className="bg-destructive/10 text-destructive border-none font-bold text-[8px] uppercase tracking-wider">
                        {selectedHubGraph.masterProfile?.industry || 'Lifestyle'}
                      </Badge>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="flex items-start gap-3 text-muted-foreground/80">
                        <MapPin className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground block leading-none">Billing Address</span>
                          <span className="font-bold text-primary block mt-1">{selectedHubGraph.masterProfile?.billing_address || "Registry context pending update."}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 text-muted-foreground/80">
                        <FileText className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground block leading-none">GSTIN Code</span>
                          <span className="font-mono font-bold text-muted-foreground/80 block mt-1">{selectedHubGraph.masterProfile?.gstin || "NO GSTIN ON RECORD"}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-muted-foreground/80">
                        <Activity className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground block leading-none">Onboarded Category</span>
                          <span className="font-bold text-primary block mt-1">{selectedHubGraph.masterProfile?.service_vertical || "General Media"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 📊 Premium Client Engagement & Sentiment Index (Intelligence Upgrade) */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium overflow-hidden hover:border-destructive/20 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Sentiment & Risk Matrix
                    </h3>
                    
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground/80 uppercase">
                          <span>Partnership Health Index</span>
                          <span className="text-emerald-600">98.4% Exceptional</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "98.4%" }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground/80 uppercase">
                          <span>Revision Loops Average</span>
                          <span className="text-accent">1.2 Cycles (Low Risk)</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: "25%" }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground/80 uppercase">
                          <span>Average Invoice Clearance</span>
                          <span className="text-accent">12 Days (Fast Clear)</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: "40%" }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contacts Registry */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium flex-1 flex flex-col min-h-[260px] hover:border-destructive/20 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
                    <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5 mb-4 shrink-0">
                      <Users className="h-4 w-4" /> Contacts Registry
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar mb-4">
                      {selectedHubGraph.contacts.map((contact, idx) => (
                        <div key={idx} className="p-3 bg-muted hover:bg-muted/50 rounded-xl border border-border space-y-1.5 shadow-sm transition">
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-primary flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" /> {contact.name}</span>
                            <Badge className="bg-secondary text-muted-foreground/80 border-none text-[8px] font-bold">{contact.role}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-medium">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{contact.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-muted rounded-xl border border-border/60 space-y-2.5 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Add Organization Contact</span>
                      <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">New contacts can be registered directly through a new opportunity linked to this organization profile.</p>
                      <Button onClick={() => setIsQuickOppOpen(true)} className="w-full bg-secondary hover:bg-secondary border border-border text-primary/80 text-[9px] font-black uppercase tracking-wider rounded-xl h-8.5 shadow-sm transition">
                        Launch Lead Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* HUB CENTER: Active Opportunities & Proposals continuity */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                
                {/* Opportunities Pipeline */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium flex-1 flex flex-col min-h-[300px] hover:border-destructive/20 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
                    <div className="flex justify-between items-center shrink-0 mb-4">
                      <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> Sales Opportunities ({selectedHubGraph.activeOpps.length})
                      </h3>
                      <Button onClick={() => setIsQuickOppOpen(true)} size="sm" className="bg-destructive hover:bg-destructive text-white rounded-lg h-7 px-2.5 text-[8px] font-black uppercase tracking-widest">
                        + Lead
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar">
                      {selectedHubGraph.activeOpps.length === 0 ? (
                        <div className="text-center py-20 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">No active deals listed.</div>
                      ) : (
                        selectedHubGraph.activeOpps.map((opp) => (
                          <div key={opp.id} className="p-4 bg-muted hover:bg-muted/50 rounded-xl border border-border flex items-center justify-between gap-3 shadow-sm transition">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-primary block">{opp.service_vertical}</span>
                              <span className="text-[9px] text-muted-foreground font-bold block mt-0.5">Budget: <strong className="text-primary/80">₹{opp.deal_value?.toLocaleString()}</strong></span>
                            </div>
                            <Badge className="bg-accent/10 text-accent border border-accent/20 text-[8px] font-black uppercase">{opp.stage}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Proposals Ledger */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium flex-1 flex flex-col min-h-[300px] hover:border-destructive/20 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
                    <div className="flex justify-between items-center shrink-0 mb-4">
                      <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> Proposals Vault ({selectedHubGraph.relatedProposals.length})
                      </h3>
                      <Link href={`/proposals?source=crm&companyName=${encodeURIComponent(selectedHubCompany)}&vertical=${encodeURIComponent(selectedHubGraph.masterProfile?.service_vertical || '')}&industry=${encodeURIComponent(selectedHubGraph.masterProfile?.industry || '')}`}>
                        <Button size="sm" className="bg-destructive hover:bg-destructive text-white rounded-lg h-7 px-2.5 text-[8px] font-black uppercase tracking-widest">
                          + Proposal
                        </Button>
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar">
                      {selectedHubGraph.relatedProposals.length === 0 ? (
                        <div className="text-center py-20 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">No strategic proposals drafted.</div>
                      ) : (
                        selectedHubGraph.relatedProposals.map((prop) => (
                          <div key={prop.id} className="p-4 bg-muted hover:bg-muted/50 rounded-xl border border-border flex items-center justify-between gap-3 shadow-sm transition">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-primary block">{prop.title}</span>
                              <span className="text-[9px] text-muted-foreground font-bold block mt-0.5">{prop.proposal_number}</span>
                            </div>
                            <Badge className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase border",
                              prop.status === 'signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-destructive/10 text-destructive border-red-100'
                            )}>
                              {prop.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* HUB RIGHT: Workspaces Live, Financial LTV */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                
                {/* Active Projects */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium flex-1 flex flex-col min-h-[300px] hover:border-destructive/20 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
                    <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5 mb-4 shrink-0">
                      <Briefcase className="h-4 w-4" /> Production Workspaces ({selectedHubGraph.relatedProjects.length})
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar">
                      {selectedHubGraph.relatedProjects.length === 0 ? (
                        <div className="text-center py-20 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">No active project workspaces.</div>
                      ) : (
                        selectedHubGraph.relatedProjects.map((proj) => (
                          <div key={proj.id} className="p-4 bg-muted hover:bg-muted/50 rounded-xl border border-border space-y-3.5 shadow-sm transition">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-primary">{proj.project_name}</span>
                              <Badge className="bg-white border border-border text-muted-foreground text-[8px] font-bold uppercase">{proj.status}</Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase">
                                <span>Progress</span>
                                <span>{proj.progress}%</span>
                              </div>
                              <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-destructive rounded-full" style={{ width: `${proj.progress}%` }} />
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[9px] text-muted-foreground font-bold">
                              <span>Budget: ₹{proj.budget?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ledger & Invoices */}
                <Card className="bg-white border border-border rounded-2xl shadow-premium flex-1 flex flex-col min-h-[300px] hover:border-destructive/20 transition-all duration-300">
                  <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="text-[10px] font-black uppercase text-destructive tracking-[0.2em] flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" /> Financial Ledger (LTV)
                      </h3>
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black">
                        LTV: ₹{selectedHubGraph.totalLTV.toLocaleString()}
                      </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar">
                      {selectedHubGraph.relatedInvoices.length === 0 ? (
                        <div className="text-center py-20 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">No billing invoices issued.</div>
                      ) : (
                        selectedHubGraph.relatedInvoices.map((inv) => (
                          <div key={inv.id} className="p-4 bg-muted hover:bg-muted/50 rounded-xl border border-border flex items-center justify-between gap-3 shadow-sm transition">
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-primary block">{inv.invoice_number}</span>
                              <span className="text-[9px] text-muted-foreground font-bold block mt-0.5">Total: <strong className="text-primary/80">₹{inv.total?.toLocaleString()}</strong></span>
                            </div>
                            <Badge className={inv.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black" : "bg-destructive/10 text-destructive border-red-100 text-[8px] font-black"}>
                              {inv.payment_status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          ) : (
            <Card className="border-2 border-dashed border-border p-24 text-center rounded-2xl bg-white shadow-premium">
              <Sparkles className="h-14 w-14 mx-auto mb-5 text-destructive opacity-20 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Search and Select an organization above to activate Matrix Hub</p>
            </Card>
          )}

        </div>
      )}

      {/* QUICK ADD OPPORTUNITY MODAL (HUB ACCESSORY) */}
      <Dialog open={isQuickOppOpen} onOpenChange={setIsQuickOppOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[10px] bg-white border border-slate-250 text-primary shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-primary">
              <Sparkles className="h-6 w-6 text-destructive" />
              Create Sales Lead
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Register a recurring opportunity for {selectedHubCompany}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddOpportunity} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Category</Label>
              <Select 
                value={quickOpp.service_vertical} 
                onValueChange={(val) => setQuickOpp({...quickOpp, service_vertical: val, sub_vertical: CONTENT_VERTICALS.find(v => v.name === val)?.services[0] || ""})}
              >
                <SelectTrigger className="rounded-xl h-11 bg-white border-border text-primary">
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border text-primary/80">
                  {CONTENT_VERTICALS.map(v => (
                    <SelectItem key={v.id} value={v.name} className="text-xs focus:bg-destructive focus:text-white">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Vertical</Label>
              <Select 
                value={quickOpp.sub_vertical} 
                onValueChange={(val) => setQuickOpp({...quickOpp, sub_vertical: val})}
              >
                <SelectTrigger className="rounded-xl h-11 bg-white border-border text-primary">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border text-primary/80">
                  {CONTENT_VERTICALS.find(v => v.name === quickOpp.service_vertical)?.services.map(s => (
                    <SelectItem key={s} value={s} className="text-xs focus:bg-destructive focus:text-white">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Budget (₹)</Label>
                <Input 
                  type="number"
                  placeholder="250000" 
                  value={quickOpp.deal_value}
                  onChange={(e) => setQuickOpp({...quickOpp, deal_value: e.target.value})}
                  className="rounded-xl h-11 bg-white border-border text-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stage</Label>
                <Select onValueChange={(val) => setQuickOpp({...quickOpp, stage: val})} value={quickOpp.stage}>
                  <SelectTrigger className="rounded-xl h-11 bg-white border-border text-primary">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border text-primary/80">
                    <SelectItem value="lead" className="text-xs focus:bg-destructive focus:text-white">Lead</SelectItem>
                    <SelectItem value="contact" className="text-xs focus:bg-destructive focus:text-white">Contacted</SelectItem>
                    <SelectItem value="proposal" className="text-xs focus:bg-destructive focus:text-white">Proposal Sent</SelectItem>
                    <SelectItem value="negotiation" className="text-xs focus:bg-destructive focus:text-white">In Negotiation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-destructive hover:bg-destructive text-white rounded-xl h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/10">
                Initialize Opportunity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ORIGINAL ONBOARD CLIENT DIALOG (FULLY PRESERVED) */}
      <Dialog open={isOnboardOpen} onOpenChange={(open) => !open && resetOnboarding()}>
        <DialogContent className="sm:max-w-[1000px] rounded-[10px] p-0 overflow-hidden border border-border shadow-2xl h-[90vh] max-h-[900px] flex flex-col bg-white text-primary">
          <div className="flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
            {/* Header - Fixed Height */}
            <div className="p-8 border-b border-border bg-white flex items-center justify-between shrink-0 text-primary">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-destructive rounded-[10px] flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-primary">Add New Client</DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs mt-0.5">Enter client details and select services.</DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", onboardStep === 'info' ? "bg-destructive" : "bg-secondary")} />
                <div className={cn("h-2 w-2 rounded-full", onboardStep === 'services' ? "bg-destructive" : "bg-secondary")} />
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {onboardStep === 'info' ? (
                <div className="flex-1 p-10 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Company Name</Label>
                      <Input 
                        id="companyName" 
                        placeholder="e.g. RedBull Media House" 
                        value={newClient.company_name}
                        onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                        required
                        className="rounded-xl h-12 bg-white border-border text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Industry</Label>
                      <Select onValueChange={(val) => setNewClient({...newClient, industry: val})} value={newClient.industry}>
                        <SelectTrigger className="rounded-xl h-12 bg-white border-border text-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-250 text-primary/80">
                          {INDUSTRIES.map(i => <SelectItem key={i} value={i} className="text-xs focus:bg-destructive focus:text-white">{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact Person (Optional)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="contactPerson" 
                          placeholder="e.g. Sarah Jenkins" 
                          value={newClient.contact_person}
                          onChange={(e) => setNewClient({...newClient, contact_person: e.target.value})}
                          className="rounded-xl h-12 pl-10 bg-white border-border text-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Primary Contact Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email"
                          placeholder="poc@client.com" 
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          className="rounded-xl h-12 pl-10 bg-white border-border text-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstin" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">GSTIN (Optional)</Label>
                      <Input 
                        id="gstin" 
                        placeholder="e.g. 22AAAAA0000A1Z5" 
                        value={newClient.gstin}
                        onChange={(e) => setNewClient({...newClient, gstin: e.target.value})}
                        className="rounded-xl h-12 uppercase font-mono bg-white border-border text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Address (Optional)</Label>
                      <Textarea 
                        id="billingAddress" 
                        placeholder="Complete billing address for invoices..." 
                        value={newClient.billing_address}
                        onChange={(e) => setNewClient({...newClient, billing_address: e.target.value})}
                        className="rounded-xl min-h-[100px] bg-white border-border text-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 flex flex-col p-8 bg-muted border-r border-border min-h-0 overflow-hidden">
                    <div className="mb-6 shrink-0">
                      <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">01. Select Category</h3>
                      <div className="overflow-x-auto pb-4 custom-scrollbar">
                        <div className="flex gap-3">
                          {CONTENT_VERTICALS.map((vertical) => (
                            <Card 
                              key={vertical.id}
                              className={cn(
                                "cursor-pointer transition-all duration-300 border-2 rounded-[10px] group shrink-0 w-40 h-32 flex items-center justify-center text-center p-4",
                                selectedVerticalId === vertical.id 
                                  ? "border-destructive shadow-md bg-white" 
                                  : "border-transparent hover:border-border bg-white/70"
                              )}
                              onClick={() => setSelectedVerticalId(vertical.id)}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white", vertical.color)}>
                                  <vertical.icon className="h-4 w-4" />
                                </div>
                                <span className="text-[9px] font-black leading-tight uppercase tracking-tight text-primary">{vertical.name}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">02. Select Services</h3>
                      {activeVertical ? (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                            {activeVertical.services.map((service) => {
                              const isSelected = selectedServices[activeVertical.id]?.includes(service);
                              return (
                                <div 
                                  key={service}
                                  className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer bg-white",
                                    isSelected 
                                      ? "bg-destructive/10 border-red-200 shadow-sm" 
                                      : "border-border hover:border-border"
                                  )}
                                  onClick={() => toggleService(activeVertical.id, service)}
                                >
                                  <Checkbox 
                                    checked={isSelected} 
                                    className="h-5 w-5 rounded border-2 border-border" 
                                    onCheckedChange={() => toggleService(activeVertical.id, service)}
                                  />
                                  <p className={cn("text-xs font-bold", isSelected ? "text-destructive" : "text-muted-foreground/80")}>{service}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[10px] text-muted-foreground bg-muted">
                          <Zap className="h-10 w-10 mb-2 text-destructive animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Select a category above to view services</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="w-80 border-l border-border bg-white flex flex-col shrink-0 min-h-0 overflow-hidden">
                    <div className="p-6 border-b border-border shrink-0">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Scope Synthesis</h4>
                      <p className="text-xs font-bold text-primary">Client Profile Summary</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 text-primary/80">
                      <div className="space-y-6">
                        {totalServicesCount === 0 ? (
                           <div className="text-center py-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No services defined</div>
                        ) : (
                          Object.entries(selectedServices).map(([vId, services]) => {
                            const v = CONTENT_VERTICALS.find(x => x.id === vId);
                            return (
                              <div key={vId} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-4 w-1 rounded-full", v?.color)} />
                                  <h5 className="text-[9px] font-black uppercase text-muted-foreground">{v?.name}</h5>
                                </div>
                                <div className="space-y-1 pl-3">
                                  {services.map(s => (
                                    <div key={s} className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/80">
                                      <span className="flex-1 pr-2">• {s}</span>
                                      <button onClick={(e) => { e.stopPropagation(); toggleService(vId, s); }} className="text-destructive hover:text-destructive">
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="p-6 border-t border-border bg-muted shrink-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-muted-foreground">Services Registry</span>
                        <Badge className="bg-destructive text-white font-black h-5 text-[10px] px-2">{totalServicesCount}</Badge>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>

            {/* Footer - Fixed Height */}
            <div className="p-8 border-t border-border shrink-0 bg-white flex items-center justify-between">
              {onboardStep === 'info' ? (
                <>
                  <Button variant="ghost" onClick={() => setIsOnboardOpen(false)} className="rounded-xl font-bold text-muted-foreground hover:text-muted-foreground/80">Cancel</Button>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleOnboardClient(true)} 
                      disabled={!newClient.company_name || isSubmitting}
                      className="rounded-[10px] h-12 px-8 bg-destructive hover:bg-destructive text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-red-500/20"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                      Configure Services
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setOnboardStep('info')} className="rounded-xl font-bold gap-2 text-muted-foreground hover:text-muted-foreground/80">
                    <ChevronLeft className="h-4 w-4" /> Details
                  </Button>
                  <Button 
                    onClick={() => handleOnboardClient(false)} 
                    disabled={isSubmitting}
                    className="rounded-[10px] h-12 px-10 bg-destructive hover:bg-destructive text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-red-500/20"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Finalize Onboarding
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cascading Archive Alert Dialog */}
      <AlertDialog open={!!clientToArchive} onOpenChange={(open) => !open && setClientToArchive(null)}>
        <AlertDialogContent className="rounded-[10px] bg-white border border-border text-primary shadow-2xl">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-[10px] flex items-center justify-center text-destructive mb-4">
              <Archive className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-slate-850">Delete Client Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              This will move "{clientToArchive?.company_name}" and associated active projects to archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-bold text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-destructive hover:bg-destructive rounded-xl text-white">Confirm Deletion</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!clientToPermanentDelete} onOpenChange={(open) => !open && setClientToPermanentDelete(null)}>
        <AlertDialogContent className="rounded-[10px] p-8 max-w-md border-0 bg-white">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-[10px] flex items-center justify-center text-destructive mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-slate-850">Permanently Delete Client?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              This will permanently delete "{clientToPermanentDelete?.company_name}" and ALL associated projects from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-bold text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermanentDelete} className="bg-destructive hover:bg-destructive rounded-xl text-white font-bold h-12 px-6">Delete Forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
