"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deserializeShotMetadata, serializeShotMetadata, ShotMetadata } from "@/lib/production/metadata/ShotMetadata";

interface EditShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  shotVersion: any;
  shot: any;
  projectId: string;
  scene?: any;
  visualBible?: any;
}

export function EditShotModal({ isOpen, onClose, shotVersion, shot, projectId, scene, visualBible }: EditShotModalProps) {
  const router = useRouter();
  
  // Hydrate the strongly typed metadata object from the raw Prisma object
  const initialMetadata = deserializeShotMetadata(shotVersion);
  
  // Apply fallbacks for empty fields from inherited context
  if (!initialMetadata.camera.shotType && shot?.shot_type) initialMetadata.camera.shotType = "Medium"; // Or default to Medium
  if (!initialMetadata.camera.lens) initialMetadata.camera.lens = shot?.lens || "35mm";
  if (!initialMetadata.camera.movement) initialMetadata.camera.movement = shot?.movement || "Static";
  if (!initialMetadata.camera.angle) initialMetadata.camera.angle = shot?.camera || "Eye level";
  if (!initialMetadata.camera.composition) initialMetadata.camera.composition = "Rule of Thirds";
  if (!initialMetadata.camera.framing) initialMetadata.camera.framing = "Standard";
  if (!initialMetadata.camera.focus) initialMetadata.camera.focus = "Deep Focus";
  
  if (!initialMetadata.lighting.lighting) initialMetadata.lighting.lighting = shot?.lighting || "Natural";
  if (!initialMetadata.lighting.mood) initialMetadata.lighting.mood = scene?.mood || "";
  
  if (!initialMetadata.references.notes) initialMetadata.references.notes = scene?.notes || "";

  // The local form state is now strictly the ShotMetadata + image url
  const [formData, setFormData] = useState<ShotMetadata & { reference_image_url: string }>({
    ...initialMetadata,
    reference_image_url: shotVersion?.reference_image_url || ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Cinematic shot, ${formData.camera.shotType}, ${formData.camera.angle}, ${formData.camera.lens}, ${formData.blocking.blocking}, ${formData.blocking.action}`;
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

  // Generic change handler for nested ShotMetadata fields
  const handleNestedChange = (category: keyof ShotMetadata, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [field]: value
      }
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Map form names back to ShotMetadata schema
    switch (name) {
      case "shot_type": handleNestedChange('camera', 'shotType', value); break;
      case "camera_angle": handleNestedChange('camera', 'angle', value); break;
      case "lens": handleNestedChange('camera', 'lens', value); break;
      case "camera_height": handleNestedChange('camera', 'height', value); break;
      case "camera_distance": handleNestedChange('camera', 'distance', value); break;
      case "movement": handleNestedChange('camera', 'movement', value); break;
      case "composition": handleNestedChange('camera', 'composition', value); break;
      case "frame_size": handleNestedChange('camera', 'framing', value); break;
      case "focus": handleNestedChange('camera', 'focus', value); break;
      
      case "lighting": handleNestedChange('lighting', 'lighting', value); break;
      case "mood": handleNestedChange('lighting', 'mood', value); break;
      
      case "character_blocking": handleNestedChange('blocking', 'blocking', value); break;
      case "action": handleNestedChange('blocking', 'action', value); break;
      
      case "notes": handleNestedChange('references', 'notes', value); break;
      
      case "reference_image_url": 
        setFormData(prev => ({ ...prev, reference_image_url: value })); 
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Serialize ShotMetadata into the API format payload
      const updatedVersion = {
        ...serializeShotMetadata(formData),
        reference_image_url: formData.reference_image_url
      };

      const res = await fetch(`/api/v1/projects/${projectId}/workflows/shot-list-gen/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId: shot.id, updatedVersion })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      router.refresh(); 
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save edits");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-900">Edit Shot Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="edit-shot-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Shot Type</label>
                <select name="shot_type" value={formData.camera.shotType} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
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
                <select name="camera_angle" value={formData.camera.angle} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
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
                <select name="lens" value={formData.camera.lens} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Camera Height</label>
                <input name="camera_height" value={formData.camera.height} onChange={handleChange} placeholder="e.g. 5ft, Ground level" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Camera Distance</label>
                <input name="camera_distance" value={formData.camera.distance} onChange={handleChange} placeholder="e.g. 10ft" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Movement</label>
                <select name="movement" value={formData.camera.movement} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="Static">Static</option>
                  <option value="Pan">Pan</option>
                  <option value="Tilt">Tilt</option>
                  <option value="Dolly">Dolly</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Tracking">Tracking</option>
                  <option value="Crane">Crane</option>
                  <option value="Handheld">Handheld</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Composition</label>
                <input name="composition" value={formData.camera.composition} onChange={handleChange} placeholder="e.g. Rule of Thirds, Symmetry" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Framing</label>
                <input name="frame_size" value={formData.camera.framing} onChange={handleChange} placeholder="e.g. Full Body, Dirty OTS" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Focus</label>
                <input name="focus" value={formData.camera.focus} onChange={handleChange} placeholder="e.g. Deep Focus, Shallow DOF" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lighting</label>
                <input name="lighting" value={formData.lighting.lighting} onChange={handleChange} placeholder="e.g. Low Key, Natural" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mood</label>
                <input name="mood" value={formData.lighting.mood} onChange={handleChange} placeholder="e.g. Tense, Melancholic, Joyful" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Blocking (Characters/Objects)</label>
                <textarea 
                  name="character_blocking" 
                  value={formData.blocking.blocking} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                  placeholder="Describe character placements..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Action (What happens)</label>
                <textarea 
                  name="action" 
                  value={formData.blocking.action} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                  placeholder="Describe the action in the shot..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Technical Notes</label>
              <textarea 
                name="notes" 
                value={formData.references.notes} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                placeholder="Any special instructions for VFX, Grip, Camera dept..."
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

        <div className="p-6 border-t bg-white flex justify-end gap-3">
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
