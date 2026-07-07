"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  shotVersion: any;
  shot: any;
  projectId: string;
}

export function EditShotModal({ isOpen, onClose, shotVersion, shot, projectId }: EditShotModalProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    shot_type: shotVersion?.shot_type || "",
    camera_angle: shotVersion?.camera_angle || shot?.camera || "",
    lens: shotVersion?.lens || shot?.lens || "",
    movement: shotVersion?.movement || shot?.movement || "",
    character_blocking: shotVersion?.character_blocking || "",
    reference_image_url: shotVersion?.reference_image_url || ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      // Simulate generation or call an actual generation endpoint
      // We'll use the prompt structure or redirect to generation studio if needed
      // For now, we mock it or set a dummy if we don't have a direct API
      // Wait, there's no shot generation API. Let's redirect to generation studio with the prompt
      const prompt = `Cinematic shot, ${formData.shot_type}, ${formData.camera_angle}, ${formData.lens}, ${formData.character_blocking}`;
      router.push(`/projects/${projectId}/generation?prompt=${encodeURIComponent(prompt)}&type=Shot&refId=${shotVersion?.id || shot?.id}`);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFormData(prev => ({ ...prev, reference_image_url: base64String }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/shot-list-gen/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: shotVersion.id, updatedVersion: formData })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      router.refresh(); // Refresh page data to show new edits
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save edits");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">Edit Shot Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="edit-shot-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Shot Type</label>
                <select
                  name="shot_type" 
                  value={formData.shot_type} 
                  onChange={handleChange as any} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Shot Type</option>
                  <option value="Wide">Wide</option>
                  <option value="Medium">Medium</option>
                  <option value="Close Up">Close Up</option>
                  <option value="Extreme Close Up">Extreme Close Up</option>
                  <option value="Establishing Shot">Establishing Shot</option>
                  <option value="Point of View">Point of View</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Camera Angle</label>
                <select 
                  name="camera_angle" 
                  value={formData.camera_angle} 
                  onChange={handleChange as any} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Camera Angle</option>
                  <option value="Eye level">Eye level</option>
                  <option value="High Angle">High Angle</option>
                  <option value="Low Angle">Low Angle</option>
                  <option value="Top Down">Top Down</option>
                  <option value="Dutch Angle">Dutch Angle</option>
                  <option value="Over the Shoulder">Over the Shoulder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lens</label>
                <select 
                  name="lens" 
                  value={formData.lens} 
                  onChange={handleChange as any} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Lens</option>
                  <option value="14mm">14mm</option>
                  <option value="24mm">24mm</option>
                  <option value="35mm">35mm</option>
                  <option value="50mm">50mm</option>
                  <option value="85mm">85mm</option>
                  <option value="100mm">100mm</option>
                  <option value="200mm">200mm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Movement</label>
                <select 
                  name="movement" 
                  value={formData.movement} 
                  onChange={handleChange as any} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Movement</option>
                  <option value="Static">Static</option>
                  <option value="Pan">Pan</option>
                  <option value="Tilt">Tilt</option>
                  <option value="Dolly">Dolly</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Tracking">Tracking</option>
                  <option value="Crane">Crane</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Blocking / Action</label>
              <textarea 
                name="character_blocking" 
                value={formData.character_blocking} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                placeholder="Describe character actions and movements..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Thumbnail Reference Image URL</label>
              <div className="flex gap-2">
                <input 
                  name="reference_image_url" 
                  value={formData.reference_image_url} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="https://example.com/thumbnail.png"
                />
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg whitespace-nowrap text-sm font-semibold hover:bg-emerald-100 flex items-center gap-2 transition"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate AI Image"}
                </button>
                <div className="relative overflow-hidden inline-block">
                  <button
                    type="button"
                    className="px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg whitespace-nowrap text-sm font-semibold hover:bg-slate-100 flex items-center gap-2 transition"
                  >
                    Upload Image
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            type="button"
            className="px-6 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-200 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="edit-shot-form"
            className="px-6 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
