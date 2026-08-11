"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Loader2, Edit2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditProjectDialogProps {
  project: {
    id: string;
    project_name: string;
    client_name?: string;
    project_type?: string;
    aspect_ratio?: string;
  };
}

export function EditProjectDialog({ project }: EditProjectDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    project_name: project.project_name || "",
    client_name: project.client_name || "",
    project_type: project.project_type || "Normal Production",
    aspect_ratio: project.aspect_ratio || "16:9",
  });

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name) {
      toast({
        variant: "destructive",
        title: "Information Missing",
        description: "Please provide a project name.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update project");
      }
      
      toast({
        title: "Project Updated",
        description: "Project details have been updated successfully.",
      });

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Project update error:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl bg-background shadow-sm border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-xl border border-border bg-background shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Project Details
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-medium mt-1">Update the project name and pipeline settings.</p>
        </DialogHeader>

        <form onSubmit={handleUpdateProject} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Project Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Diwali Campaign"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="h-11 rounded-lg border-border font-bold shadow-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Client Name</Label>
            <Input
              placeholder="e.g. Acme Corp"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="h-11 rounded-lg border-border font-bold shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Workflow Pipeline</Label>
            <Select 
              value={formData.project_type} 
              onValueChange={(val) => setFormData({ ...formData, project_type: val })}
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

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Aspect Ratio</Label>
            <Select 
              value={formData.aspect_ratio} 
              onValueChange={(val) => setFormData({ ...formData, aspect_ratio: val })}
            >
              <SelectTrigger className="h-11 rounded-lg border-border font-bold shadow-sm text-sm">
                <SelectValue placeholder="Select Aspect Ratio" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-xl">
                <SelectItem value="16:9" className="font-bold">16:9 (Landscape - standard video)</SelectItem>
                <SelectItem value="9:16" className="font-bold">9:16 (Portrait - shorts/reels)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="font-bold border-border bg-background hover:bg-secondary text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-premium"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
