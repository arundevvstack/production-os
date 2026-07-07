"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User, Sparkles, ImageIcon, Trash2, Edit2, ExternalLink, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function CharacterCard({ char, projectId, onUpdate, onDelete, onGenerate }: {
  char: any; projectId: string;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onGenerate: (char: any, type: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ 
    name: char.name, age: char.age || "", gender: char.gender || "", description: char.description || "", 
    first_appearance: char.first_appearance || "", last_appearance: char.last_appearance || "", 
    relationships: char.relationships || "", importance: char.importance || "" 
  });

  const save = async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    if (res.ok) { onUpdate(char.id, form); setEditing(false); }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Reference image */}
          <div className="flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            {char.reference_image_url ? (
              <img src={char.reference_image_url} alt={char.name} className="w-full h-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-slate-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="h-7 text-sm font-semibold" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="Age" className="h-7 text-xs" />
                  <Input value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} placeholder="Gender" className="h-7 text-xs" />
                </div>
                <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="h-7 text-xs" />
                
                <Input value={form.first_appearance || ""} onChange={e => setForm(p => ({ ...p, first_appearance: e.target.value }))} placeholder="Appearance details..." className="h-7 text-xs" />
                <Input value={form.last_appearance || ""} onChange={e => setForm(p => ({ ...p, last_appearance: e.target.value }))} placeholder="Costume / Clothing..." className="h-7 text-xs" />
                <Input value={form.relationships || ""} onChange={e => setForm(p => ({ ...p, relationships: e.target.value }))} placeholder="Backstory / Background..." className="h-7 text-xs" />
                <Input value={form.importance || ""} onChange={e => setForm(p => ({ ...p, importance: e.target.value }))} placeholder="Negative prompt..." className="h-7 text-xs text-red-500" />
                
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs" onClick={save}><Check className="h-3 w-3 mr-1" />Save</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{char.name}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {char.age && <Badge variant="outline" className="text-[10px]">{char.age}</Badge>}
                      {char.gender && <Badge variant="outline" className="text-[10px]">{char.gender}</Badge>}
                      {char.first_appearance && <Badge variant="secondary" className="text-[10px] truncate max-w-[150px]">Looks: {char.first_appearance}</Badge>}
                      {char.last_appearance && <Badge variant="secondary" className="text-[10px] truncate max-w-[150px]">Costume: {char.last_appearance}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(char.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {char.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{char.description}</p>}
                {char.relationships && <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">Backstory: {char.relationships}</p>}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(char, "Portrait")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Portrait
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(char, "Full Body")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Full Body
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(char, "Expression Sheet")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Expressions
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(char, "Turnaround")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Turnaround
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onGenerate(char, "Reference")}>
                    <Sparkles className="h-3 w-3 mr-1" /> Action Ref
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

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}/characters`)
      .then(r => r.json()).then(d => { setCharacters(d); setLoading(false); });
  }, [projectId]);

  const addCharacter = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`/api/v1/projects/${projectId}/characters`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() })
    });
    if (res.ok) {
      const char = await res.json();
      setCharacters(p => [...p, char]);
      setNewName(""); setShowAdd(false);
    }
  };

  const deleteCharacter = async (id: string) => {
    await fetch(`/api/v1/projects/${projectId}/characters/${id}`, { method: "DELETE" });
    setCharacters(p => p.filter(c => c.id !== id));
  };

  const updateCharacter = (id: string, data: any) => {
    setCharacters(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const generateReference = (char: any, genType: string) => {
    let basePrompt = char.reference_prompt || `${char.name}`;
    if (char.first_appearance) basePrompt += `, Looks: ${char.first_appearance}`;
    if (char.last_appearance) basePrompt += `, Costume: ${char.last_appearance}`;
    if (char.description) basePrompt += `, ${char.description}`;
    
    let prompt = "";
    if (genType === "Portrait") prompt = `Close-up cinematic portrait of ${basePrompt}, photorealistic, detailed face`;
    if (genType === "Full Body") prompt = `Full body cinematic shot of ${basePrompt}, standing, photorealistic`;
    if (genType === "Expression Sheet") prompt = `Character expression sheet for ${basePrompt}, multiple angles and emotions, concept art style`;
    if (genType === "Turnaround") prompt = `Character turnaround sheet of ${basePrompt}, front, side, and back views, neutral lighting, T-pose or A-pose`;
    if (genType === "Reference") prompt = `Action reference shot of ${basePrompt}, dynamic pose, cinematic lighting, film still`;
    
    let url = `/projects/${projectId}/generation?prompt=${encodeURIComponent(prompt)}&type=Character&refId=${char.id}`;
    if (char.importance) url += `&negative=${encodeURIComponent(char.importance)}`;
    
    router.push(url);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading characters...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Character Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Build character profiles and generate photorealistic references.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />New Character
        </Button>
      </div>

      {showAdd && (
        <div className="flex gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <Input autoFocus placeholder="Character name..." value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addCharacter(); if (e.key === "Escape") setShowAdd(false); }} />
          <Button onClick={addCharacter}><Check className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {characters.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">No characters yet.</p>
          <p className="text-xs mt-1">Add characters from the script breakdown or create them manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {characters.map(char => (
            <CharacterCard key={char.id} char={char} projectId={projectId}
              onUpdate={updateCharacter} onDelete={deleteCharacter} onGenerate={generateReference} />
          ))}
        </div>
      )}
    </div>
  );
}
