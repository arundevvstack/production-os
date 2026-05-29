
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  Calendar, 
  MoreVertical, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  X,
  Briefcase,
  Layers,
  ArrowRight,
  Database,
  Trash2,
  Archive,
  Film
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import { ListTree, IndianRupee, Zap, Target, Cpu } from "lucide-react";
import { CONTENT_VERTICALS } from "../clients/page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// UnifiedClientSelector not used in dialog (replaced with native input+datalist to avoid Radix FocusScope conflicts)
import { ENTERPRISE_TEMPLATES, DEFAULT_TIMELINE_DAYS } from "@/lib/enterprise-workflow-templates";
import { broadcastTableUpdate } from "@/supabase/hooks/use-collection";

type ViewMode = 'grid' | 'list' | 'timeline' | 'board';

const PROJECT_COLORS = [
  'bg-rose-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-purple-500'
];

export default function ProjectsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<any>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("None");

  // Form State
  const [newProject, setNewProject] = useState({
    project_name: "",
    client_name: "",
    budget: "",
    deadline: "",
    service_category: "",
    service: "",
    project_type: "Normal Production"
  });

  // Fetch Projects from Supabase
  const { data: projects, isLoading: isProjectsLoading, refetch: reloadProjects } = useSupabaseCollection('Project', {
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  // Fetch Leads for the client dropdown from Supabase
  const { data: leads } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { company_name: 'asc' }
  });

  // Filter Logic
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      const matchesSearch = 
        (p.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleLeadImport = (leadId: string) => {
    const lead = leads?.find(l => l.id === leadId);
    if (lead) {
      setSelectedLeadId(leadId); // Track lead ID for automatic 'Won' transition
      setNewProject({
        ...newProject,
        client_name: lead.company_name || "",
        budget: lead.deal_value ? lead.deal_value.toString() : "",
        project_name: `${lead.company_name} - ${new Date().getFullYear()} Production`,
        service_category: lead.service_vertical || "",
        service: lead.sub_vertical || "",
      });
      toast({
        title: "CRM Data Imported",
        description: `Linked to ${lead.company_name} opportunity.`,
      });
    }
  };

  const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newProject.project_name || !newProject.client_name) {
      console.error("Project creation failed: Missing required fields", { 
        companyId, 
        projectName: newProject.project_name, 
        clientName: newProject.client_name,
        serviceCat: newProject.service_category,
        service: newProject.service
      });
      toast({
        variant: "destructive",
        title: "Information Missing",
        description: `Please provide a project name and select a client. ${!newProject.client_name ? "(Client is missing)" : ""}`,
      });
      return;
    }

    setIsSubmitting(true);
    // 1. Trigger lead status update to 'won' if imported
    if (selectedLeadId) {
      await supabase.from('Prospect').update({ 
        stage: 'won' 
      }).eq('id', selectedLeadId);
    }

    // 2. Create Project via Enterprise API
    const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
    try {
      const res = await fetch('/api/v1/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          user_id: profile?.id,
          project_name: newProject.project_name,
          client_name: newProject.client_name,
          budget: newProject.budget,
          deadline: newProject.deadline,
          project_type: newProject.project_type,
          project_category: newProject.service_category,
          color: randomColor
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to initialize project workspace");
      }
      
      toast({
        title: "Project Created",
        description: `${newProject.project_name} has been created with all stages and objectives pre-loaded.`,
      });

      setNewProject({ project_name: "", client_name: "", budget: "", deadline: "", service_category: "", service: "", project_type: "Normal Production" });
      setSelectedTemplate("None");
      setSelectedLeadId(null);
      setIsCreateOpen(false);
      reloadProjects();
      broadcastTableUpdate('Project');
    } catch (err: any) {
      console.error("Project creation error:", err);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!projectToArchive || !companyId) return;
    const project = projectToArchive;

    const archiveId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;

    // Archive with data in JSON column (Archive table schema: id, company_id, archive_type, archived_at, data)
    const { error: archiveErr } = await supabase.from('Archive').insert({
      company_id: companyId,
      archive_type: 'project',
      archived_at: new Date().toISOString(),
      data: project,
    });

    if (archiveErr) {
      toast({ variant: "destructive", title: "Archive Failed", description: archiveErr.message });
      setProjectToArchive(null);
      return;
    }

    // Delete from Projects table
    const { error: deleteErr } = await supabase.from('Project').delete().eq('id', project.id);

    if (deleteErr) {
      toast({ variant: "destructive", title: "Delete Failed", description: deleteErr.message });
    } else {
      toast({ 
        title: "Project Archived", 
        description: `"${project.project_name}" has been moved to the Workspace Vault.` 
      });
    }

    setProjectToArchive(null);
    reloadProjects();
    broadcastTableUpdate('Project');
    broadcastTableUpdate('Archive');
  };

  if (isTenantLoading || isProjectsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Production <span className="text-gradient">Projects</span></h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Film className="h-4 w-4" /> Global content lifecycle
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search projects..." 
              className="pl-11 h-12 rounded-[10px] border-white/60 bg-white/40 backdrop-blur-xl focus:bg-white focus:ring-primary/20 transition-all shadow-premium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 gap-3 rounded-[10px] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                <Plus className="h-5 w-5" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] rounded-[10px] border-slate-200 bg-white p-0 overflow-hidden shadow-2xl">
              <div className="bg-white border-b border-slate-100 p-8 text-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-50 rotate-12">
                  <Sparkles className="h-32 w-32 text-slate-100" />
                </div>
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900">
                    <div className="h-10 w-10 rounded-[10px] bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    New Project
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                    Enter project details below
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <form onSubmit={handleCreateProject} className="p-8 space-y-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Category</Label>
                    <Select 
                      value={newProject.service_category} 
                      onValueChange={(val) => setNewProject({...newProject, service_category: val, service: ""})}
                    >
                      <SelectTrigger className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[10px] bg-white border border-slate-200 shadow-xl z-[100]">
                        {CONTENT_VERTICALS.map(v => (
                          <SelectItem key={v.id} value={v.name} className="text-xs font-bold rounded-xl m-1">{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service</Label>
                    <Select 
                      disabled={!newProject.service_category}
                      value={newProject.service} 
                      onValueChange={(val) => setNewProject({...newProject, service: val})}
                    >
                      <SelectTrigger className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2">
                          <ListTree className="h-3 w-3 text-muted-foreground" />
                          <SelectValue placeholder={newProject.service_category ? "Select service" : "Select category first"} />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-[10px] bg-white border border-slate-200 shadow-xl z-[100]">
                        {CONTENT_VERTICALS.find(v => v.name === newProject.service_category)?.services.map(s => (
                          <SelectItem key={s} value={s} className="text-xs font-bold rounded-xl m-1">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Workflow Pipeline (Project Type)</Label>
                  <Select 
                    value={newProject.project_type} 
                    onValueChange={(val) => setNewProject({...newProject, project_type: val})}
                  >
                    <SelectTrigger className="h-14 rounded-[10px] border-slate-200 bg-slate-50 shadow-inner font-black text-slate-800">
                      <div className="flex items-center gap-3">
                        <Cpu className="h-4 w-4 text-primary" />
                        <SelectValue placeholder="Select Pipeline" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px] bg-white border border-slate-200 shadow-xl z-[100]">
                      <SelectItem value="AI Production" className="text-xs font-bold rounded-xl m-1 py-3"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Production Pipeline</div></SelectItem>
                      <SelectItem value="Hybrid Production" className="text-xs font-bold rounded-xl m-1 py-3"><div className="flex items-center gap-2"><Layers className="h-4 w-4 text-amber-500" /> Hybrid Production Pipeline</div></SelectItem>
                      <SelectItem value="Normal Production" className="text-xs font-bold rounded-xl m-1 py-3"><div className="flex items-center gap-2"><Film className="h-4 w-4 text-slate-500" /> Standard Production Pipeline</div></SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Pipeline Preview Panel */}
                  {newProject.project_type && ENTERPRISE_TEMPLATES[newProject.project_type] && (() => {
                    const tmpl = ENTERPRISE_TEMPLATES[newProject.project_type];
                    const totalObjs = tmpl.stages.reduce((acc, s) => acc + s.objectives.length, 0);
                    const defaultDays = DEFAULT_TIMELINE_DAYS[newProject.project_type];
                    return (
                      <div className="mt-3 rounded-[10px] border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Generated Workspace</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400">{tmpl.stages.length} Stages</span>
                            <span className="text-[10px] font-bold text-slate-400">{totalObjs} Objectives</span>
                            {!newProject.deadline && <span className="text-[10px] font-bold text-amber-500">{defaultDays}d default timeline</span>}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {tmpl.stages.map((stage, i) => (
                            <div key={stage.name} className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-slate-500">{i + 1}</span>
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">{stage.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{stage.objectives.length} tasks</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                          All stages, objectives, timelines, and dependency chains will be created automatically.
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Project Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Project Alpha..." 
                      value={newProject.project_name}
                      onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                      required
                      className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm focus:ring-primary/10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client</Label>
                    <div className="relative">
                      <input
                        list="client-list"
                        type="text"
                        placeholder="Type to search clients..."
                        value={newProject.client_name}
                        onChange={(e) => {
                          const typed = e.target.value;
                          setNewProject(prev => ({ ...prev, client_name: typed }));
                          // Auto-fill from leads when an exact match is found
                          const lead = leads?.find(l => l.company_name === typed);
                          if (lead) {
                            setSelectedLeadId(lead.id);
                            setNewProject(prev => ({
                              ...prev,
                              client_name: typed,
                              service_category: lead.service_vertical || prev.service_category,
                              service: lead.sub_vertical || prev.service,
                              budget: lead.deal_value ? lead.deal_value.toString() : prev.budget
                            }));
                          }
                        }}
                        className="h-12 w-full rounded-[10px] border border-slate-200 bg-white shadow-sm font-bold px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                      />
                      <datalist id="client-list">
                        {leads?.map(l => l.company_name).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Budget</Label>
                    <Input 
                      id="budget" 
                      type="number"
                      placeholder="0.00" 
                      value={newProject.budget}
                      onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                      className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deadline</Label>
                    <Input 
                      id="deadline" 
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm font-bold"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-[10px] shadow-xl shadow-slate-900/20 active:scale-98 transition-all mt-4">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white/40 backdrop-blur-xl p-2 rounded-[10px] border border-white/60 shadow-premium gap-4 mx-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-[10px]">
          {[
            { id: 'grid', icon: LayoutGrid, label: 'Grid' },
            { id: 'list', icon: ListIcon, label: 'List' },
            { id: 'timeline', icon: Calendar, label: 'Timeline' }
          ].map((mode) => (
            <Button 
              key={mode.id}
              variant="ghost" 
              size="sm" 
              onClick={() => setViewMode(mode.id as ViewMode)}
              className={cn(
                "h-9 px-6 gap-2 rounded-xl transition-all duration-500", 
                viewMode === mode.id ? "bg-white shadow-md text-primary font-black" : "text-slate-500 font-bold hover:bg-white/50"
              )}
            >
              <mode.icon className="h-4 w-4" /> 
              <span className="text-[10px] uppercase tracking-widest">{mode.label}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 pr-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="h-10 rounded-xl px-4 bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest flex gap-2">
              Status: {statusFilter.replace('_', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-5 gap-2 rounded-xl border-slate-200 bg-white/50 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">
                <Filter className="h-4 w-4" /> Intelligence Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[10px] w-64 glass-panel border-white/60 p-2">
              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 px-4 py-3">Classification</DropdownMenuLabel>
              {['all', 'in_progress', 'completed', 'on_hold'].map((status) => (
                <DropdownMenuCheckboxItem 
                  key={status}
                  checked={statusFilter === status} 
                  onCheckedChange={() => setStatusFilter(status)}
                  className="rounded-xl m-1 font-bold text-xs capitalize py-2.5"
                >
                  {status.replace('_', ' ')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px] px-2 pb-12">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/20 backdrop-blur-md rounded-[4rem] border-2 border-dashed border-white/60">
            <div className="h-20 w-20 rounded-[10px] bg-slate-50 flex items-center justify-center mb-6">
              <Archive className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Zero operational units detected</p>
            <Button variant="link" className="mt-4 text-primary font-black uppercase tracking-widest text-[10px]" onClick={() => setIsCreateOpen(true)}>Initialize Primary Protocol</Button>
          </div>
        ) : (
          <div className={cn(
            "animate-in fade-in slide-in-from-bottom-8 duration-1000",
            viewMode === 'grid' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8",
            viewMode === 'list' && "space-y-6",
            viewMode === 'timeline' && "relative before:absolute before:left-6 md:before:left-[50%] before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-primary/20 before:via-primary/5 before:to-transparent pt-8 pb-16"
          )}>
            {filteredProjects.map((proj, idx) => (
              <ProjectCard 
                key={proj.id} 
                project={proj} 
                view={viewMode} 
                index={idx}
                onArchive={(p) => setProjectToArchive(p)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!projectToArchive} onOpenChange={(open) => !open && setProjectToArchive(null)}>
        <AlertDialogContent className="rounded-[10px] glass-panel border-white/60 p-12">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black tracking-tight text-slate-900">Decommission Unit?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-lg leading-relaxed pt-2">
              Proceeding will move <span className="font-black text-slate-900">"{projectToArchive?.project_name}"</span> to the high-security archive vault. Primary operations will be suspended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel className="h-12 px-8 rounded-[10px] border-slate-200 font-black uppercase tracking-widest text-[10px]">Abort Protocol</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="h-12 px-8 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20">
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({ project, view, index, onArchive }: { project: any, view: ViewMode, index: number, onArchive: (p: any) => void }) {
  const isEven = index % 2 === 0;

  if (view === 'grid') {
    return (
      <Card className="premium-card group border-none shadow-premium rounded-[10px] overflow-hidden transition-all duration-500 hover:-translate-y-2">
        <div className={cn("p-6 flex flex-col gap-6 relative", project.color || 'card-red')}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-1000">
            <Film className="h-20 w-20" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <Badge className="h-6 px-3 rounded-full bg-white/20 backdrop-blur-xl border-none text-[8px] font-black uppercase tracking-[0.05em] text-white">
              {project.status?.replace('_', ' ')}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10 rounded-[10px] backdrop-blur-xl border border-white/20">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-[10px] bg-white border border-slate-100 shadow-xl p-2 w-52 z-[100]">
                <DropdownMenuItem asChild className="rounded-xl m-1 py-3 font-bold cursor-pointer">
                  <Link href={`/projects/${project.id}`} className="gap-3">
                    <ExternalLink className="h-4 w-4" /> View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-rose-500 font-bold gap-3 rounded-xl m-1 py-3 cursor-pointer focus:bg-rose-50" onClick={() => onArchive(project)}>
                  <Archive className="h-4 w-4" /> Archive Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href={`/projects/${project.id}`} className="relative z-10">
            <h3 className="text-white font-black text-2xl tracking-tighter leading-none group-hover:underline">{project.project_name}</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-2">{project.client_name}</p>
          </Link>
        </div>
        <CardContent className="p-6 space-y-5 bg-white/60 backdrop-blur-3xl">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-normal">Health Index</span>
              <span className="text-lg font-black text-slate-900 leading-none">{project.progress || 0}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
               <div 
                 className={cn("h-full transition-all duration-1000 shadow-lg", project.color?.replace('bg-', 'bg-') || 'bg-primary')} 
                 style={{ width: `${project.progress || 0}%` }} 
               />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{project.deadline || 'TBD'}</span>
            </div>
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white shadow-xl ring-1 ring-slate-100">
                  <AvatarImage src={`https://picsum.photos/seed/${project.id+i}/80/80`} />
                  <AvatarFallback className="text-[8px] font-black bg-primary text-white">U</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (view === 'timeline') {
    return (
      <div className={cn(
        "relative flex flex-col md:flex-row items-center gap-12",
        isEven ? "md:flex-row-reverse" : "md:flex-row",
        index > 0 ? "mt-12 md:-mt-16 relative z-10" : "relative z-10"
      )}>
        <div className="absolute left-6 md:left-[50%] -translate-x-[50%] z-20">
          <div className="h-12 w-12 rounded-[10px] bg-white border-4 border-slate-50 flex items-center justify-center shadow-premium group">
            <div className={cn("h-4 w-4 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-125", project.progress === 100 ? "bg-emerald-500 shadow-emerald-200" : "bg-primary shadow-primary/20")} />
          </div>
        </div>

        <div className="w-full md:w-[42%] ml-16 md:ml-0">
          <Card className="premium-card rounded-[10px] group border border-slate-100/50 shadow-premium hover:shadow-2xl transition-all duration-700 relative overflow-hidden bg-white/60 backdrop-blur-xl">
            <div className={cn(
              "absolute top-0 bottom-0 w-1.5 transition-all duration-500 group-hover:w-2.5",
              isEven ? "right-0" : "left-0",
              project.color?.replace('bg-', 'bg-') || 'bg-primary'
            )} />
            <CardContent className={cn("p-6 space-y-5", isEven ? "pr-8" : "pl-8")}>
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                     <Briefcase className="h-3 w-3" /> {project.client_name}
                   </p>
                   <Link href={`/projects/${project.id}`}>
                     <h4 className="font-black text-xl tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">{project.project_name}</h4>
                   </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 text-slate-400 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-[10px] bg-white border border-slate-100 shadow-xl p-2 z-[100]">
                    <DropdownMenuItem className="text-rose-600 font-bold gap-3 rounded-xl m-1 py-3 cursor-pointer focus:bg-rose-50" onClick={() => onArchive(project)}>
                      <Archive className="h-4 w-4" /> Decommission
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{project.deadline || 'TBD'}</span>
                </div>
                <Badge variant="outline" className={cn("text-[9px] uppercase font-black px-3 py-1.5 rounded-xl border-none", project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary')}>
                  {project.status?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><Zap className={cn("h-3 w-3", project.color?.replace('bg-', 'text-') || 'text-amber-500')} /> Progression</span>
                  <span className="text-slate-800">{project.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                   <div className={cn("h-full transition-all duration-1000 shadow-md", project.color || "bg-primary")} style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card className="premium-card group border-none shadow-premium rounded-[10px] bg-white/40 backdrop-blur-3xl transition-all duration-500 hover:shadow-2xl">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center">
          <Link 
            href={`/projects/${project.id}`} 
            className="px-6 py-5 md:w-[35%] flex flex-col gap-3 relative group-hover:bg-white/40 transition-all rounded-l-[15px]"
          >
            <div className={cn("absolute left-0 top-0 bottom-0 w-2 transition-all group-hover:w-3", project.color?.replace('bg-', 'bg-') || 'bg-primary')} />
            <div className="flex items-center gap-4">
              <h3 className="font-black text-xl tracking-tight text-slate-900 group-hover:text-primary transition-colors truncate">
                {project.project_name}
              </h3>
              <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 text-primary">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-normal">
              <Briefcase className="h-3.5 w-3.5" />
              {project.client_name}
            </div>
          </Link>

          <div className="flex-1 px-8 py-5 md:py-0 border-y md:border-y-0 md:border-x border-slate-100/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-normal">Efficiency index</span>
                  </div>
                  <span className="text-xl font-black text-primary">{project.progress || 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div className={cn("h-full transition-all duration-1000 shadow-md", project.color?.replace('bg-', 'bg-') || 'bg-primary')} style={{ width: `${project.progress || 0}%` }} />
                </div>
              </div>
              
              <div className="hidden sm:flex flex-col gap-2 pl-10 border-l border-slate-100/50">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-normal">Operational Stage</span>
                <Badge className="w-fit text-[10px] font-black uppercase bg-slate-900 text-white border-none py-1.5 px-4 rounded-xl">
                  {project.status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 md:w-[30%] flex items-center justify-between gap-8 bg-slate-50/20 rounded-r-[15px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-center">
              <div className="flex flex-col space-y-2">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-normal">Deadline</span>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="text-sm font-black text-slate-900 truncate">{project.deadline || 'TBD'}</span>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col space-y-2">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-normal">Assigned crew</span>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-white shadow-xl ring-1 ring-slate-100 transition-transform hover:scale-125 hover:z-20 cursor-pointer shrink-0">
                      <AvatarImage src={`https://picsum.photos/seed/${project.id+i}/100/100`} />
                      <AvatarFallback className="text-[8px] font-black bg-primary text-white">U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-[10px] hover:bg-white text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[10px] w-64 bg-white border border-slate-100 p-2 shadow-2xl z-[100]">
                  <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 px-5 py-4">Options</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="rounded-xl m-1 py-3.5 font-bold cursor-pointer transition-all">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-4">
                      <ExternalLink className="h-4 w-4 text-primary" /> View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-100/50 my-1 mx-2" />
                  <DropdownMenuItem className="rounded-xl m-1 py-3.5 font-bold cursor-pointer text-rose-600 focus:bg-rose-50" onClick={() => onArchive(project)}>
                    <Archive className="h-4 w-4" /> Archive Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

