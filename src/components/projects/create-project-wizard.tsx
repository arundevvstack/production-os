"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, CheckCircle2, Film, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection, broadcastTableUpdate } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { CONTENT_VERTICALS } from "@/app/(dashboard)/clients/page";
import { ENTERPRISE_TEMPLATES } from "@/lib/enterprise-workflow-templates";
import { Loader2 } from "lucide-react";

const PROJECT_COLORS = [
  'bg-rose-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-purple-500'
];

interface CreateProjectWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    client_name?: string;
    project_type?: string;
    project_name?: string;
    lead_id?: string;
    service_category?: string;
    service?: string;
    budget?: string;
  };
  onSuccess?: (projectId?: string) => void;
}

export function CreateProjectWizard({ isOpen, onOpenChange, defaultValues, onSuccess }: CreateProjectWizardProps) {
  const { profile, companyId } = useTenant();
  
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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

  // Fetch needed data
  const { data: leads } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { company_name: 'asc' }
  });
  const { data: clients } = useSupabaseCollection('Client', {
    where: { company_id: companyId },
    orderBy: { name: 'asc' }
  });
  const { data: companyUsers } = useSupabaseCollection('User', {
    where: { company_id: companyId }
  });

  const combinedClientNames = useMemo(() => {
    const names = new Set<string>();
    leads?.forEach(l => { if (l.company_name) names.add(l.company_name); });
    clients?.forEach(c => { if (c.name) names.add(c.name); });
    return Array.from(names).sort();
  }, [leads, clients]);

  // Apply default values when dialog opens
  useEffect(() => {
    if (isOpen) {
      setWizardStep(1);
      setNewProject(prev => ({
        ...prev,
        client_name: defaultValues?.client_name || "",
        project_type: defaultValues?.project_type || "Normal Production",
        project_name: defaultValues?.project_name || "",
        service_category: defaultValues?.service_category || "",
        service: defaultValues?.service || "",
        budget: defaultValues?.budget || "",
      }));
      setSelectedLeadId(defaultValues?.lead_id || null);
    }
  }, [isOpen, defaultValues]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newProject.project_name || !newProject.client_name) {
      toast({
        variant: "destructive",
        title: "Information Missing",
        description: `Please provide a project name and select a client. ${!newProject.client_name ? "(Client is missing)" : ""}`,
      });
      return;
    }

    setIsSubmitting(true);
    
    // 1. Trigger lead status update to 'won' if imported or passed from CRM
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

      onOpenChange(false);
      broadcastTableUpdate('Project');
      if (onSuccess) onSuccess(data.project?.id || data.id || undefined);
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-2xl border-0 bg-white p-0 overflow-hidden shadow-2xl">
        {/* Wizard Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                New Project
              </DialogTitle>
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Step {wizardStep} of 3</span>
            </div>
            {/* Step indicators */}
            <div className="flex gap-2 items-center">
              {[
                { n: 1, label: "Pipeline" },
                { n: 2, label: "Details" },
                { n: 3, label: "Review" }
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "flex items-center gap-2 flex-1",
                    wizardStep >= s.n ? "opacity-100" : "opacity-40"
                  )}>
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 shrink-0",
                      wizardStep > s.n ? "bg-emerald-400 text-white" :
                      wizardStep === s.n ? "bg-white text-slate-900" :
                      "bg-white/10 text-white"
                    )}>
                      {wizardStep > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", wizardStep === s.n ? "text-white" : "text-white/40")}>{s.label}</span>
                  </div>
                  {i < 2 && <div className={cn("h-px flex-1 transition-all duration-300", wizardStep > s.n ? "bg-emerald-400/60" : "bg-white/10")} />}
                </div>
              ))}
            </div>
          </DialogHeader>
        </div>

        {/* Step 1: Pipeline & Category */}
        {wizardStep === 1 && (
          <div className="p-7 space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Choose Workflow Pipeline</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "AI Production", icon: Sparkles, label: "AI Production", desc: "8 stages · AI-assisted", color: "text-primary", bg: "bg-primary/5 border-primary/20", activeBg: "bg-primary/10 border-primary" },
                  { value: "Hybrid Production", icon: Layers, label: "Hybrid", desc: "6 stages · Mixed workflow", color: "text-amber-500", bg: "bg-amber-50 border-amber-100", activeBg: "bg-amber-50 border-amber-400" },
                  { value: "Normal Production", icon: Film, label: "Standard", desc: "5 stages · Traditional", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", activeBg: "bg-slate-100 border-slate-400" },
                ].map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setNewProject(prev => ({ ...prev, project_type: p.value }))}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-center",
                      newProject.project_type === p.value ? p.activeBg + " shadow-md" : p.bg + " hover:shadow-sm"
                    )}
                  >
                    {newProject.project_type === p.value && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <p.icon className={cn("h-6 w-6", p.color)} />
                    <div>
                      <p className="text-xs font-black text-slate-800">{p.label}</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline stage preview */}
            {newProject.project_type && ENTERPRISE_TEMPLATES[newProject.project_type] && (() => {
              const tmpl = ENTERPRISE_TEMPLATES[newProject.project_type];
              return (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Workspace Preview · {tmpl.stages.length} Stages</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {tmpl.stages.map((stage, i) => (
                      <div key={stage.name} className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-400 shrink-0">{i + 1}</span>
                        <span className="text-xs font-bold text-slate-600 truncate">{stage.name}</span>
                        <span className="text-[9px] text-slate-400 ml-auto shrink-0">{stage.objectives.length}t</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Service Category</Label>
                <Select value={newProject.service_category} onValueChange={(val) => setNewProject({ ...newProject, service_category: val, service: "" })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-slate-200 shadow-xl z-[200]">
                    {CONTENT_VERTICALS.map(v => (
                      <SelectItem key={v.id} value={v.name} className="text-xs font-bold rounded-lg m-0.5">{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Service</Label>
                <Select disabled={!newProject.service_category} value={newProject.service} onValueChange={(val) => setNewProject({ ...newProject, service: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm text-sm">
                    <SelectValue placeholder={newProject.service_category ? "Select service" : "Pick category first"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border border-slate-200 shadow-xl z-[200]">
                    {CONTENT_VERTICALS.find(v => v.name === newProject.service_category)?.services.map(s => (
                      <SelectItem key={s} value={s} className="text-xs font-bold rounded-lg m-0.5">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={() => setWizardStep(2)}
                className="h-11 px-8 gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Project Details */}
        {wizardStep === 2 && (
          <div className="p-7 space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Project Information</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Project Name <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="e.g. Diwali Campaign 2025"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                    className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-800 focus:ring-primary/10"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Client <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Type to search clients, leads, or add a custom name..."
                      value={newProject.client_name}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 250)}
                      onChange={(e) => {
                        const typed = e.target.value;
                        setNewProject(prev => ({ ...prev, client_name: typed }));
                      }}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white shadow-sm font-bold text-sm text-slate-800 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                    />
                    {isClientDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-xl rounded-xl max-h-60 overflow-y-auto z-[200] p-1.5 animate-in fade-in zoom-in-95">
                        {combinedClientNames.filter(n => n.toLowerCase().includes(newProject.client_name.toLowerCase())).length === 0 ? (
                          <div className="px-3 py-4 text-xs font-bold text-slate-400 text-center">
                            Press Enter to use custom name
                          </div>
                        ) : (
                          combinedClientNames.filter(n => n.toLowerCase().includes(newProject.client_name.toLowerCase())).map(name => {
                            const isLead = leads?.some(l => l.company_name === name);
                            const isClient = clients?.some(c => c.name === name);
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  setNewProject(prev => ({ ...prev, client_name: name }));
                                  const lead = leads?.find(l => l.company_name === name);
                                  if (lead) {
                                    setSelectedLeadId(lead.id);
                                    setNewProject(prev => ({
                                      ...prev,
                                      client_name: name,
                                      service_category: lead.service_vertical || prev.service_category,
                                      service: lead.sub_vertical || prev.service,
                                      budget: lead.deal_value ? lead.deal_value.toString() : prev.budget
                                    }));
                                  }
                                  setIsClientDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center justify-between group transition-colors"
                              >
                                <span className="truncate">{name}</span>
                                {isLead && <Badge variant="secondary" className="text-[9px] h-4">CRM Lead</Badge>}
                                {isClient && !isLead && <Badge variant="outline" className="text-[9px] h-4 border-emerald-200 bg-emerald-50 text-emerald-600">Client</Badge>}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Budget (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-black text-slate-800"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Deadline</Label>
                    <Input
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Project Manager (Assignee)</Label>
                  <Select value={newProject.assignee_id} onValueChange={(val) => setNewProject({ ...newProject, assignee_id: val })}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-sm text-slate-800">
                      <SelectValue placeholder="Select Assignee (Optional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white border border-slate-200 shadow-xl z-[200]">
                      <SelectItem value="none" className="text-xs font-bold rounded-lg m-0.5 text-slate-500">Unassigned (Self)</SelectItem>
                      {companyUsers?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id} className="text-xs font-bold rounded-lg m-0.5 text-slate-800">
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="ghost" onClick={() => setWizardStep(1)} className="h-11 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900">
                ← Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!newProject.project_name.trim() || !newProject.client_name.trim()) {
                    toast({ variant: "destructive", title: "Required", description: "Please fill in Project Name and Client." });
                    return;
                  }
                  setWizardStep(3);
                }}
                className="h-11 px-8 gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg"
              >
                Review <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Launch */}
        {wizardStep === 3 && (
          <form onSubmit={handleCreateProject} className="p-7 space-y-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review & Launch</p>
            
            {/* Summary card */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Project Name</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{newProject.project_name}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Client</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{newProject.client_name}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pipeline</p>
                  <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                    {newProject.project_type === "AI Production" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    {newProject.project_type === "Hybrid Production" && <Layers className="h-3.5 w-3.5 text-amber-500" />}
                    {newProject.project_type === "Normal Production" && <Film className="h-3.5 w-3.5 text-slate-500" />}
                    {newProject.project_type}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{newProject.service_category || <span className="text-slate-300">—</span>}</p>
                </div>
                {newProject.budget && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Budget</p>
                    <p className="text-sm font-black text-emerald-600 mt-1">₹{Number(newProject.budget).toLocaleString('en-IN')}</p>
                  </div>
                )}
                {newProject.deadline && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deadline</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{new Date(newProject.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
              
              {/* Workspace that will be auto-created */}
              {ENTERPRISE_TEMPLATES[newProject.project_type] && (() => {
                const tmpl = ENTERPRISE_TEMPLATES[newProject.project_type];
                const totalObjs = tmpl.stages.reduce((acc, s) => acc + s.objectives.length, 0);
                return (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Auto-Created Workspace</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-bold text-slate-600">{tmpl.stages.length} Stages</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-bold text-slate-600">{totalObjs} Objectives</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-xs font-bold text-slate-600">Dependency chains</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => setWizardStep(2)} className="h-11 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900">
                ← Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-8 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/30 active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Launch Project</>}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
