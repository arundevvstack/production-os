"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Search, 
  Loader2, 
  Clock, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  BrainCircuit,
  ArrowRight,
  Target,
  FileCheck,
  Database,
  Share2,
  Mail,
  MessageSquare,
  Globe,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  List,
  Printer,
  FileDown,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  ImageIcon,
  Trash2,
  X,
  Copy,
  Building2,
  DollarSign,
  UserCheck,
  Edit3,
  ShieldCheck,
  ListTree,
  AlertTriangle,
  History,
  Lock,
  MessageCircle,
  HelpCircle,
  Eye,
  Settings,
  Activity,
  Send,
  Users,
  Check,
  RefreshCw,
  FolderPlus,
  Receipt
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
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
import { toast } from "@/hooks/use-toast";
import { generateProposalContent, type GenerateProposalContentOutput } from "@/ai/flows/generate-proposal-content";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
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

// ----------------------------------------------------
// TypeScript Interfaces & Data Models
// ----------------------------------------------------

interface LineItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Milestone {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  trigger_condition: string;
}

interface ApprovalState {
  approved: boolean;
  date?: string;
  signed_by?: string;
  comments?: string;
}

interface ProposalApprovals {
  sales_executive: ApprovalState;
  sales_manager: ApprovalState;
  accounts_approval: ApprovalState;
  director_approval: ApprovalState;
}

interface ProposalComment {
  id: string;
  user: string;
  role: string;
  text: string;
  timestamp: string;
  is_client?: boolean;
}

interface ProposalActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

interface VersionRecord {
  version: string; // V1, V2, V3, Final
  created_at: string;
  created_by: string;
  subtotal: number;
  total: number;
  description: string;
}

interface ClientSignature {
  signed: boolean;
  name?: string;
  signed_at?: string;
  ip_address?: string;
  certificate_id?: string;
}

interface ProposalContent {
  proposal_title: string;
  client: string;
  proposal_type: "proposal" | "quote"; // Determines DP-PROP or DP-QTN prefix
  client_email?: string;
  client_phone?: string;
  client_gstin?: string;
  client_address?: string;
  sections: Array<{ title: string; content: string }>;
  version_history: VersionRecord[];
  current_version_name: string;
  line_items: LineItem[];
  milestones: Milestone[];
  approvals: ProposalApprovals;
  comments: ProposalComment[];
  activity_log: ProposalActivity[];
  client_signature: ClientSignature;
  terms_conditions: string;
  discount_amount: number;
  tax_type: "Intra-state" | "Inter-state" | "Export" | "Exempt";
  tax_rate: number; // 18 for CGST/SGST/IGST, 0 for export/exempt
  payment_terms: string;
  due_date: string;
  isPreview?: boolean;
}

// ----------------------------------------------------
// Service Engine Templates (Presets)
// ----------------------------------------------------

const SERVICE_TEMPLATES: Record<string, {
  name: string;
  line_items: Omit<LineItem, 'id' | 'total'>[];
  milestones: Omit<Milestone, 'id' | 'amount'>[];
  staffing: { role: string; count: number; day_rate: number }[];
  risks: string[];
}> = {
  video_production: {
    name: "Video Production (Brand Commercial)",
    line_items: [
      { name: "Executive Creative Direction & Scriptwriting", category: "Pre-Production", quantity: 1, unit_price: 75000 },
      { name: "Cinematography Crew & RED V-Raptor Camera Package", category: "Production", quantity: 3, unit_price: 85000 },
      { name: "Professional Edit, Sound Design & Color Grading", category: "Post-Production", quantity: 1, unit_price: 120000 }
    ],
    milestones: [
      { title: "Project Onboarding & Pre-Production Sign-off", percentage: 50, trigger_condition: "Upon mutual signing of strategic proposal" },
      { title: "Principal Photography Wrap", percentage: 30, trigger_condition: "Completion of raw footage ingestion" },
      { title: "Final Deliverable Approvals", percentage: 20, trigger_condition: "Upon delivery of mastered brand assets" }
    ],
    staffing: [
      { role: "Director", count: 1, day_rate: 65000 },
      { role: "Director of Photography", count: 1, day_rate: 55000 },
      { role: "Lead Editor", count: 1, day_rate: 35000 }
    ],
    risks: [
      "Weather contingency: Outdoor shooting schedules are volatile.",
      "VFX workload: Preloaded editing timeline allocates up to 3 feedback revisions maximum."
    ]
  },
  ai_commercials: {
    name: "AI Commercials (Neural Video)",
    line_items: [
      { name: "AI Prompt Architecture & Creative Conceptualization", category: "Pre-Production", quantity: 1, unit_price: 50000 },
      { name: "Neural Video Generation & High-Resolution Upscaling", category: "Production", quantity: 1, unit_price: 150000 },
      { name: "Cinematic Voiceover Synthesis & Dynamic Sound FX", category: "Post-Production", quantity: 1, unit_price: 50000 }
    ],
    milestones: [
      { title: "Concept Board & Prompt Architecture Sign-off", percentage: 50, trigger_condition: "Upon proposal signing" },
      { title: "First Cut Review (AI Renders)", percentage: 40, trigger_condition: "Completion of primary neural generation pass" },
      { title: "Final Asset Lock & Licensing", percentage: 10, trigger_condition: "Delivery of final high-res commercial package" }
    ],
    staffing: [
      { role: "AI Prompt Engineer", count: 1, day_rate: 45000 },
      { role: "CGI Compositor", count: 1, day_rate: 40000 },
      { role: "Audio Designer", count: 1, day_rate: 30000 }
    ],
    risks: [
      "Generation drift: Minor variations in character consistency may occur across scenes.",
      "Upscaling latency: High-fidelity generation may extend production by 2-3 additional business days."
    ]
  },
  cgi_3d: {
    name: "CGI & 3D (Virtual Production)",
    line_items: [
      { name: "3D Asset Modeling & Texturing", category: "Pre-Production", quantity: 1, unit_price: 180000 },
      { name: "Unreal Engine Virtual Environment & Set Integration", category: "Production", quantity: 1, unit_price: 320000 },
      { name: "Cinematic CGI Compositing & Finishing", category: "Post-Production", quantity: 1, unit_price: 150000 }
    ],
    milestones: [
      { title: "3D Wireframe & Character Layout Approvals", percentage: 40, trigger_condition: "Completion of pre-visualization phase" },
      { title: "First-Pass Render Submission", percentage: 40, trigger_condition: "Delivery of rough-rendered draft sets" },
      { title: "Final Composite Delivery", percentage: 20, trigger_condition: "Delivery of finalized Virtual Production master assets" }
    ],
    staffing: [
      { role: "Lead 3D Modeler", count: 1, day_rate: 55000 },
      { role: "Unreal Engine Tech Artist", count: 2, day_rate: 65000 },
      { role: "CGI Compositor", count: 1, day_rate: 45000 }
    ],
    risks: [
      "Hardware Render Overhead: Complex scene renders require dedicated workstation time.",
      "Texture scope creep: Adding custom assets late in production will trigger revision costs."
    ]
  }
};

// ----------------------------------------------------
// Self-Healing JSON Data Parser
// ----------------------------------------------------

function parseProposalContent(proposal: any): ProposalContent {
  let parsed: any = {};
  try {
    parsed = JSON.parse(proposal.content);
  } catch (e) {
    parsed = {};
  }

  // Ensure default structures exist with all standard fields
  return {
    proposal_title: parsed.proposal_title || proposal.title || "Premium Production Strategy",
    client: parsed.client || proposal.client_name || "Valued Enterprise Partner",
    proposal_type: parsed.proposal_type || "proposal",
    client_email: parsed.client_email || "",
    client_phone: parsed.client_phone || "",
    client_gstin: parsed.client_gstin || "",
    client_address: parsed.client_address || "",
    sections: parsed.sections || [],
    current_version_name: parsed.current_version_name || "V1",
    version_history: parsed.version_history || [
      { version: 'V1', created_at: proposal.created_at || new Date().toISOString(), created_by: 'AI Architect', subtotal: 500000, total: 590000, description: 'AI generated default draft' }
    ],
    line_items: parsed.line_items || [
      { id: 'li_1', name: 'High-Impact Brand Commercial Production', category: 'Video Production', quantity: 1, unit_price: 350000, total: 350000 },
      { id: 'li_2', name: 'Cinema 3D/CGI Renderings & VFX Integration', category: 'CGI & 3D', quantity: 1, unit_price: 150000, total: 150000 }
    ],
    milestones: parsed.milestones || [
      { id: 'm1', title: 'Onboarding & Creative Kickoff', percentage: 50, amount: 250000, trigger_condition: 'Upon signature & contract signing' },
      { id: 'm2', title: 'Post-Production Draft Submission', percentage: 30, amount: 150000, trigger_condition: 'Upon approval of rough cut' },
      { id: 'm3', title: 'Final Handover & Delivery', percentage: 20, amount: 100000, trigger_condition: 'Upon final project signoff' }
    ],
    approvals: parsed.approvals || {
      sales_executive: { approved: true, date: proposal.created_at || new Date().toISOString(), signed_by: 'System' },
      sales_manager: { approved: false },
      accounts_approval: { approved: false },
      director_approval: { approved: false }
    },
    comments: parsed.comments || [
      { id: 'c1', user: 'AI Architect', role: 'AI Assistant', text: 'System has preloaded deliverables and milestones matching this department.', timestamp: proposal.created_at || new Date().toISOString() }
    ],
    activity_log: parsed.activity_log || [
      { id: 'a1', action: 'Proposal draft initialized via AI Flow', user: 'AI Architect', timestamp: proposal.created_at || new Date().toISOString() }
    ],
    client_signature: parsed.client_signature || { signed: false },
    terms_conditions: parsed.terms_conditions || "All raw media files remain copyright of Define Perspective until final milestone payment is received. Standard feedback rounds are capped at three iterations. Revision invoices are processed within 15 working days.",
    discount_amount: parsed.discount_amount || 0,
    tax_type: parsed.tax_type || "Intra-state",
    tax_rate: parsed.tax_rate !== undefined ? parsed.tax_rate : 18,
    payment_terms: parsed.payment_terms || "50% Advance, 30% Mid-way, 20% Delivery",
    due_date: parsed.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}

// ----------------------------------------------------
// Main Component
// ----------------------------------------------------

function ProposalsContent() {
  const { profile, isLoading: isTenantLoading, companyId, company, roleId, isSuperAdmin } = useTenant();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Dialog & Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'input' | 'preview'>('input');
  
  // Builder Widescreen HUD States
  const [activeBuilderTab, setActiveBuilderTab] = useState<'editor' | 'pricing' | 'client_portal'>('editor');
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [proposalToDelete, setProposalToDelete] = useState<any>(null);

  // Client signature input simulation state
  const [signatureName, setSignatureName] = useState("");

  // Live Chat internal/client comment state
  const [newCommentText, setNewCommentText] = useState("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Version creation state
  const [versionDescription, setVersionDescription] = useState("");
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);

  const [aiInputs, setAIInputs] = useState({
    service_vertical: "",
    client_type: "",
    location: "",
    project_description: "",
    project_duration: "3 Months",
    target_market: "",
    budget: "",
    leadId: "",
    proposal_type: "proposal" as "proposal" | "quote"
  });

  const [generatedDraft, setGeneratedDraft] = useState<GenerateProposalContentOutput | null>(null);

  // Fetch Proposals from Supabase
  const { data: proposals, isLoading: isProposalsLoading } = useSupabaseCollection('Proposal', {
    orderBy: { created_at: 'desc' }
  });
  const reloadProposals = () => {};

  // Fetch CRM Leads
  const { data: leads } = useSupabaseCollection('Prospect', {
    orderBy: { company_name: 'asc' }
  });

  // ----------------------------------------------------
  // Lifecycle Handlers
  // ----------------------------------------------------

  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'research' || source === 'crm') {
      const projectName = searchParams.get('projectName') || searchParams.get('companyName') || '';
      const industry = searchParams.get('industry') || '';
      const services = searchParams.get('services') || searchParams.get('vertical') || '';
      const context = searchParams.get('context') || '';
      const location = searchParams.get('location') || '';
      const leadId = searchParams.get('leadId') || '';

      setAIInputs(prev => ({
        ...prev,
        service_vertical: services,
        client_type: industry,
        location: location,
        leadId: leadId,
        project_description: context || `Strategic production proposal for ${projectName}'s ${services} project.`
      }));

      setIsAddOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const propId = searchParams.get('id');
    if (propId && proposals) {
      const target = proposals.find(p => p.id === propId);
      if (target) {
        handleEditProposal(target);
      }
    }
  }, [searchParams, proposals]);

  // Grouped clients search mapping
  const groupedClients = useMemo(() => {
    if (!leads) return { clients: [], leads: [], opportunities: [], prospects: [] };
    
    const clientMap: Record<string, any> = {};
    leads.forEach(l => {
      const name = l.company_name?.trim();
      if (!name) return;
      
      if (!clientMap[name]) {
        clientMap[name] = l;
      }
    });

    const list = Object.values(clientMap);
    
    return {
      clients: list.filter((l: any) => l.stage === 'client' || l.stage === 'won'),
      opportunities: list.filter((l: any) => l.stage === 'proposal' || l.stage === 'negotiation'),
      leads: list.filter((l: any) => l.stage === 'lead' || l.stage === 'contact'),
      prospects: list.filter((l: any) => !['client', 'won', 'proposal', 'negotiation', 'lead', 'contact'].includes(l.stage || ''))
    };
  }, [leads]);

  // ----------------------------------------------------
  // AI Architect Generator Call
  // ----------------------------------------------------

  const handleGenerateAI = async () => {
    if (!aiInputs.service_vertical || !aiInputs.client_type || !aiInputs.project_description) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter your core project service and industry." });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateProposalContent({
        service_vertical: aiInputs.service_vertical,
        client_type: aiInputs.client_type,
        location: aiInputs.location,
        project_description: aiInputs.project_description,
        project_duration: aiInputs.project_duration,
        target_market: aiInputs.target_market,
        budget: aiInputs.budget
      });
      setGeneratedDraft(result);
      setGenerationStep('preview');
      setActiveSectionIdx(0);
      toast({ title: "Draft Proposal Created", description: "AI has successfully prepared your corporate strategy document." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Generation Failed", description: "Could not initialize LLM model stream." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !generatedDraft) return;

    setIsSubmitting(true);
    
    // Concurrency-safe count fetch for sequential numbering
    const { count } = await supabase.from('Proposal').select('*', { count: 'exact', head: true });
    const serialSuffix = String((count || 0) + 1).padStart(4, '0');
    
    const prefix = aiInputs.proposal_type === 'quote' ? 'DP-QTN' : 'DP-PROP';
    const uniqueNumber = `${prefix}-2026-${serialSuffix}`;

    const selectedLead = leads?.find(l => l.id === aiInputs.leadId);

    // Create base advanced JSON block
    const defaultAdvancedJSON: ProposalContent = {
      proposal_title: generatedDraft.proposal_title,
      client: generatedDraft.client,
      proposal_type: aiInputs.proposal_type,
      client_email: selectedLead?.email || "",
      client_phone: "",
      client_gstin: selectedLead?.gstin || "",
      client_address: selectedLead?.billing_address || "",
      sections: generatedDraft.sections,
      isPreview: generatedDraft.isPreview || false,
      current_version_name: 'V1',
      version_history: [
        { version: 'V1', created_at: new Date().toISOString(), created_by: profile?.fullName || 'AI Sales Architect', subtotal: 350000, total: 413000, description: 'AI Generated Initial Proposal Draft' }
      ],
      line_items: [
        { id: 'li_1', name: `${aiInputs.service_vertical || 'General Video Production'} - Core Assets`, category: 'Production', quantity: 1, unit_price: 250000, total: 250000 },
        { id: 'li_2', name: 'AI Creative Direction & Prompt Engineering', category: 'Pre-Production', quantity: 1, unit_price: 100000, total: 100000 }
      ],
      milestones: [
        { id: 'm1', title: 'Onboarding & Creative Kickoff', percentage: 50, amount: 175000, trigger_condition: 'Upon mutual signing of strategic proposal' },
        { id: 'm2', title: 'Post-Production Draft Submission', percentage: 30, amount: 105000, trigger_condition: 'Upon approval of initial rough cut review' },
        { id: 'm3', title: 'Final Handover & Asset Licensing', percentage: 20, amount: 70000, trigger_condition: 'Upon final high-res delivery and lock' }
      ],
      approvals: {
        sales_executive: { approved: true, date: new Date().toISOString(), signed_by: profile?.fullName || 'System' },
        sales_manager: { approved: false },
        accounts_approval: { approved: false },
        director_approval: { approved: false }
      },
      comments: [
        { id: 'c1', user: 'AI Sales Architect', role: 'AI Assistant', text: `Proposal initialized. Formatted proposal serial generated successfully: ${uniqueNumber}`, timestamp: new Date().toISOString() }
      ],
      activity_log: [
        { id: 'a1', action: `Proposal draft ${uniqueNumber} initialized via AI Sales pipeline.`, user: 'AI Architect', timestamp: new Date().toISOString() }
      ],
      client_signature: { signed: false },
      terms_conditions: "All creative production rights and copyright assets are owned by Define Perspective until final milestone reconciliation. Feedback cycles are capped at three edits. Late payment parameters apply after 14 business days.",
      discount_amount: 0,
      tax_type: 'Intra-state',
      tax_rate: 18,
      payment_terms: "50% Sign-on advance, 30% Cut review, 20% Final Delivery",
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    // Standard client-side UUID generator to prevent Postgres null id constraint violations
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newId = generateUUID();

    const { data, error } = await supabase.from('Proposal').insert({
      id: newId,
      company_id: companyId,
      lead_id: aiInputs.leadId || null,
      title: generatedDraft.proposal_title,
      client_name: generatedDraft.client,
      proposal_number: uniqueNumber,
      content: JSON.stringify(defaultAdvancedJSON), 
      status: 'draft',
    }).select().single();

    if (error) {
      toast({ variant: "destructive", title: "Database Sync Error", description: error.message });
    } else {
      // Create global activity log
      await supabase.from('ActivityLog').insert({
        company_id: companyId,
        user_id: profile?.id || 'system',
        user_name: profile?.fullName || 'AI Sales Agent',
        action: 'Create Proposal',
        details: `Successfully generated proposal ${uniqueNumber} for client ${generatedDraft.client}.`
      });

      // Create notification
      await supabase.from('Notification').insert({
        company_id: companyId,
        user_id: profile?.id || 'system',
        title: 'New Proposal Draft',
        message: `Proposal ${uniqueNumber} for ${generatedDraft.client} is ready for internal approval.`,
        is_read: false
      });

      // CRM Sync Stage: Update to Proposal Draft stage
      if (aiInputs.leadId) {
        await supabase.from('Prospect').update({ stage: 'proposal_draft' }).eq('id', aiInputs.leadId);
      }

      setGeneratedDraft(null);
      setGenerationStep('input');
      setIsAddOpen(false);
      setIsSubmitting(false);
      toast({ title: "Proposal Saved Successfully" });
      reloadProposals();
      
      if (data) {
        handleEditProposal(data);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!companyId || !proposalToDelete) return;
    await supabase.from('Proposal').delete().eq('id', proposalToDelete.id);
    setProposalToDelete(null);
    reloadProposals();
    toast({ title: "Proposal Deleted", description: "All database references deleted." });
  };

  // ----------------------------------------------------
  // Builder Load & Save States
  // ----------------------------------------------------

  const handleEditProposal = (proposal: any) => {
    const parsed = parseProposalContent(proposal);
    setEditingProposal({ ...proposal, parsedContent: parsed });
    setActiveSectionIdx(0);
    setSignatureName("");
    setActiveBuilderTab("editor");
  };

  const saveEditingProposal = async (updatedContent: ProposalContent, customStatus?: string) => {
    if (!editingProposal) return;
    
    // Auto-calculate subtotal, discounts, GST, and totals
    const subtotal = updatedContent.line_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const taxableSubtotal = Math.max(0, subtotal - updatedContent.discount_amount);
    
    // Taxes
    const rate = updatedContent.tax_type === 'Export' || updatedContent.tax_type === 'Exempt' ? 0 : 18;
    updatedContent.tax_rate = rate;
    const tax = Math.round(taxableSubtotal * (rate / 100));
    const total = taxableSubtotal + tax;

    // Distribute milestone schedules based on percentages
    updatedContent.milestones = updatedContent.milestones.map(m => ({
      ...m,
      amount: Math.round(total * (m.percentage / 100))
    }));

    const status = customStatus || editingProposal.status;

    // Write back JSON string to DB
    const { error } = await supabase.from('Proposal').update({
      title: updatedContent.proposal_title,
      client_name: updatedContent.client,
      status: status,
      content: JSON.stringify(updatedContent)
    }).eq('id', editingProposal.id);

    if (error) {
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } else {
      setEditingProposal((prev: any) => ({
        ...prev,
        title: updatedContent.proposal_title,
        client_name: updatedContent.client,
        status: status,
        parsedContent: updatedContent
      }));

      // CRM Sync stage mapping based on status
      if (editingProposal.lead_id) {
        let crmStage = 'proposal_draft';
        if (status === 'sent') crmStage = 'proposal_sent';
        else if (status === 'negotiation') crmStage = 'negotiation';
        else if (status === 'approved' || status === 'signed' || status === 'won') crmStage = 'won';
        else if (status === 'rejected' || status === 'lost') crmStage = 'lost';

        await supabase.from('Prospect').update({ stage: crmStage }).eq('id', editingProposal.lead_id);
      }

      toast({ title: "Document Synchronized", description: "Ledger and CRM pipelines updated." });
      reloadProposals();
    }
  };

  // ----------------------------------------------------
  // Version Control History Ceremonies
  // ----------------------------------------------------

  const createNewVersion = () => {
    if (!editingProposal || !versionDescription.trim()) return;
    const content = editingProposal.parsedContent;
    const subtotal = content.line_items.reduce((sum: number, item: LineItem) => sum + (item.unit_price * item.quantity), 0);
    const taxableSubtotal = Math.max(0, subtotal - content.discount_amount);
    const tax = Math.round(taxableSubtotal * (content.tax_rate / 100));
    const total = taxableSubtotal + tax;

    const nextVerIndex = content.version_history.length + 1;
    const nextVerName = `V${nextVerIndex}`;

    const newHistory: VersionRecord = {
      version: nextVerName,
      created_at: new Date().toISOString(),
      created_by: profile?.fullName || 'Sales Agent',
      subtotal,
      total,
      description: versionDescription
    };

    const updated = {
      ...content,
      current_version_name: nextVerName,
      version_history: [...content.version_history, newHistory]
    };

    updated.activity_log.push({
      id: `act_${Date.now()}`,
      action: `Created new proposal iteration: ${nextVerName}`,
      user: profile?.fullName || 'Team Member',
      timestamp: new Date().toISOString()
    });

    setVersionDescription("");
    setIsVersionDialogOpen(false);
    saveEditingProposal(updated);
  };

  // ----------------------------------------------------
  // Service Template Loader
  // ----------------------------------------------------

  const applyServiceTemplate = (templateKey: string) => {
    if (!editingProposal) return;
    const template = SERVICE_TEMPLATES[templateKey];
    if (!template) return;

    const updated = { ...editingProposal.parsedContent };
    
    // Load presets
    updated.line_items = template.line_items.map((item, idx) => ({
      id: `li_template_${idx}_${Date.now()}`,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.unit_price * item.quantity
    }));

    updated.milestones = template.milestones.map((m, idx) => ({
      id: `m_template_${idx}_${Date.now()}`,
      title: m.title,
      percentage: m.percentage,
      amount: 0, // dynamic
      trigger_condition: m.trigger_condition
    }));

    updated.activity_log.push({
      id: `act_${Date.now()}`,
      action: `Imported operational preset: ${template.name}`,
      user: profile?.fullName || 'Designer',
      timestamp: new Date().toISOString()
    });

    saveEditingProposal(updated);
  };

  // ----------------------------------------------------
  // Pricing Line Item Builders
  // ----------------------------------------------------

  const addLineItem = () => {
    if (!editingProposal) return;
    const updated = { ...editingProposal.parsedContent };
    updated.line_items.push({
      id: `li_custom_${Date.now()}`,
      name: "Standard Scope Item Description",
      category: "Production",
      quantity: 1,
      unit_price: 25000,
      total: 25000
    });
    saveEditingProposal(updated);
  };

  const removeLineItem = (id: string) => {
    if (!editingProposal) return;
    const updated = { ...editingProposal.parsedContent };
    updated.line_items = updated.line_items.filter((item: LineItem) => item.id !== id);
    saveEditingProposal(updated);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    if (!editingProposal) return;
    const updated = { ...editingProposal.parsedContent };
    updated.line_items = updated.line_items.map((item: LineItem) => {
      if (item.id === id) {
        const itemCopy = { ...item, [field]: value };
        itemCopy.total = itemCopy.quantity * itemCopy.unit_price;
        return itemCopy;
      }
      return item;
    });
    setEditingProposal((prev: any) => ({
      ...prev,
      parsedContent: updated
    }));
  };

  // ----------------------------------------------------
  // Internal Multi-stage Approval Signatures
  // ----------------------------------------------------

  const signInternalApproval = async (role: keyof ProposalApprovals, approveAction: boolean, reasonText = "") => {
    if (!editingProposal) return;
    const updated = { ...editingProposal.parsedContent };
    
    updated.approvals[role] = {
      approved: approveAction,
      date: new Date().toISOString(),
      signed_by: profile?.fullName || 'Authorized Expert',
      comments: reasonText
    };

    const friendlyRole = role.replace('_', ' ').toUpperCase();
    updated.activity_log.push({
      id: `act_${Date.now()}`,
      action: approveAction 
        ? `Internally approved by ${friendlyRole}` 
        : `Revision requested by ${friendlyRole}: "${reasonText}"`,
      user: profile?.fullName || 'Manager',
      timestamp: new Date().toISOString()
    });

    let currentStatus = editingProposal.status;
    if (!approveAction) {
      currentStatus = 'negotiation'; // Move back to negotiation
    } else {
      // Check if all levels are finalized
      const exec = updated.approvals.sales_executive.approved;
      const mgr = updated.approvals.sales_manager.approved;
      const accts = updated.approvals.accounts_approval.approved;
      const dir = updated.approvals.director_approval.approved;

      if (exec && mgr && accts && dir) {
        currentStatus = 'sent'; // Escalated to active client portal view
      }
    }

    // Database updates log
    await supabase.from('ActivityLog').insert({
      company_id: companyId,
      user_id: profile?.id || 'system',
      user_name: profile?.fullName || 'System',
      action: approveAction ? 'Approve Stage' : 'Request Revision',
      details: `Proposal ${editingProposal.proposal_number} internal review updated by ${friendlyRole}.`
    });

    saveEditingProposal(updated, currentStatus);
  };

  // ----------------------------------------------------
  // Live Feed Comments
  // ----------------------------------------------------

  const addComment = (isClientSide = false) => {
    if (!newCommentText.trim() || !editingProposal) return;
    const updated = { ...editingProposal.parsedContent };
    
    updated.comments.push({
      id: `c_${Date.now()}`,
      user: isClientSide ? `${signatureName || 'Client Stakeholder'}` : `${profile?.fullName || 'Team Member'}`,
      role: isClientSide ? 'Client Director' : (roleId || 'Production Crew'),
      text: newCommentText,
      timestamp: new Date().toISOString(),
      is_client: isClientSide
    });

    setNewCommentText("");
    saveEditingProposal(updated);
  };

  // ----------------------------------------------------
  // E-Signature and Auto Project & Invoice activation
  // ----------------------------------------------------

  const handleClientDigitalSignature = async () => {
    if (!signatureName.trim() || !editingProposal) {
      toast({ variant: "destructive", title: "Execution Refused", description: "Please fill in your full legal name to authorize." });
      return;
    }

    const updated = { ...editingProposal.parsedContent };
    const certSerial = `CERT-DP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    updated.client_signature = {
      signed: true,
      name: signatureName,
      signed_at: new Date().toISOString(),
      ip_address: "182.72.106.34 (Secured Network)",
      certificate_id: certSerial
    };

    updated.activity_log.push({
      id: `act_${Date.now()}`,
      action: `Legally authorized & signed by Client representative: ${signatureName}`,
      user: signatureName,
      timestamp: new Date().toISOString()
    });

    toast({ title: "Contract Executed!", description: `Digital fingerprint logged: ${certSerial}` });

    // 1. Move CRM stage to won
    if (editingProposal.lead_id) {
      await supabase.from('Prospect').update({ stage: 'won' }).eq('id', editingProposal.lead_id);
    }

    // 2. Fetch counts to build formatted unique Refs
    const { count: prjCount } = await supabase.from('Project').select('*', { count: 'exact', head: true });
    const { count: invCount } = await supabase.from('Invoice').select('*', { count: 'exact', head: true });

    const prjRef = `DP-PRJ-2026-${String((prjCount || 0) + 12).padStart(4, '0')}`;
    const invRef = `DP-INV-2026-${String((invCount || 0) + 41).padStart(4, '0')}`;

    // Math values
    const subtotal = updated.line_items.reduce((sum: number, item: LineItem) => sum + (item.unit_price * item.quantity), 0);
    const taxableSubtotal = Math.max(0, subtotal - updated.discount_amount);
    const tax = Math.round(taxableSubtotal * (updated.tax_rate / 100));
    const totalVal = taxableSubtotal + tax;

    // 3. Auto-Create Project
    const prjId = `auto_prj_${Date.now()}`;
    await supabase.from('Project').insert({
      id: prjId,
      company_id: companyId,
      project_name: `${editingProposal.title} - Campaign`,
      project_ref: prjRef,
      client_name: editingProposal.client_name,
      status: 'in_progress',
      progress: 5,
      budget: totalVal,
      deadline: updated.due_date ? new Date(updated.due_date).toISOString() : null
    });

    // 4. Auto-Create Invoice
    const invId = `auto_inv_${Date.now()}`;
    await supabase.from('Invoice').insert({
      id: invId,
      company_id: companyId,
      client_name: editingProposal.client_name,
      client_id: editingProposal.lead_id || null,
      project_id: prjId,
      project_name: `${editingProposal.title} - Campaign`,
      project_ref: prjRef,
      invoice_number: invRef,
      subtotal: taxableSubtotal,
      gst_amount: tax,
      total: totalVal,
      payment_status: 'unpaid',
      issue_date: new Date().toISOString(),
      due_date: updated.due_date ? new Date(updated.due_date).toISOString() : null,
      gst_filed: false,
      line_items: updated.line_items.map((li: LineItem) => ({
        description: li.name,
        unit_price: li.unit_price,
        quantity: li.quantity,
        total: li.total
      }))
    });

    // 5. Activity Log & Notifications
    await supabase.from('ActivityLog').insert({
      company_id: companyId,
      user_id: 'client',
      user_name: signatureName,
      action: 'Contract Won',
      details: `Client finalized contract. Generated project ${prjRef} and invoice ${invRef} automatically.`
    });

    await supabase.from('Notification').insert({
      company_id: companyId,
      user_id: profile?.id || 'system',
      title: 'Deal WON & Activated!',
      message: `Proposal ${editingProposal.proposal_number} has been signed. Campaign workspace initialized.`,
      is_read: false
    });

    saveEditingProposal(updated, 'signed');
  };

  // ----------------------------------------------------
  // Share & Distribution Modifiers
  // ----------------------------------------------------

  const handleShareCopy = (proposal: any) => {
    const shareUrl = `${window.location.origin}/proposals?id=${proposal.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Distribution URL Copied", description: "Secure presentation link is ready." });
    });
  };

  const handleShareWhatsApp = (proposal: any) => {
    const shareUrl = `${window.location.origin}/proposals?id=${proposal.id}`;
    const text = encodeURIComponent(`Hi! Please review our strategic business proposal ${proposal.proposal_number} prepared by Define Perspective via the link below: \n\nLink: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = (proposal: any) => {
    const shareUrl = `${window.location.origin}/proposals?id=${proposal.id}`;
    const subject = encodeURIComponent(`Strategic Campaign Proposal: ${proposal.title}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find the formal campaign proposal and breakdown for your review using our secure client portal:\n\nReview link: ${shareUrl}\n\nKind regards,\nDefine Perspective team`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // ----------------------------------------------------
  // Real-Time Finance & Margin Math
  // ----------------------------------------------------

  const computedFinancials = useMemo(() => {
    if (!editingProposal?.parsedContent) return { subtotal: 0, tax: 0, total: 0, margin: 0, crewCost: 0 };
    const content = editingProposal.parsedContent;
    const subtotal = content.line_items.reduce((sum: number, item: LineItem) => sum + (item.unit_price * item.quantity), 0);
    const taxableSubtotal = Math.max(0, subtotal - content.discount_amount);
    const tax = Math.round(taxableSubtotal * (content.tax_rate / 100));
    const total = taxableSubtotal + tax;

    // Estimate internal cost margins (35% default, AI tools are cheaper 20%, CGI/3D heavier 45%)
    let crewCost = Math.round(subtotal * 0.35);
    if (editingProposal.title.toLowerCase().includes('cgi') || editingProposal.title.toLowerCase().includes('3d')) {
      crewCost = Math.round(subtotal * 0.45);
    } else if (editingProposal.title.toLowerCase().includes('ai')) {
      crewCost = Math.round(subtotal * 0.20);
    }

    const margin = subtotal > 0 ? Math.round(((subtotal - crewCost) / subtotal) * 100) : 0;
    return { subtotal, tax, total, margin, crewCost };
  }, [editingProposal]);

  const activeStaffing = useMemo(() => {
    if (editingProposal?.title.toLowerCase().includes('ai')) {
      return SERVICE_TEMPLATES.ai_commercials.staffing;
    }
    if (editingProposal?.title.toLowerCase().includes('cgi') || editingProposal?.title.toLowerCase().includes('3d')) {
      return SERVICE_TEMPLATES.cgi_3d.staffing;
    }
    return SERVICE_TEMPLATES.video_production.staffing;
  }, [editingProposal]);

  const activeRisks = useMemo(() => {
    if (editingProposal?.title.toLowerCase().includes('ai')) {
      return SERVICE_TEMPLATES.ai_commercials.risks;
    }
    if (editingProposal?.title.toLowerCase().includes('cgi') || editingProposal?.title.toLowerCase().includes('3d')) {
      return SERVICE_TEMPLATES.cgi_3d.risks;
    }
    return SERVICE_TEMPLATES.video_production.risks;
  }, [editingProposal]);

  const winProbability = useMemo(() => {
    if (!editingProposal) return 0;
    let base = 60;
    if (computedFinancials.margin > 60) base += 15;
    if (editingProposal.parsedContent.comments.length > 2) base += 10;
    if (editingProposal.parsedContent.client_signature.signed) return 100;
    return Math.min(base, 98);
  }, [editingProposal, computedFinancials]);

  // Overall dashboard stats
  const statsOverview = useMemo(() => {
    if (!proposals) return { totalVal: 0, pending: 0, signed: 0 };
    let totalVal = 0;
    let pending = 0;
    let signed = 0;

    proposals.forEach(p => {
      const parsed = parseProposalContent(p);
      const subtotal = parsed.line_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const taxableSubtotal = Math.max(0, subtotal - parsed.discount_amount);
      const tax = Math.round(taxableSubtotal * (parsed.tax_rate / 100));
      totalVal += taxableSubtotal + tax;

      if (p.status === 'signed' || parsed.client_signature.signed) {
        signed += 1;
      } else {
        pending += 1;
      }
    });

    return { totalVal, pending, signed };
  }, [proposals]);

  if (isTenantLoading || isProposalsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Loading Vault Intelligence...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // PREMIUM WHITE THEME WORKSPACE (DETAIL/EDITOR VIEW)
  // ----------------------------------------------------
  if (editingProposal) {
    const content = editingProposal.parsedContent;
    const subtotal = content.line_items.reduce((sum: number, item: LineItem) => sum + (item.unit_price * item.quantity), 0);
    const taxableSubtotal = Math.max(0, subtotal - content.discount_amount);

    return (
      <div className="min-h-screen text-foreground flex flex-col p-0 space-y-6 antialiased font-sans transition-all duration-300">
        
        {/* Executive Header Command bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-6 shrink-0 bg-white p-6 rounded-2xl shadow-sm shadow-zinc-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setEditingProposal(null); reloadProposals(); }} 
              className="p-3 rounded-xl border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-sm"
              title="Close to Pipeline"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-foreground tracking-tight">{editingProposal.title}</h1>
                <Badge className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm",
                  editingProposal.status === 'signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  editingProposal.status === 'sent' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-destructive/10 text-destructive border-red-200'
                )}>
                  {editingProposal.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs mt-1">
                Ref: {editingProposal.proposal_number} • Version: {content.current_version_name} • Client: {editingProposal.client_name}
              </p>
            </div>
          </div>

          {/* Mode Pill Toggle (Apple Style) */}
          <div className="flex items-center gap-3">
            <div className="bg-muted p-1.5 rounded-2xl flex gap-1 shadow-inner border border-border/50">
              <Button 
                onClick={() => setActiveBuilderTab('editor')} 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl text-xs font-bold uppercase h-9 px-4 transition-all duration-200", 
                  activeBuilderTab === 'editor' ? 'bg-white text-foreground shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Edit3 className="h-3.5 w-3.5 mr-2 text-destructive" /> Proposal Builder
              </Button>
              <Button 
                onClick={() => setActiveBuilderTab('pricing')} 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl text-xs font-bold uppercase h-9 px-4 transition-all duration-200", 
                  activeBuilderTab === 'pricing' ? 'bg-white text-foreground shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <DollarSign className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Pricing & Taxes
              </Button>
              <Button 
                onClick={() => setActiveBuilderTab('client_portal')} 
                variant="ghost" 
                size="sm" 
                className={cn("rounded-xl text-xs font-bold uppercase h-9 px-4 transition-all duration-200", 
                  activeBuilderTab === 'client_portal' ? 'bg-white text-foreground shadow-sm border border-border/40' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="h-3.5 w-3.5 mr-2 text-accent" /> Client View
              </Button>
            </div>

            <Button 
              onClick={() => saveEditingProposal(content)} 
              className="bg-primary border border-primary text-white hover:bg-primary rounded-xl h-10 px-5 font-black text-xs uppercase shadow-md shadow-zinc-200"
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Triple Panel Apple-Style Layout */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0 relative items-stretch">
          
          {/* ==========================================
              LEFT PANEL: PIPELINE STATUS, APPROVALS, VERSION
              ========================================== */}
          <div className="xl:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Stage Pipeline */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-850">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" /> Status
                </h3>
                <div className="space-y-4 pt-2 relative border-l border-border pl-4 ml-2">
                  {[
                    { id: 'draft', label: 'Created', desc: 'AI proposal generated', active: true },
                    { id: 'internal', label: 'Pending Approval', desc: 'Internal review pending', active: content.approvals.sales_executive.approved },
                    { id: 'sent', label: 'Sent to Client', desc: 'Client portal is active', active: editingProposal.status !== 'draft' },
                    { id: 'signed', label: 'Signed & Approved', desc: 'Project conversion ready', active: content.client_signature.signed }
                  ].map((stage) => (
                    <div key={stage.id} className="relative group">
                      <div className={cn("absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white transition-all duration-300",
                        stage.active ? "bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "bg-secondary"
                      )} />
                      <span className="text-xs font-bold block tracking-tight text-foreground">{stage.label}</span>
                      <span className="text-xs text-muted-foreground block">{stage.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Internal Multi-stage Approvals Chain */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-850">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Approvals
                </h3>
                
                <div className="space-y-3 pt-1">
                  {[
                    { key: 'sales_executive', label: 'Sales Manager Approval', role: 'sales_executive' },
                    { key: 'sales_manager', label: 'Finance Approval', role: 'sales_manager' },
                    { key: 'accounts_approval', label: 'Accounts Review', role: 'accounts_approval' },
                    { key: 'director_approval', label: 'Director Final Sign-off', role: 'director_approval' }
                  ].map((app) => {
                    const status = content.approvals[app.key as keyof ProposalApprovals];
                    return (
                      <div key={app.key} className="flex flex-col gap-2 p-3 bg-muted rounded-xl border border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-foreground block">{app.label}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {status.approved ? `Approved by ${status.signed_by}` : 'Pending review'}
                            </span>
                          </div>
                          {status.approved ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold shadow-sm">
                              APPROVED
                            </Badge>
                          ) : (
                            <div className="flex gap-1.5">
                              <Button 
                                onClick={() => signInternalApproval(app.key as keyof ProposalApprovals, true)}
                                size="sm" 
                                className="bg-primary hover:bg-primary text-white rounded-lg h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider"
                              >
                                Sign
                              </Button>
                              <Button 
                                onClick={() => {
                                  const reason = prompt("Enter revision requests:");
                                  if (reason) signInternalApproval(app.key as keyof ProposalApprovals, false, reason);
                                }}
                                size="sm" 
                                variant="outline"
                                className="border-border text-destructive hover:bg-destructive/10 rounded-lg h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider"
                              >
                                Revise
                              </Button>
                            </div>
                          )}
                        </div>
                        {status.comments && (
                          <div className="text-xs text-destructive bg-destructive/10/50 border border-red-100 rounded-lg p-2 font-medium">
                            {status.comments}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Version History Log */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-850">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" /> Versions
                  </h3>
                  <Button 
                    onClick={() => setIsVersionDialogOpen(true)}
                    size="sm" 
                    variant="outline" 
                    className="border-border text-[10px] font-bold uppercase rounded-lg h-7 px-2.5 text-muted-foreground/80"
                  >
                    New Version
                  </Button>
                </div>
                
                <div className="space-y-2.5">
                  {content.version_history.map((ver: VersionRecord, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-xl border border-border/50 flex flex-col gap-1 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">{ver.version} - Iteration</span>
                        <Badge className="bg-secondary text-foreground/80 text-[10px] border-none font-bold">
                          {ver.created_by}
                        </Badge>
                      </div>
                      <span className="text-xs text-zinc-650 font-bold">₹{ver.total.toLocaleString()}</span>
                      <p className="text-xs text-muted-foreground italic font-medium">{ver.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ==========================================
              CENTER WORKSPACE: EDITOR OR SERVICE ENGINE
              ========================================== */}
          <div className="xl:col-span-6 bg-white border border-border rounded-2xl p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col min-h-[500px] shadow-sm">
            
            {activeBuilderTab === 'editor' && (
              <div className="space-y-6 flex-1">
                {content.isPreview && (
                  <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between shadow-sm">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                      Preview Mode: Custom AI strategy disabled. Configure GEMINI_API_KEY to unlock.
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-destructive" /> Proposal Builder
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apple Whitespace layout</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposal Title</Label>
                    <Input 
                      value={content.proposal_title}
                      onChange={(e) => {
                        const copy = { ...content, proposal_title: e.target.value };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Name</Label>
                    <Input 
                      value={content.client}
                      onChange={(e) => {
                        const copy = { ...content, client: e.target.value };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client GST IN</Label>
                    <Input 
                      value={content.client_gstin || ""}
                      placeholder="e.g. 32AABCC8345C1Z2"
                      onChange={(e) => {
                        const copy = { ...content, client_gstin: e.target.value };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billing Address</Label>
                    <Input 
                      value={content.client_address || ""}
                      placeholder="Corporate headquarters location..."
                      onChange={(e) => {
                        const copy = { ...content, client_address: e.target.value };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                </div>

                {/* Section Navigation */}
                <div className="space-y-6 border-t border-border pt-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {content.sections.map((sec: { title: string; content: string }, idx: number) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveSectionIdx(idx)}
                        className={cn("px-4 py-2 text-xs font-bold uppercase rounded-xl border tracking-wider transition shrink-0 shadow-sm h-9",
                          activeSectionIdx === idx ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted-foreground/80 hover:text-foreground hover:bg-muted'
                        )}
                      >
                        {idx + 1}. {sec.title.slice(0, 15)}...
                      </button>
                    ))}
                  </div>

                  {content.sections[activeSectionIdx] && (
                    <div className="space-y-4 bg-muted p-6 rounded-2xl border border-border/80 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section {activeSectionIdx + 1} Content</span>
                        <Input 
                          value={content.sections[activeSectionIdx].title}
                          onChange={(e) => {
                            const secs = [...content.sections];
                            secs[activeSectionIdx].title = e.target.value;
                            setEditingProposal({ ...editingProposal, parsedContent: { ...content, sections: secs } });
                          }}
                          className="bg-white border-border rounded-lg text-sm font-bold text-foreground max-w-[200px] h-8 focus-visible:ring-border"
                        />
                      </div>

                      <Textarea 
                        value={content.sections[activeSectionIdx].content}
                        onChange={(e) => {
                          const secs = [...content.sections];
                          secs[activeSectionIdx].content = e.target.value;
                          setEditingProposal({ ...editingProposal, parsedContent: { ...content, sections: secs } });
                        }}
                        className="bg-white border-border rounded-xl min-h-[250px] text-foreground/80 font-medium leading-relaxed text-sm p-4 custom-scrollbar focus-visible:ring-border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeBuilderTab === 'pricing' && (
              <div className="space-y-6 flex-1">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-500" /> Pricing & Taxes
                  </h2>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">GST ACTIVE</span>
                </div>

                {/* Preset Loaders */}
                <div className="p-4 bg-muted border border-border/80 rounded-2xl space-y-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Load Preset</span>
                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      onClick={() => applyServiceTemplate('video_production')} 
                      className="bg-white hover:bg-muted border border-border text-xs font-bold uppercase text-foreground/80 rounded-xl py-3.5 h-auto flex flex-col gap-1.5 shadow-sm"
                    >
                      <Zap className="h-4 w-4 text-accent" /> Brand Commercial
                    </Button>
                    <Button 
                      onClick={() => applyServiceTemplate('ai_commercials')} 
                      className="bg-white hover:bg-muted border border-border text-xs font-bold uppercase text-foreground/80 rounded-xl py-3.5 h-auto flex flex-col gap-1.5 shadow-sm"
                    >
                      <BrainCircuit className="h-4 w-4 text-accent" /> Neural AI Spot
                    </Button>
                    <Button 
                      onClick={() => applyServiceTemplate('cgi_3d')} 
                      className="bg-white hover:bg-muted border border-border text-xs font-bold uppercase text-foreground/80 rounded-xl py-3.5 h-auto flex flex-col gap-1.5 shadow-sm"
                    >
                      <Layers className="h-4 w-4 text-accent" /> CGI & Unreal 3D
                    </Button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-650 tracking-wider">Scope & Pricing</span>
                    <Button onClick={addLineItem} size="sm" className="bg-primary hover:bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider h-9 px-4 shadow-sm">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {content.line_items.map((item: LineItem) => (
                      <div key={item.id} className="p-4 bg-muted rounded-xl border border-border/80 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <Input 
                            value={item.name} 
                            onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                            className="bg-transparent border-none p-0 text-sm font-bold text-foreground focus-visible:ring-0 flex-1 h-auto"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeLineItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">Category</span>
                            <Input 
                              value={item.category} 
                              onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                              className="bg-white border-border rounded-lg text-xs text-foreground font-bold h-8 focus-visible:ring-border"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">Quantity / Days</span>
                            <Input 
                              type="number"
                              value={item.quantity} 
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="bg-white border-border rounded-lg text-xs text-foreground font-bold h-8 focus-visible:ring-border"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">Unit Price (₹)</span>
                            <Input 
                              type="number"
                              value={item.unit_price} 
                              onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="bg-white border-border rounded-lg text-xs text-foreground font-bold h-8 focus-visible:ring-border"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax Jurisdiction & Payment Schedule config */}
                <div className="grid grid-cols-2 gap-4 border-t border-border/80 pt-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax Type</Label>
                    <Select 
                      value={content.tax_type} 
                      onValueChange={(val: any) => {
                        const copy = { ...content, tax_type: val };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                    >
                      <SelectTrigger className="rounded-xl border-border bg-muted text-xs font-bold text-zinc-850 h-11 focus-visible:ring-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-foreground rounded-xl shadow-lg border-border">
                        <SelectItem value="Intra-state" className="focus:bg-muted rounded-lg py-2">Intra-state (9% CGST + 9% SGST)</SelectItem>
                        <SelectItem value="Inter-state" className="focus:bg-muted rounded-lg py-2">Inter-state (18% IGST)</SelectItem>
                        <SelectItem value="Export" className="focus:bg-muted rounded-lg py-2">Export / SEZ (0%)</SelectItem>
                        <SelectItem value="Exempt" className="focus:bg-muted rounded-lg py-2">GST Exempt (0%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount Amount (₹)</Label>
                    <Input 
                      type="number"
                      value={content.discount_amount}
                      onChange={(e) => {
                        const copy = { ...content, discount_amount: parseFloat(e.target.value) || 0 };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Terms</Label>
                    <Input 
                      value={content.payment_terms}
                      placeholder="e.g. 50% Advance, 50% Handover"
                      onChange={(e) => {
                        const copy = { ...content, payment_terms: e.target.value };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</Label>
                    <Input 
                      type="date"
                      value={content.due_date}
                      onChange={(e) => {
                        const copy = { ...content, due_date: e.target.value };
                        setEditingProposal({ ...editingProposal, parsedContent: copy });
                      }}
                      className="border-border bg-muted rounded-xl text-foreground font-bold h-11 focus-visible:ring-border"
                    />
                  </div>
                </div>

                {/* Milestone Weightage */}
                <div className="space-y-3 border-t border-border/80 pt-6">
                  <span className="text-xs font-bold uppercase text-zinc-650 tracking-wider block">Payment Milestones</span>
                  <div className="grid grid-cols-3 gap-3">
                    {content.milestones.map((m: Milestone) => (
                      <div key={m.id} className="p-4 bg-muted border border-border rounded-xl space-y-1.5 shadow-sm">
                        <span className="text-xs font-bold text-zinc-850 block">{m.title}</span>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Weight: {m.percentage}%</span>
                          <span className="text-foreground font-black">₹{m.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{m.trigger_condition}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms conditions editor */}
                <div className="space-y-2 border-t border-border/80 pt-6">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms & Conditions</Label>
                  <Textarea 
                    value={content.terms_conditions}
                    onChange={(e) => setEditingProposal({ ...editingProposal, parsedContent: { ...content, terms_conditions: e.target.value } })}
                    className="border-border bg-muted rounded-xl text-foreground/80 text-sm min-h-[80px] p-3"
                  />
                </div>
              </div>
            )}

            {activeBuilderTab === 'client_portal' && (
              <div className="space-y-6 flex-1">
                
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <Globe className="h-6 w-6 text-accent" />
                    <div>
                      <span className="text-xs font-black text-foreground block">Client View</span>
                      <span className="text-xs text-muted-foreground block">Secure client view page</span>
                    </div>
                  </div>
                  <Badge className="bg-accent text-white text-xs font-bold uppercase shadow">INVESTOR READY</Badge>
                </div>

                {/* Live Portal Cover Slide (Apple Keynote Layout) */}
                <div className="bg-white p-8 rounded-2xl border border-border space-y-6 relative overflow-hidden shadow-sm">
                  <div className="absolute right-0 top-0 h-40 w-40 bg-destructive/5 rounded-full blur-[60px]" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-1 bg-destructive rounded-full" />
                      <span className="text-xs font-bold uppercase text-destructive tracking-wider block">Define Perspective</span>
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight leading-none pt-2">{content.proposal_title}</h2>
                    <p className="text-muted-foreground text-xs font-medium">Prepared exclusively for {content.client}</p>
                  </div>

                  {/* Summary of Deliverables */}
                  <div className="border-t border-zinc-150 pt-6 space-y-4">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">Scope & Pricing Summary</span>
                    <div className="space-y-2.5">
                      {content.line_items.map((item: LineItem, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-bold py-1.5 border-b border-border">
                          <span className="text-foreground/80">{item.name} <strong className="text-muted-foreground font-bold">x{item.quantity}</strong></span>
                          <span className="text-foreground font-black">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GST Invoice Details */}
                  <div className="p-4 bg-muted rounded-xl space-y-2 border border-zinc-150 text-xs font-bold text-muted-foreground/80">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="text-foreground">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {content.discount_amount > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Discount Applied:</span>
                        <span>- ₹{content.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {content.tax_type === "Intra-state" && (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>CGST (9%):</span>
                          <span>₹{(taxableSubtotal * 0.09).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>SGST (9%):</span>
                          <span>₹{(taxableSubtotal * 0.09).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    {content.tax_type === "Inter-state" && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>IGST (18%):</span>
                        <span>₹{(taxableSubtotal * 0.18).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-foreground border-t border-border pt-2 mt-1">
                      <span>Total Value (Inc. Tax):</span>
                      <span className="text-destructive text-lg">₹{computedFinancials.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Terms and conditions signature lock */}
                  <div className="text-xs text-zinc-650 bg-muted border border-zinc-250 p-4 rounded-xl leading-relaxed">
                    <strong className="text-foreground/80 block mb-1">Terms of Agreement:</strong>
                    {content.terms_conditions}
                  </div>
                </div>

                {/* Digital Signature Pad Simulator */}
                {content.client_signature.signed ? (
                  <Card className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-sm text-zinc-850 overflow-hidden relative">
                    <div className="absolute right-3 top-3 h-20 w-20 bg-emerald-100/30 rounded-full blur-[30px]" />
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-foreground block">Verified Signature</h4>
                          <span className="text-xs text-muted-foreground block">Legal authorization certificate issued.</span>
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-border space-y-2 text-xs text-zinc-650 font-bold">
                        <div className="flex justify-between"><span className="text-muted-foreground">Signatory:</span><span className="text-emerald-700 font-black">{content.client_signature.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Timestamp:</span><span className="text-foreground">{new Date(content.client_signature.signed_at || '').toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Audit Node IP:</span><span className="text-foreground">{content.client_signature.ip_address}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Certificate ID:</span><span className="text-foreground">{content.client_signature.certificate_id}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-muted border border-border rounded-2xl shadow-sm text-foreground">
                    <CardContent className="p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" /> Sign Proposal
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Type your name below to sign the proposal and approve the agreement.
                      </p>
                      
                      <div className="space-y-3">
                        <Input 
                          placeholder="Type full legal name to authorize..."
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          className="bg-white border-border rounded-xl h-11 text-xs font-bold text-foreground focus-visible:ring-border"
                        />
                        <Button 
                          onClick={handleClientDigitalSignature}
                          className="w-full bg-primary hover:bg-zinc-855 text-white rounded-xl h-12 font-black uppercase text-xs tracking-widest shadow-md shadow-zinc-300"
                        >
                          Approve & Sign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* ==========================================
              RIGHT PANEL: AI DEAL ANALYTICS
              ========================================== */}
          <div className="xl:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Real-time Profitability margin */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-850 relative overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" /> AI Analysis
                </h3>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Win Probability</span>
                    <span className="text-xl font-black text-foreground">{winProbability}%</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Profit Margin</span>
                    <span className={cn("text-xl font-black", 
                      computedFinancials.margin >= 50 ? 'text-emerald-600' : 'text-accent'
                    )}>{computedFinancials.margin}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500",
                        computedFinancials.margin >= 50 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-accent shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                      )}
                      style={{ width: `${computedFinancials.margin}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground block pt-1">Minimum target profit is 50%</span>
                </div>
              </CardContent>
            </Card>

            {/* Crew Estimator */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-855">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Estimated Crew
                </h3>

                <div className="space-y-2 pt-1">
                  {activeStaffing.map((staff, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-border">
                      <span className="font-bold text-foreground/80">{staff.role} <strong className="text-muted-foreground">x{staff.count}</strong></span>
                      <span className="font-black text-foreground">₹{staff.day_rate.toLocaleString()}/day</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Risk auditing */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-850">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Risks & Suggestions
                </h3>

                <div className="space-y-3 pt-1">
                  {activeRisks.map((risk, idx) => (
                    <div key={idx} className="p-3 bg-muted border border-zinc-150 rounded-xl flex gap-2 items-start shadow-sm">
                      <Lightbulb className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed">{risk}</p>
                    </div>
                  ))}
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2 items-start shadow-sm">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800 font-semibold leading-relaxed">Upsell Suggestion: Add Cinema Atmos Mastering (+ ₹35,000).</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Feed */}
            <Card className="bg-white border border-border rounded-2xl shadow-sm text-zinc-850 flex-1 flex flex-col min-h-[250px]">
              <CardContent className="p-6 flex flex-col flex-1 h-full min-h-0">
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 shrink-0 mb-4">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" /> Comments
                </h3>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 custom-scrollbar mb-4">
                  {content.comments.map((comm: ProposalComment) => (
                    <div key={comm.id} className={cn("p-3 rounded-xl border text-xs leading-relaxed shadow-sm",
                      comm.is_client ? 'bg-accent/10 border-accent/20' : 'bg-muted border-zinc-150'
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("font-black", comm.is_client ? 'text-accent' : 'text-foreground')}>{comm.user}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-foreground/80 font-bold">{comm.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Input 
                    placeholder="Type comments..." 
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addComment(activeBuilderTab === 'client_portal');
                    }}
                    className="bg-muted border-border rounded-xl text-xs h-9 text-foreground focus-visible:ring-border"
                  />
                  <Button 
                    onClick={() => addComment(activeBuilderTab === 'client_portal')}
                    className="bg-primary hover:bg-primary text-white rounded-xl h-9 w-9 shrink-0 p-0 shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog for creating a new version */}
        <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
          <DialogContent className="bg-white text-foreground border border-border rounded-2xl shadow-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-foreground">Initiate New Version</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Saves the current pricing and sections as a historical snapshot before creating a new working iteration.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Describe version improvements</Label>
                <Input 
                  placeholder="e.g. Adjusted VFX margins and sound designs..." 
                  value={versionDescription}
                  onChange={(e) => setVersionDescription(e.target.value)}
                  className="bg-muted border-zinc-255 rounded-xl h-11 text-foreground focus-visible:ring-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsVersionDialogOpen(false)} variant="outline" className="border-border rounded-xl">Cancel</Button>
              <Button onClick={createNewVersion} className="bg-primary hover:bg-primary text-white rounded-xl shadow-md">Create Iteration</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ----------------------------------------------------
  // PRIMARY PIPELINE COCKPIT (DARK CINEMATIC DASHBOARD)
  // ----------------------------------------------------
  const filteredProposals = proposals?.filter(p => {
    return p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.proposal_number?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="space-y-8 text-foreground min-h-screen p-0 antialiased font-sans transition-all duration-300">
      
      {/* Cinematic Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border relative">
        <div className="absolute -top-4 -left-4 w-72 h-32 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-none">Proposals</h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-2">Create and manage your client proposals easily.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search proposals..." 
              className="pl-9 h-10 rounded-xl bg-white border-border text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl bg-destructive hover:bg-destructive text-white shadow-lg h-10 px-6 font-black text-xs uppercase tracking-wider shadow-red-600/20">
                <Plus className="h-4 w-4" /> Create with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] rounded-[10px] p-0 overflow-hidden border border-border shadow-2xl h-[90vh] flex flex-col bg-white">
              <div className="text-foreground flex flex-col flex-1 min-h-0 bg-white">
                <div className="p-8 border-b border-zinc-150 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-destructive rounded-[10px] flex items-center justify-center shadow-lg">
                      <BrainCircuit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black text-foreground">AI Proposal Builder</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-0.5">Generate custom client proposals instantly using AI.</DialogDescription>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar min-h-0">
                  {generationStep === 'input' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col">
                      <div className="space-y-3 p-5 bg-destructive/10 rounded-[10px] border border-red-100 shrink-0">
                        <Label className="text-[10px] font-black uppercase text-destructive tracking-widest flex items-center gap-2 mb-1">
                          <Database className="h-3 w-3" /> Select Client or Lead
                        </Label>
                        
                        {/* Grouped and searchable unified dropdown */}
                        <div className="relative">
                          <div className="flex items-center border border-border bg-muted rounded-xl px-3 py-2">
                            <Search className="h-4 w-4 text-muted-foreground mr-2" />
                            <input 
                              type="text"
                              placeholder="Search clients, leads, opportunities..."
                              value={clientSearchQuery}
                              onChange={(e) => setClientSearchQuery(e.target.value)}
                              className="bg-transparent border-none text-xs text-foreground focus:outline-none focus:ring-0 flex-1 placeholder:text-muted-foreground"
                            />
                          </div>

                          <div className="mt-2 bg-white border border-border rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar p-1 space-y-2">
                            {/* Group: Clients */}
                            {groupedClients.clients.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length > 0 && (
                              <div>
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 block">Clients</span>
                                {groupedClients.clients.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).map(c => (
                                  <div 
                                    key={c.id}
                                    onClick={() => {
                                      setAIInputs(prev => ({ 
                                        ...prev, 
                                        leadId: c.id, 
                                        service_vertical: c.service_vertical || "", 
                                        client_type: c.industry || "", 
                                        location: c.billing_address || ""
                                      }));
                                      setClientSearchQuery(c.company_name);
                                      toast({ title: "Client Loaded", description: `Loaded client details for ${c.company_name}` });
                                    }}
                                    className={cn("text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted flex justify-between items-center", aiInputs.leadId === c.id ? "bg-muted" : "")}
                                  >
                                    <span className="font-bold text-foreground">{c.company_name}</span>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 text-[7px] border-none">CLIENT</Badge>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Group: Opportunities */}
                            {groupedClients.opportunities.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length > 0 && (
                              <div>
                                <span className="text-[8px] font-black text-accent uppercase tracking-widest px-2 py-1 block">Active Opportunities</span>
                                {groupedClients.opportunities.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).map(c => (
                                  <div 
                                    key={c.id}
                                    onClick={() => {
                                      setAIInputs(prev => ({ 
                                        ...prev, 
                                        leadId: c.id, 
                                        service_vertical: c.service_vertical || "", 
                                        client_type: c.industry || "", 
                                        location: c.billing_address || ""
                                      }));
                                      setClientSearchQuery(c.company_name);
                                      toast({ title: "Opportunity Loaded", description: `Loaded opportunity details for ${c.company_name}` });
                                    }}
                                    className={cn("text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted flex justify-between items-center", aiInputs.leadId === c.id ? "bg-muted" : "")}
                                  >
                                    <span className="font-bold text-foreground">{c.company_name}</span>
                                    <Badge className="bg-accent/10 text-accent text-[7px] border-none">{c.stage?.toUpperCase()}</Badge>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Group: Leads */}
                            {groupedClients.leads.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length > 0 && (
                              <div>
                                <span className="text-[8px] font-black text-accent uppercase tracking-widest px-2 py-1 block">Leads</span>
                                {groupedClients.leads.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).map(c => (
                                  <div 
                                    key={c.id}
                                    onClick={() => {
                                      setAIInputs(prev => ({ 
                                        ...prev, 
                                        leadId: c.id, 
                                        service_vertical: c.service_vertical || "", 
                                        client_type: c.industry || "", 
                                        location: c.billing_address || ""
                                      }));
                                      setClientSearchQuery(c.company_name);
                                      toast({ title: "Lead Loaded", description: `Loaded lead details for ${c.company_name}` });
                                    }}
                                    className={cn("text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted flex justify-between items-center", aiInputs.leadId === c.id ? "bg-muted" : "")}
                                  >
                                    <span className="font-bold text-foreground">{c.company_name}</span>
                                    <Badge className="bg-accent/10 text-accent text-[7px] border-none">LEAD</Badge>
                                  </div>
                                ))}
                              </div>
                            )}

                             {/* Group: Prospects */}
                            {groupedClients.prospects.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 block">Prospects</span>
                                {groupedClients.prospects.filter(c => c.company_name.toLowerCase().includes(clientSearchQuery.toLowerCase())).map(c => (
                                  <div 
                                    key={c.id}
                                    onClick={() => {
                                      setAIInputs(prev => ({ 
                                        ...prev, 
                                        leadId: c.id, 
                                        service_vertical: c.service_vertical || "", 
                                        client_type: c.industry || "", 
                                        location: c.billing_address || ""
                                      }));
                                      setClientSearchQuery(c.company_name);
                                      toast({ title: "Prospect Loaded", description: `Loaded prospect details for ${c.company_name}` });
                                    }}
                                    className={cn("text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted flex justify-between items-center", aiInputs.leadId === c.id ? "bg-muted" : "")}
                                  >
                                    <span className="font-bold text-foreground">{c.company_name}</span>
                                    <Badge className="bg-muted text-muted-foreground text-[9px] border-none">PROSPECT</Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document Type</Label>
                          <Select 
                            value={aiInputs.proposal_type} 
                            onValueChange={(val: any) => setAIInputs({...aiInputs, proposal_type: val})}
                          >
                            <SelectTrigger className="bg-muted border-border rounded-xl h-11 text-foreground">
                              <SelectValue placeholder="Proposal vs Quote" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-border text-foreground rounded-xl">
                              <SelectItem value="proposal" className="focus:bg-muted rounded-lg cursor-pointer">Proposal (Detailed)</SelectItem>
                              <SelectItem value="quote" className="focus:bg-muted rounded-lg cursor-pointer">Quick Quote</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Type</Label>
                          <Input placeholder="e.g. Brand Commercial Production" value={aiInputs.service_vertical} onChange={(e) => setAIInputs({...aiInputs, service_vertical: e.target.value})} className="bg-muted border-border rounded-xl h-11 text-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industry</Label>
                          <Input placeholder="e.g. Luxury Real Estate" value={aiInputs.client_type} onChange={(e) => setAIInputs({...aiInputs, client_type: e.target.value})} className="bg-muted border-border rounded-xl h-11 text-foreground" />
                        </div>
                      </div>

                      <div className="space-y-2 shrink-0">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proposal Scope & Description</Label>
                        <Textarea placeholder="Outline the client goals, targeted parameters, and delivery constraints..." value={aiInputs.project_description} onChange={(e) => setAIInputs({...aiInputs, project_description: e.target.value})} className="bg-muted border-border rounded-xl min-h-[100px] text-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full min-h-[400px] gap-4 animate-in zoom-in-95">
                      {generatedDraft?.isPreview && (
                        <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-between shadow-sm">
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                            Running in Preview Mode: Using high-fidelity local templates. Set GEMINI_API_KEY in .env to unlock real-time custom AI generation.
                          </span>
                        </div>
                      )}
                      <div className="flex flex-1 gap-8 min-h-0">
                        <aside className="w-64 space-y-4 shrink-0 overflow-y-auto pr-4 custom-scrollbar">
                          <h3 className="text-xs font-bold uppercase text-destructive tracking-wider mb-4">Proposal Sections</h3>
                          {generatedDraft?.sections.map((sec, idx) => (
                            <button key={idx} onClick={() => setActiveSectionIdx(idx)} className={cn("w-full text-left px-4 py-3 rounded-xl text-xs font-bold border border-transparent transition-all", activeSectionIdx === idx ? "bg-destructive text-white shadow-lg" : "text-muted-foreground hover:bg-muted")}>
                              {idx + 1}. {sec.title}
                            </button>
                          ))}
                        </aside>
                        <main className="flex-1 bg-muted/50 rounded-[10px] border border-border p-8 overflow-y-auto custom-scrollbar">
                          <h2 className="text-2xl font-black text-foreground mb-6">{generatedDraft?.sections[activeSectionIdx]?.title}</h2>
                          <div className="text-sm leading-relaxed text-muted-foreground/80 whitespace-pre-line font-medium leading-7">{generatedDraft?.sections[activeSectionIdx]?.content}</div>
                        </main>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-zinc-150 shrink-0">
                  {generationStep === 'input' ? (
                    <Button onClick={handleGenerateAI} disabled={isGenerating} className="w-full bg-destructive hover:bg-destructive h-14 rounded-[10px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-red-600/10">
                      {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                      Generate AI Proposal
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      <Button onClick={() => setGenerationStep('input')} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted rounded-[10px] h-14 font-black uppercase text-xs font-bold">Back</Button>
                      <Button onClick={handleCreateProposal} disabled={isSubmitting} className="flex-[2] bg-destructive hover:bg-destructive h-14 rounded-[10px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck className="h-5 w-5" />}
                        Save Proposal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Overview Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <Card className="border-none shadow-sm bg-white border border-border rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Total Proposals</span>
              <Target className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-2xl font-black text-foreground">{proposals?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Total bids created</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border border-border rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Total Value</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-foreground">
              ₹{statsOverview.totalVal.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Total estimated value</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border border-border rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Pending Approvals</span>
              <Clock className="h-4 w-4 text-accent" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {statsOverview.pending}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Awaiting final approvals</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border border-border rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-wider">
              <span>Approved Proposals</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {statsOverview.signed}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Approved and signed contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Proposals Vault Listing */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <Card className="border-2 border-dashed border-border p-24 text-center rounded-[10px] bg-white shadow-sm">
            <BrainCircuit className="h-16 w-16 mx-auto mb-6 opacity-10 text-foreground" />
            <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">No proposals found.</p>
            <Button variant="link" className="mt-4 font-bold text-destructive hover:text-destructive animate-pulse" onClick={() => setIsAddOpen(true)}>Create with AI</Button>
          </Card>
        ) : (
          filteredProposals.map((prop) => {
            const parsed = parseProposalContent(prop);
            const subtotal = parsed.line_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
            const taxableSubtotal = Math.max(0, subtotal - parsed.discount_amount);
            const tax = Math.round(taxableSubtotal * (parsed.tax_rate / 100));
            const total = taxableSubtotal + tax;

            return (
              <Card key={prop.id} className="hover:shadow-lg hover:bg-white transition-all duration-300 border border-border bg-white group rounded-2xl overflow-hidden">
                <CardContent className="p-0 flex flex-col md:flex-row md:items-center">
                  <div className="p-8 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-red-100 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-white transition-all duration-500">
                        <FileText className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl group-hover:text-destructive transition-colors text-foreground">{prop.title}</h3>
                          <Badge className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm",
                            prop.status === 'signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            prop.status === 'sent' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-destructive/10 text-destructive border-red-200'
                          )}>
                            {prop.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-bold mt-1.5 flex items-center gap-2">
                          <span>{prop.proposal_number}</span> • 
                          <span>Client: {prop.client_name}</span> • 
                          <span>Total: ₹{total.toLocaleString()}</span>
                          {prop.lead_id && <Badge className="bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold uppercase px-2 shadow-sm">Linked to CRM</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 md:w-80 bg-muted border-l border-zinc-150 flex flex-col gap-3">
                    <Button className="w-full bg-primary border border-primary text-white hover:bg-primary rounded-xl h-11 font-bold gap-2" onClick={() => handleEditProposal(prop)}>
                      <ExternalLink className="h-4 w-4 text-destructive" /> Open Proposal
                    </Button>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex-1 rounded-xl border-border hover:bg-muted text-foreground/80 bg-white h-11 gap-2">
                            <Share2 className="h-4 w-4" /> Share
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-64 p-2 bg-white border border-border text-foreground/80 shadow-xl">
                          <DropdownMenuLabel className="text-xs uppercase font-bold text-muted-foreground tracking-wider px-3 py-2">Share Channels</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleShareWhatsApp(prop)} className="gap-2 py-3 cursor-pointer rounded-lg hover:bg-muted">
                            <MessageSquare className="h-4 w-4 text-emerald-500" /> Share via WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareEmail(prop)} className="gap-2 py-3 cursor-pointer rounded-lg hover:bg-muted">
                            <Mail className="h-4 w-4 text-destructive" /> Share via Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-muted" />
                          <DropdownMenuItem onClick={() => handleShareCopy(prop)} className="gap-2 py-3 cursor-pointer rounded-lg hover:bg-muted">
                            <Copy className="h-4 w-4 text-muted-foreground" /> Copy Access Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border text-destructive hover:bg-destructive/10 bg-white" onClick={() => setProposalToDelete(prop)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!proposalToDelete} onOpenChange={(open) => !open && setProposalToDelete(null)}>
        <AlertDialogContent className="rounded-[10px] bg-white border border-border text-foreground shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Proposal Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">Permanently remove "{proposalToDelete?.title}"? This will delete all history snapshots and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border bg-transparent text-muted-foreground/80 hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive rounded-xl text-white">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-destructive" /></div>}>
      <ProposalsContent />
    </Suspense>
  );
}
