"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Check, Target, Sparkles, Bot, Briefcase, Palette, Video, Calendar, Upload, Settings, FileText, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { generateRequirementScope } from "@/ai/flows/generate-requirements";
import { cn } from "@/lib/utils";

const PRODUCTION_TYPES = [
  { id: "ai", label: "🤖 AI Production" },
  { id: "hybrid", label: "🎥 Hybrid Production (AI + Live Action)" },
  { id: "live", label: "🎬 Live Production" },
  { id: "photo", label: "🎨 Photography" },
  { id: "post", label: "🎭 Post Production Only" },
  { id: "social", label: "📱 Social Media Content" },
  { id: "other", label: "📦 Other" }
];

const DELIVERABLES_PRESETS = [
  "Reel", "Brand Film", "Advertisement", "Corporate Video", "Documentary", "Photography", "Motion Graphics"
];

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:5"];

const FINAL_DELIVERABLES = [
  "Script", "Storyboard", "Final Video", "Source Files", "Social Versions", "Thumbnail", "Voice Over", "Project Files"
];

const SUGGESTIONS = {
  objective: ["Awareness", "Sales", "Lead Gen", "Recruitment", "Product Launch", "Branding", "Education", "Cultural Impact", "Conversion"],
};

function MultiSuggestionInput({ values, onChange, suggestions, placeholder, label, asArray = false }: { values: string | string[], onChange: (v: any) => void, suggestions: string[], placeholder?: string, label?: string, asArray?: boolean }) {
  const [customVal, setCustomVal] = useState("");
  
  const currentArray = asArray 
    ? (Array.isArray(values) ? values : []) 
    : (typeof values === 'string' && values ? values.split(',').map(s => s.trim()).filter(Boolean) : []);

  const handleUpdate = (newArr: string[]) => {
    if (asArray) onChange(newArr);
    else onChange(newArr.join(', '));
  };

  const toggle = (s: string) => {
    if (currentArray.includes(s)) handleUpdate(currentArray.filter(x => x !== s));
    else handleUpdate([...currentArray, s]);
  };

  const addCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customVal.trim() && !currentArray.includes(customVal.trim())) {
      handleUpdate([...currentArray, customVal.trim()]);
    }
    setCustomVal("");
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-2 mb-2">
        {suggestions.map((s: string) => {
          const isSelected = currentArray.includes(s);
          return (
            <Badge key={s} variant={isSelected ? "default" : "outline"} className="cursor-pointer hover:opacity-80 transition-opacity rounded-md py-1 px-3 text-sm" onClick={() => toggle(s)}>
              {s}
            </Badge>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Input value={customVal} onChange={e => setCustomVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom(e)} placeholder={placeholder || "Type custom value and press Enter"} className="rounded-xl" />
        <Button variant="secondary" onClick={addCustom} className="rounded-xl font-bold h-10 px-4">Add</Button>
      </div>
      {currentArray.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          {currentArray.map(s => (
            <Badge key={s} variant="default" className="rounded-md flex items-center gap-1 py-1 px-2">
              {s} <span className="cursor-pointer ml-1 hover:text-red-300" onClick={() => toggle(s)}>&times;</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckboxGroup({ options, selected, onChange }: { options: string[], selected: string[], onChange: (val: string[]) => void }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {options.map(opt => (
        <div key={opt} className="flex items-center space-x-2">
          <Checkbox id={opt} checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
          <label htmlFor={opt} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{opt}</label>
        </div>
      ))}
    </div>
  )
}

interface RequirementChartFormProps {
  prospectId: string;
  companyName: string;
  serviceVertical: string;
  industry: string;
}

export function RequirementChartForm({ prospectId, companyName, serviceVertical, industry }: RequirementChartFormProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [generatingScope, setGeneratingScope] = useState(false);
  
  // WIZARD STATE
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetch(`/api/v1/crm/prospect/${prospectId}/requirement`)
      .then(res => res.json())
      .then((resData) => {
        if (resData.requirement) setData(resData.requirement);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [prospectId]);

  const debouncedSave = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (newData: any) => {
        setSaveStatus("saving");
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          setSaving(true);
          try {
            await fetch(`/api/v1/crm/prospect/${prospectId}/requirement`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newData)
            });
            setLastSaved(new Date());
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          } catch (e) {
            console.error(e);
          } finally {
            setSaving(false);
          }
        }, 1500);
      };
    })(),
    [prospectId]
  );

  const updateField = (category: string, field: string, value: any) => {
    setData((prev: any) => {
      const updated = { ...prev };
      
      if (category === 'root') {
        updated[field] = value;
      } else {
        if (!updated[category]) updated[category] = {};
        updated[category] = { ...updated[category], [field]: value };
      }
      
      // Calculate Completeness
      let score = 0;
      let itemsChecked = 0;
      
      const hasClient = updated.client_details?.client_name || updated.client_details?.company_name;
      if (hasClient) { score += 20; itemsChecked++; }
      
      const hasProject = updated.project_details?.project_name && updated.objective;
      if (hasProject) { score += 20; itemsChecked++; }
      
      const hasDeliverables = updated.deliverables?.length > 0;
      if (hasDeliverables) { score += 20; itemsChecked++; }
      
      const hasDeadline = updated.timeline?.delivery_date;
      if (hasDeadline) { score += 20; itemsChecked++; }
      
      const hasAssets = updated.assets?.reference_links || updated.assets?.brand_guidelines;
      if (hasAssets) { score += 20; itemsChecked++; }
      
      updated.completeness_score = Math.min(100, score);
      updated.items_checked = itemsChecked; 
      
      debouncedSave(updated);
      return updated;
    });
  };

  const handleGenerateScope = async () => {
    setGeneratingScope(true);
    toast({ title: "AI Generating Scope", description: "Analyzing requirements..." });
    try {
      const res = await generateRequirementScope({
        projectType: data?.project_details?.project_category,
        objective: data?.objective,
        budget: data?.project_details?.budget,
        priority: data?.client_details?.priority,
        notes: data?.notes
      });
      updateField('root', 'scope_of_work', res.scope_of_work);
      toast({ title: "Success", description: "Scope generated successfully." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setGeneratingScope(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !data?.project_details?.production_type) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a Production Type to continue." });
      return;
    }
    setActiveStep(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-12 text-center flex flex-col items-center justify-center h-[50vh]"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" /><p className="text-muted-foreground font-medium">Loading AI Intake Form...</p></div>;
  if (!data) return <div>Failed to load requirement chart.</div>;

  const prodType = data.project_details?.production_type || "";

  // Completeness Checks
  const hasClient = !!(data.client_details?.client_name || data.client_details?.company_name);
  const hasProject = !!(data.project_details?.project_name && data.objective);
  const hasDeliverables = !!(data.deliverables?.length > 0);
  const hasDeadline = !!data.timeline?.delivery_date;
  const hasAssets = !!(data.assets?.reference_links || data.assets?.brand_guidelines);

  const steps = [
    { label: "Production Strategy", icon: Target },
    { label: "Core Details", icon: Briefcase },
    { label: "Production Specs", icon: Video },
    { label: "Finalization", icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-8 pb-32 max-w-5xl mx-auto px-4 md:px-8 pt-4">
      {/* Top Header & Completeness (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col justify-center space-y-4 p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Requirement Completeness</h2>
            <span className="text-3xl font-black text-primary drop-shadow-sm">{Math.round(data.completeness_score || 0)}%</span>
          </div>
          <Progress value={data.completeness_score || 0} className="h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-wrap gap-4 pt-2">
            <div className={`flex items-center gap-2 text-sm font-medium ${hasClient ? 'text-emerald-600' : 'text-slate-400'}`}>{hasClient ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} Client</div>
            <div className={`flex items-center gap-2 text-sm font-medium ${hasProject ? 'text-emerald-600' : 'text-slate-400'}`}>{hasProject ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} Project</div>
            <div className={`flex items-center gap-2 text-sm font-medium ${hasDeliverables ? 'text-emerald-600' : 'text-slate-400'}`}>{hasDeliverables ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} Deliverables</div>
            <div className={`flex items-center gap-2 text-sm font-medium ${hasDeadline ? 'text-emerald-600' : 'text-slate-400'}`}>{hasDeadline ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} Deadline</div>
            <div className={`flex items-center gap-2 text-sm font-medium ${hasAssets ? 'text-emerald-600' : 'text-amber-500'}`}>{hasAssets ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} Assets</div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="text-right space-y-1">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Auto-Save Status</h3>
            <p className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              {saveStatus === "saving" && <><Loader2 className="h-4 w-4 animate-spin text-primary" /> Saving...</>}
              {saveStatus === "saved" && <><Check className="h-4 w-4 text-emerald-500" /> Saved</>}
              {saveStatus === "idle" && lastSaved && `Saved at ${lastSaved.toLocaleTimeString()}`}
            </p>
          </div>
          <Button variant="outline" className="rounded-xl font-bold w-full mt-4" onClick={() => toast({ title: "Snapshot Saved", description: "Version locked in history." })}>Save Snapshot</Button>
        </div>
      </div>

      {/* Stepper Navigation Indicator */}
      <div className="flex items-center justify-between px-2 overflow-x-auto gap-4">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isPast = idx < activeStep;
          const Icon = step.icon;
          return (
            <div key={idx} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-sm shrink-0",
                isActive ? "bg-primary text-white scale-110" : isPast ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              )}>
                {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "ml-3 font-semibold text-sm whitespace-nowrap",
                isActive ? "text-slate-800 dark:text-slate-100" : isPast ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
              )}>{step.label}</span>
              {idx < steps.length - 1 && <div className={cn("h-1 w-12 md:w-24 mx-4 rounded-full transition-colors", isPast ? "bg-emerald-200 dark:bg-emerald-900/50" : "bg-slate-100 dark:bg-slate-800")} />}
            </div>
          )
        })}
      </div>

      {/* WIZARD CONTENT AREA */}
      <div className="min-h-[500px]">
        {/* Step 0: Production Strategy */}
        {activeStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="shadow-lg rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="bg-primary/5 p-6 border-b border-primary/10">
                <h3 className="font-bold text-xl flex items-center gap-2 text-primary">Production Strategy</h3>
                <p className="text-muted-foreground text-sm mt-1">What are you producing? Choose one to load relevant sections in Step 3.</p>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRODUCTION_TYPES.map(type => (
                  <div 
                    key={type.id} 
                    onClick={() => updateField('project_details', 'production_type', type.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 font-semibold",
                      prodType === type.id 
                        ? "border-primary bg-primary/5 text-primary shadow-md scale-[1.02]" 
                        : "border-slate-200 dark:border-slate-800 hover:border-primary/30 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {type.label}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 1: Core Details */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 border-r border-slate-100 dark:border-slate-800 md:pr-8">
                  <h4 className="font-bold text-lg border-b pb-2">Client Details</h4>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Client Name</Label><Input value={data.client_details?.client_name || ""} onChange={e => updateField('client_details', 'client_name', e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Contact Person</Label><Input value={data.client_details?.contact_person || ""} onChange={e => updateField('client_details', 'contact_person', e.target.value)} className="rounded-xl" /></div>
                </div>
                <div className="space-y-6">
                  <h4 className="font-bold text-lg border-b pb-2">Project Overview</h4>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Project Name</Label><Input value={data.project_details?.project_name || ""} onChange={e => updateField('project_details', 'project_name', e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Project Type</Label><Input value={data.project_details?.project_type || ""} onChange={e => updateField('project_details', 'project_type', e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Objective</Label>
                    <Select value={data.objective || ""} onValueChange={v => updateField('root', 'objective', v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Objective" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {SUGGESTIONS.objective.map(obj => <SelectItem key={obj} value={obj}>{obj}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="p-8 grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-semibold">Deliverables</Label>
                  <MultiSuggestionInput values={data.deliverables || []} asArray={true} onChange={v => updateField('root', 'deliverables', v)} suggestions={DELIVERABLES_PRESETS} placeholder="Add a deliverable..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Duration</Label>
                    <Select value={data.technical_specs?.duration || ""} onValueChange={v => updateField('technical_specs', 'duration', v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Duration" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="10 seconds">10 seconds</SelectItem>
                        <SelectItem value="15 seconds">15 seconds</SelectItem>
                        <SelectItem value="30 seconds">30 seconds</SelectItem>
                        <SelectItem value="60 seconds">60 seconds</SelectItem>
                        <SelectItem value="90 seconds">90 seconds</SelectItem>
                        <SelectItem value="2 minutes">2 minutes</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Deadline</Label><Input type="date" value={data.timeline?.delivery_date || ""} onChange={e => updateField('timeline', 'delivery_date', e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Aspect Ratio</Label>
                    <Select value={data.technical_specs?.aspect_ratio || ""} onValueChange={v => updateField('technical_specs', 'aspect_ratio', v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {ASPECT_RATIOS.map(ar => <SelectItem key={ar} value={ar}>{ar}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Reference (Link/URL)</Label><Input value={data.assets?.reference_links || ""} onChange={e => updateField('assets', 'reference_links', e.target.value)} className="rounded-xl" placeholder="https://" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Brand Guidelines</Label><Input value={data.assets?.brand_guidelines || ""} onChange={e => updateField('assets', 'brand_guidelines', e.target.value)} className="rounded-xl" placeholder="Link or Text" /></div>
                <div className="space-y-3 md:col-span-2"><Label className="text-muted-foreground font-semibold">Notes</Label><Textarea value={data.notes || ""} onChange={e => updateField('root', 'notes', e.target.value)} className="rounded-xl min-h-[100px]" /></div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-muted-foreground font-semibold">Client Assets</Label>
                  <div onClick={() => document.getElementById('client-assets-upload')?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload Client Assets</p>
                    <p className="text-xs text-slate-400">PDF, PNG, JPG, MP4 up to 50MB</p>
                    <input id="client-assets-upload" type="file" multiple className="hidden" onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        toast({ title: "Files Selected", description: `${files.length} file(s) ready for upload.` });
                      }
                    }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Production Specs (Conditional) */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {prodType === 'ai' && (
              <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2"><h3 className="font-bold text-xl flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI Production Specs</h3></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">AI Style</Label>
                  <Select value={data.creative_requirements?.ai_style || ""} onValueChange={v => updateField('creative_requirements', 'ai_style', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Realistic">Realistic</SelectItem><SelectItem value="Cinematic">Cinematic</SelectItem><SelectItem value="Stylized">Stylized</SelectItem><SelectItem value="Animation">Animation</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Voice Over Required?</Label>
                  <Select value={data.production_requirements?.voice_over_required || "No"} onValueChange={v => updateField('production_requirements', 'voice_over_required', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 md:col-span-2"><Label className="text-muted-foreground font-semibold">AI Assets Required</Label>
                  <CheckboxGroup options={["AI Images", "AI Video", "AI Avatar", "AI Voice", "AI Music", "AI Animation"]} selected={data.production_requirements?.ai_assets || []} onChange={v => updateField('production_requirements', 'ai_assets', v)} />
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Subtitles Required?</Label>
                  <Select value={data.production_requirements?.subtitles || "No"} onValueChange={v => updateField('production_requirements', 'subtitles', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 md:col-span-2"><Label className="text-muted-foreground font-semibold">Prompt Notes</Label><Textarea value={data.creative_requirements?.prompt_notes || ""} onChange={e => updateField('creative_requirements', 'prompt_notes', e.target.value)} className="rounded-xl min-h-[100px]" /></div>
              </Card>
            )}

            {prodType === 'hybrid' && (
              <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2"><h3 className="font-bold text-xl flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Hybrid Production Specs</h3></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Live Shoot Required?</Label>
                  <Select value={data.production_requirements?.live_shoot || "Yes"} onValueChange={v => updateField('production_requirements', 'live_shoot', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Shoot Days</Label><Input type="number" value={data.production_requirements?.shoot_days || ""} onChange={e => updateField('production_requirements', 'shoot_days', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Location</Label><Input value={data.production_requirements?.location || ""} onChange={e => updateField('production_requirements', 'location', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Crew Required</Label>
                  <Select value={data.production_requirements?.crew_size || ""} onValueChange={v => updateField('production_requirements', 'crew_size', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Minimal (1-2)">Minimal (1-2)</SelectItem><SelectItem value="Standard (3-5)">Standard (3-5)</SelectItem><SelectItem value="Full Crew (6+)">Full Crew (6+)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Equipment Required</Label>
                  <Select value={data.production_requirements?.equipment || ""} onValueChange={v => updateField('production_requirements', 'equipment', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Basic">Basic</SelectItem><SelectItem value="Cinema Package">Cinema Package</SelectItem><SelectItem value="Advanced/Specialty">Advanced/Specialty</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 md:col-span-2"><Label className="text-muted-foreground font-semibold">AI Components</Label>
                  <CheckboxGroup options={["AI Video", "AI Cleanup", "AI VFX", "AI Voice", "AI Images"]} selected={data.production_requirements?.ai_components || []} onChange={v => updateField('production_requirements', 'ai_components', v)} />
                </div>
              </Card>
            )}

            {prodType === 'live' && (
              <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2"><h3 className="font-bold text-xl flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Live Production Specs</h3></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Shoot Days</Label><Input type="number" value={data.production_requirements?.shoot_days || ""} onChange={e => updateField('production_requirements', 'shoot_days', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Location</Label><Input value={data.production_requirements?.location || ""} onChange={e => updateField('production_requirements', 'location', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Crew Size</Label><Input value={data.production_requirements?.crew_size || ""} onChange={e => updateField('production_requirements', 'crew_size', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Equipment</Label><Input value={data.production_requirements?.equipment || ""} onChange={e => updateField('production_requirements', 'equipment', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Talent</Label><Input value={data.production_requirements?.talent_requirements || ""} onChange={e => updateField('production_requirements', 'talent_requirements', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Permissions Required</Label><Input value={data.production_requirements?.permissions || ""} onChange={e => updateField('production_requirements', 'permissions', e.target.value)} className="rounded-xl" /></div>
              </Card>
            )}

            {prodType === 'photo' && (
              <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2"><h3 className="font-bold text-xl flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Photography Specs</h3></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Shoot Type</Label>
                  <Select value={data.production_requirements?.shoot_type || ""} onValueChange={v => updateField('production_requirements', 'shoot_type', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Fashion">Fashion</SelectItem><SelectItem value="Product">Product</SelectItem><SelectItem value="Event">Event</SelectItem><SelectItem value="Corporate">Corporate</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Number of Photos</Label><Input type="number" value={data.production_requirements?.number_of_photos || ""} onChange={e => updateField('production_requirements', 'number_of_photos', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Editing Required?</Label>
                  <Select value={data.production_requirements?.editing_required || "Yes"} onValueChange={v => updateField('production_requirements', 'editing_required', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </Card>
            )}

            {prodType === 'post' && (
              <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2"><h3 className="font-bold text-xl flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Post Production Specs</h3></div>
                <div className="space-y-3 md:col-span-2"><Label className="text-muted-foreground font-semibold">Client Footage Upload</Label>
                  <div onClick={() => document.getElementById('client-footage-upload')?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload Footage</p>
                    <input id="client-footage-upload" type="file" multiple accept="video/*" className="hidden" onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        toast({ title: "Footage Selected", description: `${files.length} video(s) ready for upload.` });
                      }
                    }} />
                  </div>
                </div>
                <div className="space-y-3 md:col-span-2"><Label className="text-muted-foreground font-semibold">Editing Style</Label><Input value={data.creative_requirements?.editing_style || ""} onChange={e => updateField('creative_requirements', 'editing_style', e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Motion Graphics?</Label>
                  <Select value={data.production_requirements?.motion_graphics || "No"} onValueChange={v => updateField('production_requirements', 'motion_graphics', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">VFX?</Label>
                  <Select value={data.production_requirements?.vfx || "No"} onValueChange={v => updateField('production_requirements', 'vfx', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-3"><Label className="text-muted-foreground font-semibold">Color Grading?</Label>
                  <Select value={data.production_requirements?.color_grading || "No"} onValueChange={v => updateField('production_requirements', 'color_grading', v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Finalization */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-8">
              <h3 className="font-bold text-xl flex items-center gap-2 mb-6"><FileText className="h-5 w-5 text-primary" /> Deliverables Master List</h3>
              <CheckboxGroup options={FINAL_DELIVERABLES} selected={data.final_deliverables || []} onChange={v => updateField('root', 'final_deliverables', v)} />
            </Card>

            <Card className="shadow-md rounded-3xl border-slate-200/60 dark:border-slate-800 bg-primary/5 overflow-hidden p-8">
              <h3 className="font-bold text-xl flex items-center gap-2 mb-6 text-primary"><Sparkles className="h-5 w-5 text-primary" /> AI Assistant Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10">Generate Proposal</Button>
                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10" onClick={handleGenerateScope} disabled={generatingScope}>
                  {generatingScope ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Generate Scope of Work"}
                </Button>
                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10">Generate Budget</Button>
                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10">Generate Timeline</Button>
                <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10">Generate Task List</Button>
                <Button className="rounded-xl bg-primary text-white">Create Pilot Video</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-200 dark:border-slate-800">
        <Button variant="outline" onClick={handlePrev} disabled={activeStep === 0} className="rounded-xl font-bold px-6 h-12">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={handleNext} disabled={activeStep === 3} className="rounded-xl font-bold px-8 h-12">
          {activeStep === 2 ? "Finalize" : "Next Step"} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

    </div>
  );
}
