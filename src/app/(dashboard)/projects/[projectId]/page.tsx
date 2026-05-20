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
  ShieldAlert
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
  const [activeTab, setActiveTab] = useState("pre-prod");
  
  // Dialog States
  const [isAddObjectiveOpen, setIsAddObjectiveOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  
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

  // --- DERIVED CALCULATIONS ---
  const liveProgress = useMemo(() => {
    if (!objectives || objectives.length === 0) return project?.progress || 0;
    const corePhases = ['pre-prod', 'production', 'post-prod', 'release'];
    const productionObjectives = objectives.filter(t => corePhases.includes(t.phase));
    if (productionObjectives.length === 0) return 0;
    const completedCount = productionObjectives.filter(t => t.status === 'done').length;
    return Math.round((completedCount / productionObjectives.length) * 100);
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
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    await supabase.from('Objective').update({ status: newStatus }).eq('id', objectiveId);

    // Update project progress
    await supabase.from('Project').update({ progress: liveProgress }).eq('id', projectId);
    refetchObjectives();
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
        phase: activeTab === 'assets' || activeTab === 'finances' ? 'production' : activeTab,
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
  const phaseObjectives = (phase: string) => objectives?.filter(t => t.phase === phase) || [];
  const completedPhaseObjectives = (phase: string) => phaseObjectives(phase).filter(t => t.status === 'done').length;
  const phaseProgress = (phase: string) => {
    const pt = phaseObjectives(phase);
    return pt.length > 0 ? Math.round((completedPhaseObjectives(phase) / pt.length) * 100) : 0;
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

  const isLoading = isTenantLoading || isProjectLoading || isObjectivesLoading || isAssetsLoading || isInvoicesLoading || isProjectExpensesLoading;

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-[10px] bg-white shadow-sm border border-slate-100" onClick={() => router.push("/projects")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{project.project_name}</h1>
              {(roleId === 'SUPER_ADMIN' || roleId === 'MANAGER' || isSuperAdmin) ? (
                <Select
                  defaultValue={project.status}
                  onValueChange={async (newStatus) => {
                    const gate = canAdvanceTo(newStatus);
                    if (!gate.allowed) {
                      toast({
                        variant: "destructive",
                        title: "Pipeline Gate Locked",
                        description: gate.reason
                      });
                      return;
                    }
                    
                    try {
                      await supabase.from('Project').update({ status: newStatus }).eq('id', projectId);
                      
                      // Log activity
                      await supabase.from('ActivityLog').insert({
                        company_id: companyId,
                        user_id: profile?.id || 'system',
                        user_name: profile?.fullName || 'Manager',
                        action: 'PROJECT_STAGE_UPDATED',
                        details: `Advanced project "${project.project_name}" status to ${newStatus.toUpperCase()}.`
                      });

                      toast({
                        title: "Phase Approved",
                        description: `Project has successfully advanced to ${newStatus.toUpperCase()}.`
                      });
                    } catch (err: any) {
                      toast({ variant: "destructive", title: "Update Failed", description: err.message });
                    }
                  }}
                >
                  <SelectTrigger className="rounded-full bg-white font-body font-black text-[10px] uppercase h-7 px-3 border-slate-200 focus:ring-primary/10">
                    <SelectValue placeholder="Select Phase" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px] p-1.5 font-body">
                    <SelectItem value="pre-prod" className="py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 focus:bg-primary/5 focus:text-primary">Pre-Production</SelectItem>
                    <SelectItem value="production" className="py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 focus:bg-primary/5 focus:text-primary">Production</SelectItem>
                    <SelectItem value="post-prod" className="py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 focus:bg-primary/5 focus:text-primary">Post-Production</SelectItem>
                    <SelectItem value="release" className="py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 focus:bg-primary/5 focus:text-primary">Release</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="rounded-full bg-white font-bold text-[10px] uppercase">{project.status}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              Client: <span className="font-bold text-slate-700">{project.client_name}</span>
              <span className="opacity-20">•</span>
              Ref ID: <span className="font-mono text-[10px] uppercase bg-slate-100 px-1.5 py-0.5 rounded">{projectId.slice(0,8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em] mb-1.5">Production Velocity</p>
            <div className="flex items-center gap-3">
              <Progress value={liveProgress} className="w-40 h-2 bg-primary/10" />
              <span className="text-sm font-black text-primary">{liveProgress}%</span>
            </div>
          </div>
          <Button className="rounded-[10px] gap-2 shadow-lg shadow-primary/20 h-12 px-6 font-bold text-xs" onClick={() => activeTab === 'assets' ? setIsAddAssetOpen(true) : (activeTab === 'finances' ? setIsLogExpenseOpen(true) : setIsAddObjectiveOpen(true))}>
            <Plus className="h-4 w-4" /> {activeTab === 'assets' ? 'Register Asset' : (activeTab === 'finances' ? 'Log Cost' : 'Add Objective')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1.5 rounded-[10px] h-auto flex-wrap mb-8 gap-1.5">
          {["pre-prod", "production", "post-prod", "release", "assets", "finances", "timeline"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-wider">
              {tab === 'timeline' ? <Calendar className="h-3.5 w-3.5" /> : getPhaseIcon(tab)} {tab.replace('-', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content: Production Phases */}
        {["pre-prod", "production", "post-prod", "release"].map((phase) => (
          <TabsContent key={phase} value={phase} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm rounded-[10px] overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">{getPhaseIcon(phase)}</div>
                        <CardTitle className="text-xl capitalize">{phase.replace('-', ' ')} Objectives</CardTitle>
                      </div>
                      <CardDescription>Assign and track key deliverables for this phase.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${projectId}/approvals`}>
                        <Button size="sm" variant="outline" className="hidden sm:flex rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Review Assets
                        </Button>
                      </Link>
                      <Button size="sm" className="rounded-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 gap-2" onClick={() => setIsAddObjectiveOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Objective
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {phaseObjectives(phase).length === 0 ? (
                      <div className="text-center py-24 text-muted-foreground space-y-4">
                        <Target className="h-12 w-12 mx-auto opacity-10" />
                        <p className="text-sm font-medium">No objectives set up for this phase.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {phaseObjectives(phase).map((objective) => (
                          <div key={objective.id} className="flex items-center gap-4 px-8 py-5 hover:bg-slate-50 transition-colors group">
                            <Checkbox 
                              checked={objective.status === 'done'} 
                              onCheckedChange={() => handleToggleObjective(objective.id, objective.status)}
                              className="h-5 w-5 rounded-md border-2 border-primary data-[state=checked]:bg-primary"
                            />
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${objective.status === 'done' ? 'line-through text-muted-foreground' : 'text-slate-800'}`}>
                                {objective.title}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Assigned: {objective.assignedTo || 'Unassigned'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Progress Summary Card */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-[10px] bg-white p-8 space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em]">Phase Progress</span>
                    <h3 className="text-3xl font-black capitalize">{phase.replace('-', ' ')}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Objectives Finished</span>
                      <span className="text-base font-black text-primary">{phaseProgress(phase)}%</span>
                    </div>
                    <Progress value={phaseProgress(phase)} className="h-2 bg-slate-100" />
                  </div>
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Total Phase Objectives</span>
                      <span className="font-bold text-slate-700">{phaseObjectives(phase).length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Completed Checklist</span>
                      <span className="font-bold text-slate-700">{completedPhaseObjectives(phase)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}

        {/* 🎬 ASSETS TABCONTENT (Phase 1 to 6 - Media Asset Operating System) */}
        <TabsContent value="assets" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!hasMediaAccess ? (
            <div className="text-center py-20 px-4">
              <div className="p-4 bg-rose-50 rounded-full text-rose-500 w-16 h-16 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-6">Financial Role Restriction</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">Accounts profiles are securely blocked from browsing creative video files and folders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Video Annotation Preview Player */}
                {selectedAssetForReview && selectedAssetForReview.file_type === 'Video' && (
                  <Card className="border-none shadow-xl rounded-[10px] bg-slate-900 text-white overflow-hidden p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <Badge className="bg-rose-500 text-white border-none font-bold text-[9px] uppercase px-2.5 py-0.5">Live review</Badge>
                        <h3 className="font-black text-xl mt-1.5">{selectedAssetForReview.name}</h3>
                      </div>
                      <Button variant="ghost" className="text-slate-400 hover:text-white rounded-xl h-8 px-3" onClick={() => setSelectedAssetForReview(null)}>Close Player</Button>
                    </div>

                    {/* Interactive Video Player */}
                    <div className="relative aspect-video bg-black rounded-[10px] overflow-hidden flex items-center justify-center border border-slate-800 group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                          <Button size="icon" className="h-10 w-10 bg-rose-500 text-white rounded-full"><Play className="h-5 w-5 fill-white" /></Button>
                          <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden relative">
                            <div className="bg-rose-500 h-full w-[40%] rounded-full"></div>
                          </div>
                          <span className="text-xs font-mono">00:48 / 02:30</span>
                        </div>
                      </div>
                      <Monitor className="h-16 w-16 text-slate-800 animate-pulse" />
                    </div>

                    {/* Annotations Timeline */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <h4 className="font-bold text-sm tracking-widest uppercase text-slate-400 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Timeline feedback
                      </h4>
                      <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 divide-y divide-slate-800">
                        {mockAnnotations.map((ann, idx) => (
                          <div key={idx} className="pt-3 flex items-start gap-4 text-xs font-body">
                            <span className="font-mono font-black text-rose-500 bg-rose-950 px-2 py-0.5 rounded">{ann.timestamp}</span>
                            <div className="flex-1 space-y-1">
                              <p className="font-bold text-slate-300">{ann.comment}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Added by: {ann.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Annotation Form */}
                      <form onSubmit={handleAddAnnotation} className="flex gap-3 pt-4 border-t border-slate-800 items-end">
                        <div className="w-16 space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-slate-400">Min</Label>
                          <Input maxLength={2} value={newAnnotation.minutes} onChange={(e) => setNewAnnotation({...newAnnotation, minutes: e.target.value})} className="bg-slate-800 border-slate-700 text-white rounded-lg h-9 text-center font-mono" />
                        </div>
                        <span className="text-xl pb-1 font-mono text-slate-600">:</span>
                        <div className="w-16 space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-slate-400">Sec</Label>
                          <Input maxLength={2} value={newAnnotation.seconds} onChange={(e) => setNewAnnotation({...newAnnotation, seconds: e.target.value})} className="bg-slate-800 border-slate-700 text-white rounded-lg h-9 text-center font-mono" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[9px] uppercase tracking-wider text-slate-400">Annotation detail</Label>
                          <Input placeholder="Reduce brightness, add subtitle tag..." value={newAnnotation.text} onChange={(e) => setNewAnnotation({...newAnnotation, text: e.target.value})} className="bg-slate-800 border-slate-700 text-white rounded-xl h-9 text-sm" />
                        </div>
                        <Button type="submit" size="sm" className="h-9 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold">Add Tag</Button>
                      </form>
                    </div>
                  </Card>
                )}

                {/* Storage Directories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "all", label: "All Assets" },
                    { id: "pre-prod", label: "Pre-Production" },
                    { id: "production", label: "Production" },
                    { id: "post-prod", label: "Post-Production" }
                  ].map(f => (
                    <Button 
                      key={f.id} 
                      onClick={() => setSelectedFolderFilter(f.id)}
                      className={cn(
                        "h-16 rounded-[10px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 border transition-all",
                        selectedFolderFilter === f.id 
                          ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" /> {f.label}
                    </Button>
                  ))}
                </div>

                {/* Assets Grid list */}
                <Card className="border-none shadow-sm rounded-[10px] bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                    <div>
                      <CardTitle className="text-lg">Structured Storage Vault</CardTitle>
                      <CardDescription>Drag and drop production packages, audio cuts, and deliverables.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs" onClick={() => setIsAddAssetOpen(true)}>
                      <UploadCloud className="h-4 w-4 mr-2" /> Upload Item
                    </Button>
                  </CardHeader>
                  <CardContent className="p-8">
                    {assets?.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground italic text-sm">
                        No files registered in directory. Upload scripts or video packages to get started.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {assets?.map((asset) => (
                          <Card key={asset.id} className="border border-slate-100 hover:border-slate-300 transition-all rounded-[10px] overflow-hidden bg-white p-5 flex gap-4 items-center group">
                            <div className="h-14 w-14 bg-slate-50 rounded-[10px] flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                              {getFileIcon(asset.file_type)}
                            </div>
                            <div className="flex-1 space-y-1 overflow-hidden">
                              <h4 className="font-bold text-sm text-slate-800 truncate leading-snug">{asset.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(asset.file_size / 1000000).toFixed(1)} MB • {asset.file_type}</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {asset.file_type === 'Video' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                                  onClick={() => setSelectedAssetForReview(asset)}
                                >
                                  <Play className="h-3.5 w-3.5" /> Review
                                </Button>
                              )}
                              <a href={asset.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 rounded-lg text-slate-600 hover:bg-slate-50">
                                  <Download className="h-3.5 w-3.5" /> Open
                                </Button>
                              </a>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Media Storage Capacity card */}
              <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-[10px] bg-white p-8 space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-500/60 tracking-[0.2em]">Storage Governance</span>
                    <h3 className="text-xl font-black">Quota & Compliance</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-slate-400 font-bold">Storage Pool used</span>
                      <span className="font-black text-slate-700">1.4 GB / 25 GB</span>
                    </div>
                    <Progress value={6} className="h-2 bg-slate-100" />
                  </div>

                  <div className="pt-4 border-t space-y-3 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-400">Total assets uploaded</span>
                      <span className="font-bold text-slate-700">{assets?.length || 0}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-400">Download tracking log</span>
                      <span className="font-bold text-emerald-500">Active</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 💳 FINANCES TABCONTENT (Budget & Cost Ledgers) */}
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

      
        <TabsContent value="timeline" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TimelineEngine objectives={objectives || []} startDate={project?.created_at} />
        </TabsContent>
  
      </Tabs>

      {/* Dialog: Add Objective */}
      <Dialog open={isAddObjectiveOpen} onOpenChange={setIsAddObjectiveOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Add Phase Objective
            </DialogTitle>
            <DialogDescription>Assign objectives and milestone dates to crew members.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddObjective} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objective Title</Label>
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
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Objective"}
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

    </div>
  );
}
