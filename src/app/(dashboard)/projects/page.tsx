
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
import { CreateProjectWizard } from "@/components/projects/create-project-wizard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// UnifiedClientSelector not used in dialog (replaced with native input+datalist to avoid Radix FocusScope conflicts)
import { ENTERPRISE_TEMPLATES, DEFAULT_TIMELINE_DAYS } from "@/lib/enterprise-workflow-templates";
import { broadcastTableUpdate } from "@/supabase/hooks/use-collection";

type ViewMode = 'grid' | 'list' | 'timeline' | 'board';

const getProgressColor = (progress: number = 0, type: 'bg' | 'text' = 'bg') => {
  if (progress < 33) return type === 'bg' ? 'bg-destructive' : 'text-destructive';
  if (progress < 66) return type === 'bg' ? 'bg-amber-500' : 'text-amber-500';
  return type === 'bg' ? 'bg-emerald-500' : 'text-emerald-500';
};


const PROJECT_COLORS = [
  'bg-accent',
  'bg-accent',
  'bg-emerald-500',
  'bg-accent',
  'bg-accent',
  'bg-accent'
];

export default function ProjectsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<any>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("None");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Form State
  const [newProject, setNewProject] = useState({
    project_name: "",
    client_name: "",
    budget: "",
    deadline: "",
    service_category: "",
    service: "",
    project_type: "Normal Production",
    assignee_id: "none"
  });

  // Fetch Projects from Supabase
  const { data: projects, isLoading: isProjectsLoading, refetch: reloadProjects } = useSupabaseCollection('Project', {
    select: '*, ProjectMember(*)',
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' }
  });

  // Fetch Leads for the client dropdown from Supabase
  const { data: leads } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { company_name: 'asc' }
  });

  // Fetch actual Clients
  const { data: clients } = useSupabaseCollection('Client', {
    where: { company_id: companyId },
    orderBy: { name: 'asc' }
  });

  // Fetch Users for Assignee Dropdown
  const { data: companyUsers } = useSupabaseCollection('User', {
    where: { company_id: companyId }
  });

  // Combine names for autocomplete
  const combinedClientNames = useMemo(() => {
    const names = new Set<string>();
    leads?.forEach(l => { if (l.company_name) names.add(l.company_name); });
    clients?.forEach(c => { if (c.name) names.add(c.name); });
    return Array.from(names).sort();
  }, [leads, clients]);

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
          assignee_id: newProject.assignee_id === 'none' ? undefined : newProject.assignee_id,
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

      setNewProject({ project_name: "", client_name: "", budget: "", deadline: "", service_category: "", service: "", project_type: "Normal Production", assignee_id: "none" });
      setSelectedTemplate("None");
      setSelectedLeadId(null);
      setWizardStep(1);
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
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">Production <span className="text-gradient">Projects</span></h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Film className="h-4 w-4" /> Global content lifecycle
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input 
              placeholder="Search projects..." 
              className="pl-11 h-12 rounded-[10px] border-white/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl focus:bg-white dark:bg-slate-900 focus:ring-primary/20 transition-all shadow-premium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {profile?.role_id !== 'EMPLOYEE' && (
            <>
              <Button onClick={() => setIsCreateOpen(true)} className="h-12 px-6 gap-3 rounded-[10px] bg-primary hover:bg-primary text-white font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                <Plus className="h-5 w-5" /> New Project
              </Button>
              <CreateProjectWizard isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={reloadProjects} />
            </>
          )}
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-2 rounded-[10px] border border-white/60 dark:border-slate-700/60 shadow-premium gap-4 mx-2">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-[10px]">
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
                viewMode === mode.id ? "bg-white dark:bg-slate-900 shadow-md text-foreground font-black" : "text-muted-foreground font-bold hover:bg-white/5 dark:bg-slate-900/50 dark:bg-slate-900/50"
              )}
            >
              <mode.icon className="h-4 w-4" /> 
              <span className="text-[10px] uppercase tracking-widest">{mode.label}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 pr-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="h-10 rounded-xl px-4 bg-primary/10 text-foreground border-none font-black text-[10px] uppercase tracking-widest flex gap-2">
              Status: {statusFilter.replace('_', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-5 gap-2 rounded-xl border-border bg-white/5 dark:bg-slate-900/50 dark:bg-slate-900/50 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:bg-slate-900 transition-all">
                <Filter className="h-4 w-4" /> Intelligence Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[10px] w-64 glass-panel border-white/60 dark:border-slate-700/60 p-2">
              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground px-4 py-3">Classification</DropdownMenuLabel>
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
          <div className="flex flex-col items-center justify-center py-32 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-[4rem] border-2 border-dashed border-white/60 dark:border-slate-700/60">
            <div className="h-20 w-20 rounded-[10px] bg-muted flex items-center justify-center mb-6">
              <Archive className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">Zero operational units detected</p>
            <Button variant="link" className="mt-4 text-foreground font-black uppercase tracking-widest text-[10px]" onClick={() => setIsCreateOpen(true)}>Initialize Primary Protocol</Button>
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
                companyUsers={companyUsers}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!projectToArchive} onOpenChange={(open) => !open && setProjectToArchive(null)}>
        <AlertDialogContent className="rounded-[10px] glass-panel border-white/60 dark:border-slate-700/60 p-12">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black tracking-tight text-foreground">Decommission Unit?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-lg leading-relaxed pt-2">
              Proceeding will move <span className="font-black text-foreground">"{projectToArchive?.project_name}"</span> to the high-security archive vault. Primary operations will be suspended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel className="h-12 px-8 rounded-[10px] border-border font-black uppercase tracking-widest text-[10px]">Abort Protocol</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="h-12 px-8 rounded-[10px] bg-accent hover:bg-accent text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20">
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({ project, view, index, onArchive, companyUsers }: { project: any, view: ViewMode, index: number, onArchive: (p: any) => void, companyUsers?: any[] | null }) {
  const isEven = index % 2 === 0;
  const isPilot = project.project_name?.toLowerCase().includes('pilot') || project.project_category?.toLowerCase().includes('pilot') || project.project_type === 'Pilot Production';
  const displayType = project.project_type === 'Pilot Production' ? 'Normal Production' : project.project_type;

  if (view === 'grid') {
    return (
      <Card className="premium-card group border-none shadow-premium rounded-[10px] overflow-hidden transition-all duration-500 hover:-translate-y-2">
        <div className={cn("p-6 flex flex-col gap-6 relative", project.color || 'card-red')}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-1000">
            <Film className="h-20 w-20" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-2">
              <Badge className="h-6 px-3 rounded-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border-none text-[8px] font-black uppercase tracking-[0.05em] text-white">
                {project.status?.replace('_', ' ')}
              </Badge>
              {isPilot && (
                <Badge className="h-6 px-3 rounded-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border-none text-[8px] font-black uppercase tracking-[0.05em] text-white shadow-sm">
                  Pilot
                </Badge>
              )}
              {displayType && (
                <Badge className="h-6 px-3 rounded-full bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 text-[8px] font-black uppercase tracking-[0.05em] text-white">
                  {displayType}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/10 dark:bg-slate-900/10 rounded-[10px] backdrop-blur-xl border border-white/20 dark:border-slate-700/20">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-[10px] bg-white dark:bg-slate-900 border border-border shadow-xl p-2 w-52 z-[100]">
                <DropdownMenuItem asChild className="rounded-xl m-1 py-3 font-bold cursor-pointer">
                  <Link href={`/projects/${project.id}`} className="gap-3">
                    <ExternalLink className="h-4 w-4" /> View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-accent font-bold gap-3 rounded-xl m-1 py-3 cursor-pointer focus:bg-accent/10" onClick={() => onArchive(project)}>
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
        <CardContent className="p-6 space-y-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-normal">Health Index</span>
              <span className="text-lg font-black text-foreground leading-none">{project.progress || 0}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
               <div 
                 className={cn("h-full transition-all duration-1000 shadow-lg", getProgressColor(project.progress || 0, 'bg'))} 
                 style={{ width: `${project.progress || 0}%` }} 
               />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black text-foreground/80 uppercase tracking-wider">{project.deadline || 'TBD'}</span>
            </div>
            <div className="flex -space-x-3">
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-xl ring-1 ring-border">
                <AvatarFallback className="text-[8px] font-black bg-primary text-white">{(project.project_name || 'P').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
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
          <div className="h-12 w-12 rounded-[10px] bg-white dark:bg-slate-900 border-4 border-slate-50 flex items-center justify-center shadow-premium group">
            <div className={cn("h-4 w-4 rounded-full shadow-lg transition-transform duration-500 group-hover:scale-125", project.progress === 100 ? "bg-emerald-500 shadow-emerald-200" : "bg-primary shadow-primary/20")} />
          </div>
        </div>

        <div className="w-full md:w-[42%] ml-16 md:ml-0">
          <Card className="premium-card rounded-[10px] group border border-border/50 shadow-premium hover:shadow-2xl transition-all duration-700 relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
            <div className={cn(
              "absolute top-0 bottom-0 w-1.5 transition-all duration-500 group-hover:w-2.5",
              isEven ? "right-0" : "left-0",
              getProgressColor(project.progress || 0, 'bg')
            )} />
            <CardContent className={cn("p-6 space-y-5", isEven ? "pr-8" : "pl-8")}>
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                     <Briefcase className="h-3 w-3" /> {project.client_name}
                   </p>
                   <Link href={`/projects/${project.id}`}>
                     <h4 className="font-black text-xl tracking-tight text-foreground group-hover:text-foreground transition-colors leading-tight line-clamp-2">{project.project_name}</h4>
                   </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-[10px] bg-white dark:bg-slate-900 border border-border shadow-xl p-2 z-[100]">
                    <DropdownMenuItem className="text-accent font-bold gap-3 rounded-xl m-1 py-3 cursor-pointer focus:bg-accent/10" onClick={() => onArchive(project)}>
                      <Archive className="h-4 w-4" /> Archive Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-xl border border-border">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">{project.deadline || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] uppercase font-black px-3 py-1.5 rounded-xl border-none", project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-foreground')}>
                    {project.status?.replace('_', ' ')}
                  </Badge>
                  {isPilot && (
                    <Badge variant="outline" className="text-[9px] uppercase font-black px-3 py-1.5 rounded-xl border-none text-accent bg-accent/10">
                      Pilot
                    </Badge>
                  )}
                  {displayType && (
                    <Badge variant="outline" className="text-[9px] uppercase font-black px-3 py-1.5 rounded-xl border border-border text-muted-foreground bg-white dark:bg-slate-900">
                      {displayType}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-border">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Zap className={cn("h-3 w-3", project.progress === 100 ? "text-emerald-500" : "text-primary")} /> Progress</span>
                  <span className="text-foreground">{project.progress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                   <div className={cn("h-full transition-all duration-1000 shadow-md", getProgressColor(project.progress || 0, 'bg'))} style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card className="premium-card group border border-white/60 dark:border-slate-700/60 shadow-premium rounded-[15px] bg-white/5 dark:bg-slate-900/50 dark:bg-slate-900/50 backdrop-blur-2xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden relative">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2.5 z-10", getProgressColor(project.progress || 0, 'bg'))} />
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <Link 
            href={`/projects/${project.id}`} 
            className="px-8 py-6 md:w-[35%] flex flex-col justify-center gap-3 relative group-hover:bg-white/40 dark:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <h3 className="font-black text-xl tracking-tight text-foreground group-hover:text-foreground transition-colors truncate">
                {project.project_name}
              </h3>
              <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 text-foreground">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-normal">
              <Briefcase className="h-3.5 w-3.5" />
              {project.client_name || 'Internal / Unassigned'}
            </div>
          </Link>

          <div className="flex-1 px-8 py-6 md:py-0 border-y md:border-y-0 md:border-x border-white/40 dark:border-slate-700/40 bg-white/20 dark:bg-slate-900/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 h-full items-center">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-normal">Progress</span>
                  </div>
                  <span className="text-xl font-black text-foreground">{project.progress || 0}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                  <div className={cn("h-full transition-all duration-1000 shadow-md", getProgressColor(project.progress || 0, 'bg'))} style={{ width: `${project.progress || 0}%` }} />
                </div>
              </div>
              
              <div className="hidden sm:flex flex-col gap-2.5 pl-8 border-l border-white/40 dark:border-slate-700/40 h-full justify-center">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Status & Tags</span>
                <div className="flex flex-wrap gap-2">
                  <Badge className="w-fit text-[10px] font-black uppercase bg-primary text-white border-none py-1.5 px-4 rounded-xl">
                    {project.status?.replace('_', ' ')}
                  </Badge>
                  {isPilot && (
                    <Badge variant="outline" className="w-fit text-[9px] font-black uppercase border-none bg-accent/10 text-accent py-1 px-3 rounded-xl">
                      Pilot
                    </Badge>
                  )}
                  {displayType && (
                    <Badge variant="outline" className="w-fit text-[9px] font-black uppercase border-border text-muted-foreground py-1 px-3 rounded-xl">
                      {displayType}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 md:w-[30%] flex items-center justify-between gap-8 bg-white/30 dark:bg-slate-900/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-center">
              <div className="flex flex-col space-y-1.5">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Target Delivery</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-[13px] font-black text-foreground truncate">{project.deadline || 'TBD'}</span>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col space-y-2">
                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-normal">Assigned crew</span>
                <div className="flex -space-x-3">
                  {project.ProjectMember && project.ProjectMember.length > 0 ? (
                    project.ProjectMember.map((member: any) => {
                      const user = companyUsers?.find(u => u.id === member.user_id);
                      const name = user?.fullName || user?.full_name || user?.email || 'Unknown';
                      return (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-xl ring-1 ring-border transition-transform hover:scale-125 hover:z-20 cursor-pointer shrink-0" title={`${name} (${member.role})`}>
                          <AvatarFallback className="text-[8px] font-black bg-primary text-white">
                            {name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })
                  ) : (
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-xl ring-1 ring-border transition-transform hover:scale-125 hover:z-20 cursor-pointer shrink-0" title="Unassigned">
                      <AvatarFallback className="text-[8px] font-black bg-secondary text-muted-foreground">?</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-[10px] hover:bg-white dark:bg-slate-900 text-muted-foreground hover:text-foreground transition-all shadow-sm">
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[10px] w-64 bg-white dark:bg-slate-900 border border-border p-2 shadow-2xl z-[100]">
                  <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground px-5 py-4">Options</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="rounded-xl m-1 py-3.5 font-bold cursor-pointer transition-all">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-4">
                      <ExternalLink className="h-4 w-4 text-foreground" /> View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-muted/50 my-1 mx-2" />
                  <DropdownMenuItem className="rounded-xl m-1 py-3.5 font-bold cursor-pointer text-accent focus:bg-accent/10" onClick={() => onArchive(project)}>
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

