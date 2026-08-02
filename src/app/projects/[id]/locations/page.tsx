"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Sparkles, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function LocationCard({ loc, projectId, onUpdate, onDelete, onGenerate }: {
  loc: any; projectId: string;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onGenerate: (loc: any, type: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ 
    name: loc.name, 
    description: loc.description || "", 
    metadata: loc.metadata || {} 
  });
  const [generating, setGenerating] = useState(false);

  // Use a generic generation endpoint or character-like endpoint if we add location generation support
  const generateSheet = async () => {
    toast({ title: "Not implemented", description: "Direct location reference generation API endpoint not connected yet." });
  };

  const save = async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/locations/${loc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    if (res.ok) { onUpdate(loc.id, form); setEditing(false); }
  };

  const updateMetadata = (key: string, value: string) => {
    setForm(p => ({ ...p, metadata: { ...p.metadata, [key]: value } }));
  };

  const m = form.metadata as any;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            {loc.reference_image_url ? (
              <img src={loc.reference_image_url} alt={loc.name} className="w-full h-full object-cover" />
            ) : (
              <MapPin className="h-8 w-8 text-slate-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Location Name" className="h-7 text-sm font-semibold" />
                <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="General Description" className="h-7 text-xs" />
                
                <Input value={m.architecture || ""} onChange={e => updateMetadata("architecture", e.target.value)} placeholder="Architecture (e.g. Gothic, Cyberpunk)..." className="h-7 text-xs" />
                <Input value={m.mood || ""} onChange={e => updateMetadata("mood", e.target.value)} placeholder="Mood (e.g. Gloomy, Vibrant)..." className="h-7 text-xs" />
                <Input value={m.lighting || ""} onChange={e => updateMetadata("lighting", e.target.value)} placeholder="Lighting (e.g. Neon, Cinematic)..." className="h-7 text-xs" />
                <Input value={m.environment || ""} onChange={e => updateMetadata("environment", e.target.value)} placeholder="Environment (e.g. Rainy street, Desert)..." className="h-7 text-xs" />
                <Input value={m.negative_prompt || ""} onChange={e => updateMetadata("negative_prompt", e.target.value)} placeholder="Negative prompt (e.g. modern buildings)..." className="h-7 text-xs text-red-500" />
                
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs" onClick={save}><Check className="h-3 w-3 mr-1" />Save</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{loc.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(loc.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {loc.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{loc.description}</p>}
                
                <div className="mt-2 space-y-1">
                  {(loc.metadata as any)?.architecture && <p className="text-[10px] text-slate-500 truncate"><span className="font-semibold">Architecture:</span> {(loc.metadata as any).architecture}</p>}
                  {(loc.metadata as any)?.mood && <p className="text-[10px] text-slate-500 truncate"><span className="font-semibold">Mood:</span> {(loc.metadata as any).mood}</p>}
                  {(loc.metadata as any)?.lighting && <p className="text-[10px] text-slate-500 truncate"><span className="font-semibold">Lighting:</span> {(loc.metadata as any).lighting}</p>}
                  {(loc.metadata as any)?.environment && <p className="text-[10px] text-slate-500 truncate"><span className="font-semibold">Environment:</span> {(loc.metadata as any).environment}</p>}
                  {(loc.metadata as any)?.negative_prompt && <p className="text-[10px] text-red-400 truncate"><span className="font-semibold">Exclude:</span> {(loc.metadata as any).negative_prompt}</p>}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3 items-center border-t border-slate-100 pt-3">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(loc, "Establishing")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Establishing Shot
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(loc, "Interior")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Interior Detail
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LocationsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}/locations`)
      .then(r => r.json()).then(d => { setLocations(d); setLoading(false); });
  }, [projectId]);

  const addLocation = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`/api/v1/projects/${projectId}/locations`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), projectId })
    });
    if (res.ok) {
      const loc = await res.json();
      setLocations(p => [...p, loc]);
      setNewName(""); setShowAdd(false);
    }
  };

  const deleteLocation = async (id: string) => {
    await fetch(`/api/v1/projects/${projectId}/locations/${id}`, { method: "DELETE" });
    setLocations(p => p.filter(c => c.id !== id));
  };

  const updateLocation = (id: string, data: any) => {
    setLocations(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const generateReference = (loc: any, genType: string) => {
    let basePrompt = loc.name;
    const m = (loc.metadata || {}) as any;
    
    if (loc.description) basePrompt += `, ${loc.description}`;
    if (m.architecture) basePrompt += `, Architecture: ${m.architecture}`;
    if (m.mood) basePrompt += `, Mood: ${m.mood}`;
    if (m.lighting) basePrompt += `, Lighting: ${m.lighting}`;
    if (m.environment) basePrompt += `, Environment: ${m.environment}`;
    
    let prompt = "";
    if (genType === "Establishing") prompt = `Cinematic establishing shot of ${basePrompt}, wide angle, epic, highly detailed`;
    if (genType === "Interior") prompt = `Detailed interior shot of ${basePrompt}, cinematic lighting, photorealistic`;
    
    let url = `/projects/${projectId}/generation?prompt=${encodeURIComponent(prompt)}&type=Location&refId=${loc.id}`;
    if (m.negative_prompt) url += `&negative=${encodeURIComponent(m.negative_prompt)}`;
    
    router.push(url);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading locations...</div>;

  return (
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Location Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Build location profiles and establish cinematic environments.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />New Location
        </Button>
      </div>

      {showAdd && (
        <div className="flex gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <Input autoFocus placeholder="Location name..." value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addLocation(); if (e.key === "Escape") setShowAdd(false); }} />
          <Button onClick={addLocation}><Check className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">No locations yet.</p>
          <p className="text-xs mt-1">Add locations from the script breakdown or create them manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map(loc => (
            <LocationCard key={loc.id} loc={loc} projectId={projectId}
              onUpdate={updateLocation} onDelete={deleteLocation} onGenerate={generateReference} />
          ))}
        </div>
      )}
    </div>
  );
}
