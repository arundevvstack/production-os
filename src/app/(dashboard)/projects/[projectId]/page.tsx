"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Video, 
  FileText, 
  LayoutGrid,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  Camera,
  Scissors,
  Target,
  UserPlus,
  Rocket,
  Sparkles,
  Trash2,
  Package,
  Box,
  Monitor,
  Check,
  Receipt,
  ExternalLink,
  Download,
  PieChart as PieChartIcon,
  ArrowUpRight,
  TrendingDown,
  Info,
  ListTree,
  Filter,
  Play,
  MessageSquare,
  UploadCloud,
  FileVideo,
  FileImage,
  FileAudio,
  FolderOpen,
  ShieldAlert,
  LinkIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineEngine } from "@/components/gantt/TimelineEngine";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseDoc } from "@/supabase/hooks/use-doc";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Review annotation interface
interface ReviewAnnotation {
  timestamp: string;
  comment: string;
  author: string;
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { companyId, isLoading: isTenantLoading, roleId, profile, isSuperAdmin } = useTenant();
  const [activeTab, setActiveTab] = useState("");
  
  // Dialog States
  const [isAddObjectiveOpen, setIsAddObjectiveOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [timeLogObjective, setTimeLogObjective] = useState<any>(null);
  const [newTimeEntry, setNewTimeEntry] = useState({ hours: "", notes: "", is_billable: true });
  
  // Asset Edit Link State
  const [isEditAssetLinkOpen, setIsEditAssetLinkOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [newAssetLink, setNewAssetLink] = useState("");
  
  // Form States
  const [newObjective, setNewObjective] = useState({ title: "", assignedTo: "" });
  const [newAsset, setNewAsset] = useState({ name: "", url: "", file_type: "Video", folder: "pre-prod" });
  const [newExpense, setNewExpense] = useState({
    category: "Talent & Crew",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    status: "Paid"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video Player Annotation State
  const [selectedAssetForReview, setSelectedAssetForReview] = useState<any>(null);
  const [newAnnotation, setNewAnnotation] = useState({
    minutes: "00",
    seconds: "00",
    text: ""
  });
  const [mockAnnotations, setMockAnnotations] = useState<ReviewAnnotation[]>([
    { timestamp: "00:15", comment: "Ensure color balance on host face looks natural.", author: "Creative Director" },
    { timestamp: "01:04", comment: "Sound level dips slightly, raise gain by +2dB.", author: "Audio Engineer" }
  ]);

  // Asset Folder Navigation Filter
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");

  // --- DATA FETCHING FROM SUPABASE ---
  const { data: project, isLoading: isProjectLoading } = useSupabaseDoc('Project', projectId);

  const { data: projectStages, isLoading: isStagesLoading } = useSupabaseCollection('ProjectStage', {
    where: { project_id: projectId },
    orderBy: { order: 'asc' }
  });

  const { data: objectives, isLoading: isObjectivesLoading, refetch: refetchObjectives } = useSupabaseCollection('Objective', {
    where: { project_id: projectId },
    orderBy: { created_at: 'asc' }
  });

  const { data: assets, isLoading: isAssetsLoading, refetch: refetchAssets } = useSupabaseCollection('Asset', {
    where: { project_id: projectId },
    orderBy: { created_at: 'desc' }
  });
  
  const { data: invoices, isLoading: isInvoicesLoading, refetch: refetchInvoices } = useSupabaseCollection('Invoice', {
    where: { project_id: projectId },
    orderBy: { created_at: 'desc' }
  });

  const { data: projectExpenses, isLoading: isProjectExpensesLoading, refetch: refetchExpenses } = useSupabaseCollection('Expense', {
    where: { project_id: projectId },
    orderBy: { date: 'desc' }
  });

  const { data: companyUsers } = useSupabaseCollection('User');

  // RBAC Gated access filter: accounts team blocked from creative media assets
  const hasMediaAccess = useMemo(() => {
    return roleId !== 'ACCOUNTS';
  }, [roleId]);

  // RBAC Gated access filter: employee team blocked from financial data
  const hasFinanceAccess = useMemo(() => {
    return roleId !== 'EMPLOYEE';
  }, [roleId]);

  // --- DERIVED CALCULATIONS ---
  const currentTab = activeTab || projectStages?.[0]?.name || "assets";

  const liveProgress = useMemo(() => {
    if (!objectives || objectives.length === 0) return project?.progress || 0;
    const completedCount = objectives.filter(t => t.status === 'Completed' || t.status === 'done').length;
    return Math.round((completedCount / objectives.length) * 100);
  }, [objectives, project?.progress]);

  // Strict enterprise phase progression gate validation
  const canAdvanceTo = (targetStatus: string): { allowed: boolean; reason?: string } => {
    if (roleId !== 'SUPER_ADMIN' && roleId !== 'MANAGER' && !isSuperAdmin) {
      return { allowed: false, reason: "Only Managers or Administrators can approve project phase progression." };
    }

    if (targetStatus === 'production') {
      const incompletePre = objectives?.filter(t => t.phase === 'pre-prod' && t.status !== 'done') || [];
      if (incompletePre.length > 0) {
        return { allowed: false, reason: `Cannot advance to Production. ${incompletePre.length} Pre-Production objectives are incomplete.` };
      }
    }
    
    if (targetStatus === 'post-prod') {
      const incompleteProd = objectives?.filter(t => ['pre-prod', 'production'].includes(t.phase) && t.status !== 'done') || [];
      if (incompleteProd.length > 0) {
        return { allowed: false, reason: `Cannot advance to Post-Production. Complete outstanding production phase objectives first.` };
      }
    }

    if (targetStatus === 'release') {
      const incompletePost = objectives?.filter(t => ['pre-prod', 'production', 'post-prod'].includes(t.phase) && t.status !== 'done') || [];
      if (incompletePost.length > 0) {
        return { allowed: false, reason: `Cannot advance to Release. Complete all post-production edits first.` };
      }
    }

    return { allowed: true };
  };

  const totalRevenueBase = useMemo(() => invoices?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0, [invoices]);
  const totalExpenses = useMemo(() => projectExpenses?.reduce((sum, ex) => sum + (ex.amount || 0), 0) || 0, [projectExpenses]);
  const netProfit = totalRevenueBase - totalExpenses;

  // --- ACTIONS ---
  const handleToggleObjective = async (objectiveId: string, currentStatus: string) => {
    if (!projectId) return;
    const newStatus = currentStatus === 'done' || currentStatus === 'Completed' ? 'Pending' : 'Completed';
    await supabase.from('Objective').update({ status: newStatus }).eq('id', objectiveId);
    await supabase.from('Project').update({ progress: liveProgress }).eq('id', projectId);
    refetchObjectives();
  };

  const handleAssignObjective = async (objectiveId: string, userId: string | null) => {
    await supabase.from('Objective').update({ assignee_id: userId }).eq('id', objectiveId);
    refetchObjectives();
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !timeLogObjective || !newTimeEntry.hours) return;
    setIsSubmitting(true);
    try {
      const durationSec = Math.round(parseFloat(newTimeEntry.hours) * 3600);
      const now = new Date();
      const startTime = new Date(now.getTime() - durationSec * 1000);

      const { error } = await supabase.from('TimeEntry').insert({
        user_id: profile.id,
        objective_id: timeLogObjective.id,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration_sec: durationSec,
        is_billable: newTimeEntry.is_billable,
        notes: newTimeEntry.notes || null,
      });
      if (error) throw error;

      // Update actual_hours on objective
      const newActual = (parseFloat(timeLogObjective.actual_hours || '0') + parseFloat(newTimeEntry.hours));
      await supabase.from('Objective').update({ actual_hours: newActual }).eq('id', timeLogObjective.id);

      toast({ title: 'Time Logged', description: `${newTimeEntry.hours}h logged to "${timeLogObjective.title}".` });
      setIsLogTimeOpen(false);
      setTimeLogObjective(null);
      setNewTimeEntry({ hours: '', notes: '', is_billable: true });
      refetchObjectives();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !newAssetLink) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('Asset').update({ url: newAssetLink }).eq('id', editingAsset.id);
      if (error) throw error;
      toast({ title: 'Link Updated', description: 'Asset link updated successfully.' });
      setIsEditAssetLinkOpen(false);
      setEditingAsset(null);
      setNewAssetLink("");
      refetchAssets();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !projectId || !newObjective.title) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('Objective').insert({
        company_id: companyId,
        project_id: projectId,
        title: newObjective.title,
        stage_id: projectStages?.find(s => s.name === currentTab)?.id || null,
        assignedTo: newObjective.assignedTo || "Producer",
        status: 'todo',
        priority: 'Medium',
      });

      if (error) throw error;

      toast({ title: "Objective Added", description: `Objective "${newObjective.title}" has been registered.` });
      setIsAddObjectiveOpen(false);
      setNewObjective({ title: "", assignedTo: "" });
      refetchObjectives();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !projectId || !newAsset.name) return;
    setIsSubmitting(true);

    try {
      // Seed signed visual url representation
      const fileUrl = newAsset.url || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809";

      const { error } = await supabase.from('Asset').insert({
        company_id: companyId,
        project_id: projectId,
        name: newAsset.name,
        url: fileUrl,
        file_size: 14890240, // 14.8 MB dummy size
        file_type: newAsset.file_type
      });

      if (error) throw error;

      // Log activity
      await supabase.from('ActivityLog').insert({
        company_id: companyId,
        user_id: profile?.id || 'system',
        user_name: profile?.fullName || 'Manager',
        action: 'ASSET_UPLOADED',
        details: `Uploaded asset "${newAsset.name}" to directory.`
      });

      toast({ title: "Asset Uploaded", description: `"${newAsset.name}" synced to the vault.` });
      setIsAddAssetOpen(false);
      setNewAsset({ name: "", url: "", file_type: "Video", folder: "pre-prod" });
      refetchAssets();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !projectId || !newExpense.amount) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('Expense').insert({
        company_id: companyId,
        project_id: projectId,
        category: newExpense.category,
        description: newExpense.description || "Production cost",
        amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date).toISOString(),
        status: newExpense.status
      });

      if (error) throw error;

      toast({ title: "Expense Saved", description: "Cost ledger updated successfully." });
      setIsLogExpenseOpen(false);
      setNewExpense({ category: "Talent & Crew", description: "", amount: "", date: new Date().toISOString().split('T')[0], status: "Paid" });
      refetchExpenses();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotation.text) return;

    const timestamp = `${newAnnotation.minutes.padStart(2, '0')}:${newAnnotation.seconds.padStart(2, '0')}`;
    const annotation: ReviewAnnotation = {
      timestamp,
      comment: newAnnotation.text,
      author: profile?.fullName || 'Crew Reviewer'
    };

    setMockAnnotations(prev => [...prev, annotation].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
    setNewAnnotation({ minutes: "00", seconds: "00", text: "" });
    toast({ title: "Feedback Recorded", description: `Annotation added at ${timestamp}.` });
  };

  // Helper functions for rendering
  const phaseObjectives = (stageName: string) => {
    const stage = projectStages?.find(s => s.name === stageName);
    return objectives?.filter(t => t.stage_id === stage?.id || (t as any).phase === stageName) || [];
  };
  const completedPhaseObjectives = (stageName: string) => phaseObjectives(stageName).filter(t => t.status === 'done' || t.status === 'Completed').length;
  const phaseProgress = (stageName: string) => {
    const pt = phaseObjectives(stageName);
    return pt.length > 0 ? Math.round((completedPhaseObjectives(stageName) / pt.length) * 100) : 0;
  };

  const getPhaseIcon = (phase: string) => {
    switch(phase) {
      case 'pre-prod': return <FileText className="h-4 w-4" />;
      case 'production': return <Camera className="h-4 w-4" />;
      case 'post-prod': return <Scissors className="h-4 w-4" />;
      case 'release': return <Rocket className="h-4 w-4" />;
      case 'assets': return <Package className="h-4 w-4" />;
      case 'finances': return <Receipt className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch(fileType?.toLowerCase()) {
      case 'video': return <FileVideo className="h-8 w-8 text-rose-500" />;
      case 'image': return <FileImage className="h-8 w-8 text-indigo-500" />;
      case 'audio': return <FileAudio className="h-8 w-8 text-amber-500" />;
      default: return <FileText className="h-8 w-8 text-slate-500" />;
    }
  };

  const isLoading = isTenantLoading || isProjectLoading || isStagesLoading || isObjectivesLoading || isAssetsLoading || isInvoicesLoading || isProjectExpensesLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Workspace Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested project could not be accessed.</p>
        <Link href="/projects"><Button variant="outline" className="rounded-xl">Back to Pipeline</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-0 -mt-4 -mx-4 md:-mt-8 md:-mx-8 lg:-mt-12 lg:-mx-12 bg-white min-h-[calc(100vh-2rem)]">
      {/* ── All-white Header ── */}
      <div className="bg-white px-8 pt-8 pb-0">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <button
              onClick={() => router.push("/projects")}
              className="mt-1 h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{project.project_name}</h1>
                {(roleId === 'SUPER_ADMIN' || roleId === 'MANAGER' || isSuperAdmin) ? (
                  <Select
                    defaultValue={project.status}
                    onValueChange={async (newStatus) => {
                      const gate = canAdvanceTo(newStatus);
                      if (!gate.allowed) {
                        toast({ variant: "destructive", title: "Pipeline Gate Locked", description: gate.reason });
                        return;
                      }
                      try {
                        await supabase.from('Project').update({ status: newStatus }).eq('id', projectId);
                        await supabase.from('ActivityLog').insert({
                          company_id: companyId,
                          user_id: profile?.id || 'system',
                          user_name: profile?.fullName || 'Manager',
                          action: 'PROJECT_STAGE_UPDATED',
                          details: `Advanced project "${project.project_name}" status to ${newStatus.toUpperCase()}.`
                        });
                        toast({ title: "Phase Approved", description: `Project advanced to ${newStatus.toUpperCase()}.` });
                      } catch (err: any) {
                        toast({ variant: "destructive", title: "Update Failed", description: err.message });
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 px-3 text-[10px] font-black uppercase rounded-full bg-slate-50 border-0 text-slate-600 w-auto focus:ring-0 shadow-none">
                      <SelectValue placeholder="Phase" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl p-1.5 shadow-xl border-0">
                      <SelectItem value="pre-prod" className="py-2 rounded-lg text-[10px] font-black uppercase">Pre-Production</SelectItem>
                      <SelectItem value="production" className="py-2 rounded-lg text-[10px] font-black uppercase">Production</SelectItem>
                      <SelectItem value="post-prod" className="py-2 rounded-lg text-[10px] font-black uppercase">Post-Production</SelectItem>
                      <SelectItem value="release" className="py-2 rounded-lg text-[10px] font-black uppercase">Release</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="rounded-full bg-slate-50 text-slate-500 font-black text-[10px] uppercase h-7 px-3 flex items-center">{project.status}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span>Client: <span className="text-slate-600 font-bold">{project.client_name || '—'}</span></span>
                <span className="opacity-30">•</span>
                <span className="font-mono text-[10px] bg-slate-50 px-2 py-0.5 rounded text-slate-400">{projectId.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Right: Progress ring + CTA */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">Production Velocity</p>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeDasharray={`${(liveProgress / 100) * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-700">{liveProgress}%</span>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">{liveProgress}%</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Complete</p>
                </div>
              </div>
            </div>
            <Button
              className="h-11 px-6 gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black text-xs active:scale-95 transition-all"
              onClick={() => activeTab === 'assets' ? setIsAddAssetOpen(true) : (activeTab === 'finances' && hasFinanceAccess ? setIsLogExpenseOpen(true) : setIsAddObjectiveOpen(true))}
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'assets' ? 'Upload Asset' : (activeTab === 'finances' && hasFinanceAccess ? 'Log Cost' : 'Add Task')}
            </Button>
          </div>
        </div>

        {/* Tab bar — white, bottom-border active indicator */}
        <div className="mt-8">
          <Tabs value={currentTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-0 border-b border-slate-100 w-full justify-start rounded-none">
              {projectStages?.map(stage => (
                <TabsTrigger
                  key={stage.id}
                  value={stage.name}
                  className="rounded-none px-5 py-3 gap-2 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-transparent border-0 border-b-2 border-transparent -mb-px data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none transition-all"
                >
                  {getPhaseIcon(stage.name.toLowerCase())} {stage.name}
                </TabsTrigger>
              ))}
              <TabsTrigger value="assets" className="rounded-none px-5 py-3 gap-2 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-transparent border-0 border-b-2 border-transparent -mb-px data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 transition-all">
                <Package className="h-3.5 w-3.5" /> Assets
              </TabsTrigger>
              {hasFinanceAccess && (
                <TabsTrigger value="finances" className="rounded-none px-5 py-3 gap-2 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-transparent border-0 border-b-2 border-transparent -mb-px data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 transition-all">
                  <Receipt className="h-3.5 w-3.5" /> Finances
                </TabsTrigger>
              )}
              <TabsTrigger value="timeline" className="rounded-none px-5 py-3 gap-2 text-slate-400 font-black text-[10px] uppercase tracking-wider bg-transparent border-0 border-b-2 border-transparent -mb-px data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 transition-all">
                <Calendar className="h-3.5 w-3.5" /> Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ── White Tab Content Area ── */}
      <div className="bg-white min-h-screen">
        <Tabs value={currentTab} onValueChange={setActiveTab} className="w-full">

        {/* Tab Content: Dynamic Production Phases */}
        {projectStages?.map((stage) => (
          <TabsContent key={stage.id} value={stage.name} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Main objectives */}
              <div className="lg:col-span-2 border-r border-slate-100">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {getPhaseIcon(stage.name.toLowerCase())}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 capitalize">{stage.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{phaseObjectives(stage.name).length} tasks · {phaseProgress(stage.name)}% complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${projectId}/approvals`}>
                      <Button size="sm" variant="outline" className="rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 gap-2 h-9">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Review
                      </Button>
                    </Link>
                    <Button size="sm" className="rounded-xl font-bold gap-2 h-9" onClick={() => setIsAddObjectiveOpen(true)}>
                      <Plus className="h-4 w-4" /> Add Task
                    </Button>
                  </div>
                </div>

                {phaseObjectives(stage.name).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
                    <Target className="h-10 w-10" />
                    <p className="text-sm font-bold text-slate-400">No tasks for this phase yet</p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setIsAddObjectiveOpen(true)}>Add First Task</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {phaseObjectives(stage.name).map((objective, i) => {
                      const assignee = companyUsers?.find(u => u.id === objective.assignee_id);
                      const isDone = objective.status === 'done' || objective.status === 'Completed';
                      const actualHrs = parseFloat(objective.actual_hours || '0');
                      const estHrs = parseFloat(objective.estimated_hours || '0');
                      return (
                        <div key={objective.id} className="flex items-start gap-4 px-8 py-5 hover:bg-slate-50/50 transition-colors group">
                          {/* Row number */}
                          <span className="text-[10px] font-black text-slate-300 w-5 pt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>

                          {/* Checkbox */}
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={() => handleToggleObjective(objective.id, objective.status)}
                            className="h-5 w-5 rounded-md mt-0.5 shrink-0"
                          />

                          {/* Main content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <p className={cn("font-bold text-sm leading-snug", isDone ? 'line-through text-slate-300' : 'text-slate-800')}>
                              {objective.title}
                            </p>

                            {/* Meta row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {objective.department && <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{objective.department}</span>}
                              {objective.priority && (
                                <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                  objective.priority === 'High' ? 'bg-red-50 text-red-500' :
                                  objective.priority === 'Medium' ? 'bg-amber-50 text-amber-500' :
                                  'bg-slate-100 text-slate-400'
                                )}>{objective.priority}</span>
                              )}
                              {actualHrs > 0 && (
                                <span className="text-[9px] font-black text-primary/70 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />{actualHrs}h logged{estHrs > 0 ? ` / ${estHrs}h est` : ''}
                                </span>
                              )}
                            </div>

                            {/* Assignee inline selector */}
                            <div className="flex items-center gap-2">
                              <Select
                                value={objective.assignee_id || 'unassigned'}
                                onValueChange={(val) => handleAssignObjective(objective.id, val === 'unassigned' ? null : val)}
                              >
                                <SelectTrigger className="h-7 text-[10px] font-bold w-auto max-w-[180px] bg-transparent border-0 shadow-none px-0 text-slate-400 hover:text-slate-700 focus:ring-0 gap-1.5 pl-0">
                                  {assignee ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black shrink-0">
                                        {(assignee.fullName || assignee.email || 'U')[0].toUpperCase()}
                                      </span>
                                      <span className="truncate">{assignee.fullName || assignee.email?.split('@')[0]}</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-slate-300">
                                      <UserPlus className="h-3 w-3" /> Assign
                                    </span>
                                  )}
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-0 shadow-xl p-1.5 w-52">
                                  <SelectItem value="unassigned" className="rounded-lg text-[10px] font-bold text-slate-400 italic">Unassigned</SelectItem>
                                  {companyUsers?.map(user => (
                                    <SelectItem key={user.id} value={user.id} className="rounded-lg text-xs font-bold">
                                      <span className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black shrink-0">
                                          {(user.fullName || user.email || 'U')[0].toUpperCase()}
                                        </span>
                                        {user.fullName || user.email?.split('@')[0]}
                                        <span className="text-slate-400 text-[9px] ml-auto">{(user.role_id || '').replace('_', ' ')}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Right: time log button */}
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setTimeLogObjective(objective); setIsLogTimeOpen(true); }}
                              className="h-7 px-2.5 rounded-lg bg-slate-50 hover:bg-primary/5 text-slate-400 hover:text-primary flex items-center gap-1.5 text-[10px] font-black uppercase transition-colors"
                            >
                              <Clock className="h-3 w-3" /> Log Time
                            </button>
                            {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Phase sidebar */}
              <div className="p-8 space-y-6">
                {/* Circular progress */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-24 w-24">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none"
                        stroke={phaseProgress(stage.name) === 100 ? '#10b981' : 'hsl(var(--primary))'}
                        strokeWidth="3"
                        strokeDasharray={`${(phaseProgress(stage.name) / 100) * 87.96} 87.96`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-slate-900">{phaseProgress(stage.name)}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-700 capitalize">{stage.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{completedPhaseObjectives(stage.name)} of {phaseObjectives(stage.name).length} done</p>
                  </div>
                </div>

                {/* Stage info */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                    <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                      stage.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      stage.status === 'completed' ? 'bg-primary/10 text-primary' :
                      'bg-slate-100 text-slate-500'
                    )}>{stage.status || 'pending'}</span>
                  </div>
                  {stage.start_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start</span>
                      <span className="text-xs font-bold text-slate-700">{new Date(stage.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                  {stage.end_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due</span>
                      <span className="text-xs font-bold text-slate-700">{new Date(stage.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        ))}

        {/* 🎬 ASSETS TAB */}
        <TabsContent value="assets" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!hasMediaAccess ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-black text-slate-800">Access Restricted</h2>
              <p className="text-slate-400 font-medium max-w-sm text-center text-sm">Accounts profiles are blocked from browsing creative media files.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              {/* Main content area */}
              <div className="lg:col-span-3 border-r border-slate-100">

                {/* Folder tabs */}
                <div className="grid grid-cols-4 border-b border-slate-100">
                  {[
                    { id: "all", label: "All Assets", icon: FolderOpen, color: "text-slate-600", activeBg: "bg-slate-900 text-white" },
                    { id: "pre-prod", label: "Pre-Production", icon: FileText, color: "text-blue-500", activeBg: "bg-blue-600 text-white" },
                    { id: "production", label: "Production", icon: Camera, color: "text-rose-500", activeBg: "bg-rose-600 text-white" },
                    { id: "post-prod", label: "Post-Production", icon: Scissors, color: "text-violet-500", activeBg: "bg-violet-600 text-white" },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFolderFilter(f.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-5 px-4 text-center border-b-2 transition-all font-bold text-[10px] uppercase tracking-widest",
                        selectedFolderFilter === f.id
                          ? "border-slate-900 text-slate-900 bg-slate-50"
                          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                      )}
                    >
                      <f.icon className={cn("h-5 w-5", selectedFolderFilter === f.id ? "text-slate-900" : f.color)} />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>

                {/* Video review player */}
                {selectedAssetForReview && selectedAssetForReview.file_type === 'Video' && (
                  <div className="mx-6 mt-6 rounded-2xl bg-slate-900 text-white overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-white/60">Live Review</span>
                        <span className="font-black text-white text-sm">{selectedAssetForReview.name}</span>
                      </div>
                      <button onClick={() => setSelectedAssetForReview(null)} className="text-white/30 hover:text-white text-xs font-bold transition-colors">Close ×</button>
                    </div>
                    <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer">
                      <Monitor className="h-12 w-12 text-slate-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                        <div className="flex items-center gap-3">
                          <button className="h-9 w-9 bg-rose-500 rounded-full flex items-center justify-center"><Play className="h-4 w-4 text-white fill-white" /></button>
                          <div className="flex-1 bg-white/20 h-1 rounded-full"><div className="bg-rose-500 h-full w-[40%] rounded-full" /></div>
                          <span className="text-xs font-mono text-white/60">00:48 / 02:30</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-3 border-t border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Timeline Feedback</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {mockAnnotations.map((ann, i) => (
                          <div key={i} className="flex items-start gap-3 text-xs">
                            <span className="font-mono font-black text-rose-400 bg-rose-950 px-2 py-0.5 rounded shrink-0">{ann.timestamp}</span>
                            <div>
                              <p className="text-slate-300 font-medium">{ann.comment}</p>
                              <p className="text-slate-600 text-[10px] font-bold uppercase mt-0.5">{ann.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddAnnotation} className="flex gap-2 pt-3 border-t border-slate-800">
                        <input maxLength={2} placeholder="mm" value={newAnnotation.minutes} onChange={e => setNewAnnotation({ ...newAnnotation, minutes: e.target.value })} className="w-12 bg-slate-800 border border-slate-700 text-white rounded-lg h-8 text-center text-xs font-mono" />
                        <span className="text-slate-600 font-mono self-center">:</span>
                        <input maxLength={2} placeholder="ss" value={newAnnotation.seconds} onChange={e => setNewAnnotation({ ...newAnnotation, seconds: e.target.value })} className="w-12 bg-slate-800 border border-slate-700 text-white rounded-lg h-8 text-center text-xs font-mono" />
                        <input placeholder="Add feedback note..." value={newAnnotation.text} onChange={e => setNewAnnotation({ ...newAnnotation, text: e.target.value })} className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg h-8 px-3 text-xs" />
                        <button type="submit" className="h-8 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-lg transition-colors">Tag</button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Assets grid */}
                <div className="p-6">
                  {assets?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-5 text-slate-300">
                      <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <UploadCloud className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-slate-500 text-sm">No assets uploaded yet</p>
                        <p className="text-slate-400 text-xs mt-1">Upload scripts, video packages, audio cuts, and deliverables</p>
                      </div>
                      <button onClick={() => setIsAddAssetOpen(true)} className="h-10 px-6 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors">
                        Upload First Asset
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {assets?.map((asset) => (
                        <div key={asset.id} className="group relative bg-white border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden transition-all hover:shadow-md">
                          {/* Thumbnail / type indicator */}
                          <div className={cn(
                            "h-28 flex items-center justify-center",
                            asset.file_type === 'Video' ? 'bg-gradient-to-br from-rose-50 to-rose-100' :
                            asset.file_type === 'Image' ? 'bg-gradient-to-br from-indigo-50 to-indigo-100' :
                            asset.file_type === 'Audio' ? 'bg-gradient-to-br from-amber-50 to-amber-100' :
                            'bg-gradient-to-br from-slate-50 to-slate-100'
                          )}>
                            {getFileIcon(asset.file_type)}
                            {asset.file_type === 'Video' && (
                              <button onClick={() => setSelectedAssetForReview(asset)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                                <div className="h-10 w-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                  <Play className="h-4 w-4 text-rose-500 fill-rose-500" />
                                </div>
                              </button>
                            )}
                          </div>
                          {/* Meta */}
                          <div className="p-4">
                            <p className="font-black text-sm text-slate-800 truncate">{asset.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                asset.file_type === 'Video' ? 'bg-rose-50 text-rose-500' :
                                asset.file_type === 'Image' ? 'bg-indigo-50 text-indigo-500' :
                                asset.file_type === 'Audio' ? 'bg-amber-50 text-amber-500' :
                                'bg-slate-100 text-slate-500'
                              )}>{asset.file_type}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{(asset.file_size / 1000000).toFixed(1)} MB</span>
                            </div>
                          </div>
                          <div className="px-4 pb-4 flex gap-2">
                            {asset.file_type === 'Video' && (
                              <button onClick={() => setSelectedAssetForReview(asset)} className="flex-1 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase rounded-lg transition-colors flex items-center justify-center gap-1">
                                <Play className="h-3 w-3" /> Review
                              </button>
                            )}
                            <button
                              onClick={() => { setEditingAsset(asset); setNewAssetLink(asset.url); setIsEditAssetLinkOpen(true); }}
                              className="flex-1 h-7 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3" /> Edit Link
                            </button>
                            <a href={asset.url || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 w-full h-7 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg transition-colors flex items-center justify-center gap-1">
                              <Download className="h-3 w-3" /> Open
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Storage Governance</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-500">Pool Used</span>
                        <span className="text-slate-800">1.4 GB / 25 GB</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" style={{ width: '6%' }} />
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Total Assets</span>
                        <span className="font-black text-slate-700">{assets?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Download Log</span>
                        <span className="font-black text-emerald-500">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">By Type</p>
                  <div className="space-y-2">
                    {['Video', 'Image', 'Audio', 'Document'].map(type => {
                      const count = assets?.filter(a => a.file_type === type).length || 0;
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                            type === 'Video' ? 'bg-rose-50' : type === 'Image' ? 'bg-indigo-50' : type === 'Audio' ? 'bg-amber-50' : 'bg-slate-50'
                          )}>
                            {type === 'Video' && <FileVideo className="h-3.5 w-3.5 text-rose-400" />}
                            {type === 'Image' && <FileImage className="h-3.5 w-3.5 text-indigo-400" />}
                            {type === 'Audio' && <FileAudio className="h-3.5 w-3.5 text-amber-400" />}
                            {type === 'Document' && <FileText className="h-3.5 w-3.5 text-slate-400" />}
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">{type}</span>
                            <span className="text-xs font-black text-slate-800">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setIsAddAssetOpen(true)}
                  className="w-full h-11 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <UploadCloud className="h-4 w-4" /> Upload Asset
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 💳 FINANCES TABCONTENT (Budget & Cost Ledgers) */}
        {hasFinanceAccess && (
        <TabsContent value="finances" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Cost ledger list */}
              <Card className="border-none shadow-sm rounded-[10px] bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                  <div>
                    <CardTitle className="text-lg">Expenses Cost Ledger</CardTitle>
                    <CardDescription>Log and authorize payroll indices, gear rentals, and transport costs.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs" onClick={() => setIsLogExpenseOpen(true)}>
                    <Receipt className="h-4 w-4 mr-2" /> Log Cost
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {projectExpenses?.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground italic text-sm">
                      No expenses logged for this project.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {projectExpenses?.map((exp) => (
                        <div key={exp.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                              <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800">{exp.category}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{exp.description || 'Production Charge'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <h4 className="font-black text-sm text-slate-800">₹{(exp.amount || 0).toLocaleString()}</h4>
                            <p className="text-[9px] text-slate-400 font-mono mt-1">{exp.date ? new Date(exp.date).toLocaleDateString() : 'Today'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Financial indicators */}
            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[10px] bg-white p-8 space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-500/60 tracking-[0.2em]">Project P&L Statement</span>
                  <h3 className="text-xl font-black">Profitability index</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Total Billed Subtotal</span>
                    <span className="font-black text-slate-800">₹{totalRevenueBase.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Total Logged expenses</span>
                    <span className="font-black text-rose-500">₹{totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Net Balance Margin</span>
                    <Badge className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none shadow-sm rounded-lg",
                      netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                    )}>
                      ₹{netProfit.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        )}

      
        <TabsContent value="timeline" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TimelineEngine objectives={objectives || []} startDate={project?.created_at} />
        </TabsContent>
  
        </Tabs>

      {/* Dialogs */}
      <Dialog open={isAddObjectiveOpen} onOpenChange={setIsAddObjectiveOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Add Task
            </DialogTitle>
            <DialogDescription>Assign objectives and milestone dates to crew members.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddObjective} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input placeholder="e.g. Rough Cut Assembly and Editing check" value={newObjective.title} onChange={(e) => setNewObjective({...newObjective, title: e.target.value})} required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Assigned Role / Crew Member</Label>
              <Select value={newObjective.assignedTo} onValueChange={(val) => setNewObjective({...newObjective, assignedTo: val})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Assignee" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {companyUsers?.map(user => (
                    <SelectItem key={user.id} value={user.fullName || user.email?.split('@')[0] || "Unknown"} className="rounded-lg m-1">
                      {user.fullName || user.email?.split('@')[0]} <span className="text-muted-foreground text-[10px] ml-1 uppercase font-bold">({(user.role_id || "Crew").replace('_', ' ')})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="Unassigned" className="rounded-lg m-1 text-slate-400 italic">Leave Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Register Asset */}
      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-indigo-500" />
              Register Storage Asset
            </DialogTitle>
            <DialogDescription>Input asset callback parameters. RLS checks will isolate this automatically.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input placeholder="e.g. Master Video Draft V1" value={newAsset.name} onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Asset Callback URL (Representing cloud storage bucket link)</Label>
              <Input placeholder="e.g. https://storage.googleapis.com/draft1.mp4" value={newAsset.url} onChange={(e) => setNewAsset({...newAsset, url: e.target.value})} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={newAsset.file_type} onValueChange={(val) => setNewAsset({...newAsset, file_type: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["Video", "Audio", "Image", "Document"].map(t => (
                      <SelectItem key={t} value={t} className="rounded-lg m-1">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Storage Folder</Label>
                <Select value={newAsset.folder} onValueChange={(val) => setNewAsset({...newAsset, folder: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pre-prod" className="rounded-lg m-1">Pre-Production</SelectItem>
                    <SelectItem value="production" className="rounded-lg m-1">Production</SelectItem>
                    <SelectItem value="post-prod" className="rounded-lg m-1">Post-Production</SelectItem>
                    <SelectItem value="release" className="rounded-lg m-1">Release Folder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Log Cost Expense */}
      <Dialog open={isLogExpenseOpen} onOpenChange={setIsLogExpenseOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-500 animate-pulse" />
              Log Production Cost
            </DialogTitle>
            <DialogDescription>Input cost parameter data. This instantly recalculates profitability metrics.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogExpense} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expense Amount (₹)</Label>
                <Input type="number" placeholder="₹ Amount" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Cost Category</Label>
                <Select value={newExpense.category} onValueChange={(val) => setNewExpense({...newExpense, category: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["Talent & Crew", "Gear Rental", "Catering & Transport", "Studio Space", "Software & Tools"].map(cat => (
                      <SelectItem key={cat} value={cat} className="rounded-lg m-1">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="e.g. RED V-Raptor Cine lens rental fee" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="rounded-xl min-h-[80px] text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newExpense.status} onValueChange={(val) => setNewExpense({...newExpense, status: val})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Paid" className="rounded-lg m-1">Paid</SelectItem>
                    <SelectItem value="Pending" className="rounded-lg m-1">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Expense Cost"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Log Time */}
      <Dialog open={isLogTimeOpen} onOpenChange={setIsLogTimeOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Log Time
            </DialogTitle>
            <DialogDescription>
              Logging time for: <span className="font-bold text-slate-900">{timeLogObjective?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogTime} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hours Spent</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 2.5"
                value={newTimeEntry.hours}
                onChange={(e) => setNewTimeEntry({...newTimeEntry, hours: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="What did you work on?"
                value={newTimeEntry.notes}
                onChange={(e) => setNewTimeEntry({...newTimeEntry, notes: e.target.value})}
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="billable"
                checked={newTimeEntry.is_billable}
                onCheckedChange={(checked) => setNewTimeEntry({...newTimeEntry, is_billable: checked as boolean})}
              />
              <Label htmlFor="billable" className="text-sm font-medium leading-none cursor-pointer">
                This time is billable to the client
              </Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Time Log"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Asset Link */}
      <Dialog open={isEditAssetLinkOpen} onOpenChange={setIsEditAssetLinkOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-indigo-500" />
              Update Asset Link
            </DialogTitle>
            <DialogDescription>
              Provide a new Google Drive or external link for: <span className="font-bold text-slate-900">{editingAsset?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAssetLink} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>External Link (Google Drive, Dropbox, etc.)</Label>
              <Input
                type="url"
                placeholder="https://drive.google.com/..."
                value={newAssetLink}
                onChange={(e) => setNewAssetLink(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save New Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
}
