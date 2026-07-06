"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { updatePromptVersion } from "./actions";
import { useToast } from "@/hooks/use-toast";

export function EditPromptSpecsModal({ version, projectId }: { version: any, projectId: string }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    image_prompt: version.image_prompt || "",
    video_prompt: version.video_prompt || "",
    camera_prompt: version.camera_prompt || "",
    lighting_prompt: version.lighting_prompt || "",
    environment_prompt: version.environment_prompt || "",
    negative_prompt: version.negative_prompt || "",
    aspect_ratio: version.aspect_ratio || "16:9"
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePromptVersion(version.id, projectId, formData);
      toast({ title: "Specs Updated", description: "The prompt specifications have been updated." });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update specs", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-5 py-2.5 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
          Edit Specs
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Master Generation Prompt</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image Prompt</label>
              <textarea name="image_prompt" value={formData.image_prompt} onChange={handleChange} className="w-full h-24 p-3 rounded-md border bg-slate-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motion / Video Prompt</label>
              <textarea name="video_prompt" value={formData.video_prompt} onChange={handleChange} className="w-full h-24 p-3 rounded-md border bg-slate-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Negative Exclusions</label>
              <textarea name="negative_prompt" value={formData.negative_prompt} onChange={handleChange} className="w-full h-24 p-3 rounded-md border bg-rose-50 focus:bg-white text-sm" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Camera Specs</label>
              <textarea name="camera_prompt" value={formData.camera_prompt} onChange={handleChange} className="w-full h-20 p-3 rounded-md border bg-slate-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lighting Specs</label>
              <textarea name="lighting_prompt" value={formData.lighting_prompt} onChange={handleChange} className="w-full h-20 p-3 rounded-md border bg-slate-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Environment Specs</label>
              <textarea name="environment_prompt" value={formData.environment_prompt} onChange={handleChange} className="w-full h-20 p-3 rounded-md border bg-slate-50 focus:bg-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aspect Ratio</label>
              <select name="aspect_ratio" value={formData.aspect_ratio} onChange={handleChange} className="w-full p-3 rounded-md border bg-slate-50 focus:bg-white text-sm">
                <option value="16:9">16:9 Widescreen</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="1:1">1:1 Square</option>
                <option value="21:9">21:9 Cinematic</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setOpen(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
