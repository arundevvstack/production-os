"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Rocket } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newProject, setNewProject] = useState({
    project_name: defaultValues?.project_name || "",
    client_name: defaultValues?.client_name || "",
    project_type: defaultValues?.project_type || "Normal Production",
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.project_name || !newProject.client_name) {
      toast({
        variant: "destructive",
        title: "Information Missing",
        description: "Please provide a project name and client.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/v1/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: newProject.project_name,
          client_name: newProject.client_name,
          project_type: newProject.project_type,
          color: 'bg-emerald-500' // default color
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to initialize project");
      }
      
      toast({
        title: "Project Created",
        description: `${newProject.project_name} has been created successfully.`,
      });

      onOpenChange(false);
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
      <DialogContent className="sm:max-w-[425px] rounded-xl border-0 bg-white dark:bg-slate-900 shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Create Project
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-medium mt-1">Start a new creative production easily.</p>
        </DialogHeader>

        <form onSubmit={handleCreateProject} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Project Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Diwali Campaign"
              value={newProject.project_name}
              onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
              className="h-11 rounded-lg border-border font-bold shadow-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Client Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Acme Corp"
              value={newProject.client_name}
              onChange={(e) => setNewProject({ ...newProject, client_name: e.target.value })}
              className="h-11 rounded-lg border-border font-bold shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Workflow Pipeline</Label>
            <Select 
              value={newProject.project_type} 
              onValueChange={(val) => setNewProject({ ...newProject, project_type: val })}
            >
              <SelectTrigger className="h-11 rounded-lg border-border font-bold shadow-sm text-sm">
                <SelectValue placeholder="Select Pipeline" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="AI Video Production Workflow" className="font-bold">Full AI Pipeline</SelectItem>
                <SelectItem value="AI Production" className="font-bold">AI Production</SelectItem>
                <SelectItem value="Hybrid Production" className="font-bold">Hybrid Production</SelectItem>
                <SelectItem value="Normal Production" className="font-bold">Standard Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-white font-bold"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
