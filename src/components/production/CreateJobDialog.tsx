"use client";

import React, { useState } from "react";
import { Plus, X, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Provider {
  id: string;
  name: string;
  models: string[];
  types: string[];
}

export function CreateJobDialog({ 
  projectId, 
  sceneId, 
  shotId, 
  promptSetId, 
  providers 
}: { 
  projectId: string;
  sceneId: string;
  shotId: string;
  promptSetId: string;
  providers: Provider[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [assetType, setAssetType] = useState('Image');
  const [providerId, setProviderId] = useState('');
  const [model, setModel] = useState('');
  const [priority, setPriority] = useState('Normal');
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/jobs/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_set_id: promptSetId,
          provider_id: providerId,
          model_name: model,
          asset_type: assetType,
          scene_id: sceneId,
          shot_id: shotId
        })
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
          throw new Error(await res.text());
      }
      if (!contentType.includes("application/json")) {
          throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
      }
      const data = await res.json();
      
      if (data.success && data.assetId) {
        setIsOpen(false);
        router.push(`/projects/${projectId}/assets/${data.assetId}`);
      } else {
        alert("Generation failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("An error occurred during generation");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === providerId);
  const availableModels = selectedProvider?.models || [];
  const availableProviders = providers.filter(p => p.types.includes(assetType));

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-sm"
      >
        <Wand2 className="h-3 w-3" /> Create AI Job
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Create AI Job</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-black transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asset Type</label>
                <select 
                  className="w-full p-2 border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={assetType}
                  onChange={(e) => {
                    setAssetType(e.target.value);
                    setProviderId('');
                    setModel('');
                  }}
                >
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                  <option value="Voice">Voice</option>
                  <option value="Music">Music</option>
                  <option value="Character">Character</option>
                  <option value="Text">Text (Pipeline Test)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Provider</label>
                <select 
                  className="w-full p-2 border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value);
                    setModel('');
                  }}
                  disabled={availableProviders.length === 0}
                >
                  <option value="">Select a provider...</option>
                  {availableProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {availableProviders.length === 0 && <p className="text-xs text-amber-600 mt-1">No providers available for this type.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Model</label>
                <select 
                  className="w-full p-2 border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!providerId}
                >
                  <option value="">Select a model...</option>
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                <div className="flex gap-2">
                  {['Low', 'Normal', 'High'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md border transition ${priority === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t p-4 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 font-medium text-sm text-slate-600 hover:text-black transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={!providerId || !model || isLoading}
                className="px-4 py-2 font-bold text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
              >
                {isLoading ? "Running..." : "Queue Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
