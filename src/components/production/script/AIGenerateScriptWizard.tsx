"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface AIGenerateScriptWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: Record<string, string>) => Promise<void>;
}

export function AIGenerateScriptWizard({ open, onOpenChange, onGenerate }: AIGenerateScriptWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    projectType: "",
    objective: "",
    audience: "",
    duration: "",
    language: "English",
    tone: "",
    brandName: "",
    keyMessage: "",
    cta: "",
    referenceStyle: "",
    notes: ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.projectType || !formData.objective) {
      toast({ title: "Validation Error", description: "Project Type and Objective are required.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    try {
      await onGenerate(formData);
      onOpenChange(false);
      toast({ title: "Success", description: "Script generated successfully!" });
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generate Script with AI
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-2">
            <Label>Project Type *</Label>
            <Select onValueChange={(v) => handleChange("projectType", v)} value={formData.projectType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AI Advertisement">AI Advertisement</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Documentary">Documentary</SelectItem>
                <SelectItem value="Fashion Film">Fashion Film</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="Explainer">Explainer</SelectItem>
                <SelectItem value="Product Video">Product Video</SelectItem>
                <SelectItem value="Feature Film">Feature Film</SelectItem>
                <SelectItem value="Short Film">Short Film</SelectItem>
                <SelectItem value="Music Video">Music Video</SelectItem>
                <SelectItem value="Social Media Reel">Social Media Reel</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Script Objective *</Label>
            <Input placeholder="e.g., Increase brand awareness" value={formData.objective} onChange={e => handleChange("objective", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Input placeholder="e.g., Gen Z, Tech Enthusiasts" value={formData.audience} onChange={e => handleChange("audience", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Duration (approx)</Label>
            <Input placeholder="e.g., 60 seconds" value={formData.duration} onChange={e => handleChange("duration", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Input placeholder="English" value={formData.language} onChange={e => handleChange("language", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tone / Vibe</Label>
            <Input placeholder="e.g., Cinematic, upbeat, serious" value={formData.tone} onChange={e => handleChange("tone", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input placeholder="Your brand name" value={formData.brandName} onChange={e => handleChange("brandName", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Call to Action (CTA)</Label>
            <Input placeholder="e.g., Visit website, Buy now" value={formData.cta} onChange={e => handleChange("cta", e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Key Message</Label>
            <Input placeholder="What is the main takeaway?" value={formData.keyMessage} onChange={e => handleChange("keyMessage", e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Reference Style</Label>
            <Input placeholder="e.g., Similar to Apple ads, Wes Anderson style" value={formData.referenceStyle} onChange={e => handleChange("referenceStyle", e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Additional Notes</Label>
            <Textarea placeholder="Any other context for the AI..." value={formData.notes} onChange={e => handleChange("notes", e.target.value)} className="min-h-[80px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isGenerating || !formData.projectType || !formData.objective} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate Script"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
