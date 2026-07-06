"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: any;
  sceneIndex: number;
  projectId: string;
}

export function EditSceneModal({ isOpen, onClose, scene, sceneIndex, projectId }: EditSceneModalProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: scene?.title || "",
    scene_summary: scene?.scene_summary || "",
    environment_description: scene?.environment_description || "",
    character_placement: scene?.character_placement || "",
    camera_angle: scene?.camera_angle || "",
    lighting_plan: scene?.lighting_plan || ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      const res = await fetch(`/api/v1/projects/${projectId}/workflows/storyboard-gen/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIndex, updatedScene: formData })
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
          <h2 className="text-xl font-bold text-slate-900">Edit Scene Details</h2>
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

          <form id="edit-scene-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Scene Summary</label>
              <textarea 
                name="scene_summary" 
                value={formData.scene_summary} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Environment Description</label>
              <input 
                name="environment_description" 
                value={formData.environment_description} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Character Placement</label>
              <input 
                name="character_placement" 
                value={formData.character_placement} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Camera Angle</label>
                <input 
                  name="camera_angle" 
                  value={formData.camera_angle} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lighting Plan</label>
                <input 
                  name="lighting_plan" 
                  value={formData.lighting_plan} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
            form="edit-scene-form"
            className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
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
