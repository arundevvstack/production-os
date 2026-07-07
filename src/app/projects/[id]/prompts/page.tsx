"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Copy, Send, Sparkles, Loader2, Save, Star, Download, Upload, Pin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function PromptLibraryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formNegative, setFormNegative] = useState("");
  const [formTags, setFormTags] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // all, favorites, pinned

  useEffect(() => {
    fetchPrompts();
  }, [projectId]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/prompts`);
      if (res.ok) setPrompts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (prompt?: any) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormName(prompt.name);
      setFormPrompt(prompt.parameters?.prompt || "");
      setFormNegative(prompt.parameters?.negativePrompt || "");
      setFormTags(prompt.parameters?.tags?.join(", ") || "");
    } else {
      setEditingPrompt(null);
      setFormName("");
      setFormPrompt("");
      setFormNegative("");
      setFormTags("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrompt.trim()) {
      toast({ title: "Validation Error", description: "Name and Prompt are required.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const body = {
        name: formName,
        category: "General",
        parameters: {
          prompt: formPrompt,
          negativePrompt: formNegative,
          tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
          isFavorite: editingPrompt?.parameters?.isFavorite || false,
          isPinned: editingPrompt?.parameters?.isPinned || false
        }
      };

      const url = editingPrompt 
        ? `/api/v1/projects/${projectId}/prompts/${editingPrompt.id}`
        : `/api/v1/projects/${projectId}/prompts`;
      
      const method = editingPrompt ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast({ title: "Success", description: "Prompt saved." });
        fetchPrompts();
        setIsModalOpen(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/prompts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Prompt removed." });
        fetchPrompts();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (prompt: any) => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${prompt.name} (Copy)`,
          category: prompt.category,
          parameters: prompt.parameters
        })
      });
      if (res.ok) {
        toast({ title: "Duplicated", description: "Prompt copied successfully." });
        fetchPrompts();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Prompt text copied to clipboard." });
  };

  const toggleFlag = async (prompt: any, flag: 'isFavorite' | 'isPinned') => {
    try {
      const updatedParams = { ...prompt.parameters, [flag]: !prompt.parameters?.[flag] };
      const res = await fetch(`/api/v1/projects/${projectId}/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameters: updatedParams })
      });
      if (res.ok) fetchPrompts();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update prompt.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `prompts_export_${projectId}.json`);
    dlAnchorElem.click();
  };

  const handleImport = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          for (const p of imported) {
            await fetch(`/api/v1/projects/${projectId}/prompts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: p.name, category: p.category, parameters: p.parameters })
            });
          }
          fetchPrompts();
          toast({ title: "Import Successful", description: `Imported ${imported.length} prompts.` });
        }
      } catch (err) {
        toast({ title: "Import Failed", description: "Invalid JSON file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  let filteredPrompts = prompts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.parameters?.prompt || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.parameters?.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );
  
  if (filterMode === 'favorites') {
    filteredPrompts = filteredPrompts.filter(p => p.parameters?.isFavorite);
  } else if (filterMode === 'pinned') {
    filteredPrompts = filteredPrompts.filter(p => p.parameters?.isPinned);
  }

  // Sort: Pinned first, then recent
  filteredPrompts.sort((a, b) => {
    if (a.parameters?.isPinned && !b.parameters?.isPinned) return -1;
    if (!a.parameters?.isPinned && b.parameters?.isPinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
          <p className="text-slate-500">Manage and reuse generation templates.</p>
        </div>
        <div className="flex gap-2 items-center">
           <div className="flex rounded-md border bg-white dark:bg-slate-900 overflow-hidden text-sm mr-2">
             <button className={`px-3 py-1.5 ${filterMode === 'all' ? 'bg-slate-100 dark:bg-slate-800 font-medium' : 'text-slate-500'}`} onClick={() => setFilterMode('all')}>All</button>
             <button className={`px-3 py-1.5 ${filterMode === 'pinned' ? 'bg-slate-100 dark:bg-slate-800 font-medium' : 'text-slate-500'}`} onClick={() => setFilterMode('pinned')}>Pinned</button>
             <button className={`px-3 py-1.5 ${filterMode === 'favorites' ? 'bg-slate-100 dark:bg-slate-800 font-medium' : 'text-slate-500'}`} onClick={() => setFilterMode('favorites')}>Favorites</button>
           </div>
           <Input 
             placeholder="Search prompts or tags..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-48 bg-white dark:bg-slate-900"
           />
           <Button variant="outline" onClick={handleExport} title="Export Prompts">
             <Download className="h-4 w-4" />
           </Button>
           <div className="relative">
             <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Import Prompts" />
             <Button variant="outline"><Upload className="h-4 w-4" /></Button>
           </div>
           <Button onClick={() => handleOpenModal()}>
             <Plus className="mr-2 h-4 w-4" /> New
           </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed bg-slate-50 dark:bg-slate-900/50">
          <Sparkles className="h-12 w-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">No Prompts Found</h2>
          <p className="text-slate-500 mb-6">Create a prompt template to reuse across your generations.</p>
          <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4" /> Create Prompt</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
            <Card key={prompt.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg flex justify-between items-start">
                  <span>{prompt.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className={`h-8 w-8 ${prompt.parameters?.isPinned ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`} onClick={() => toggleFlag(prompt, 'isPinned')} title="Pin Prompt">
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className={`h-8 w-8 ${prompt.parameters?.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-amber-500'}`} onClick={() => toggleFlag(prompt, 'isFavorite')} title="Favorite">
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-500" onClick={() => handleCopyToClipboard(prompt.parameters?.prompt || "")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{new Date(prompt.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col space-y-4">
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-3 rounded-md overflow-hidden relative">
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 line-clamp-4">
                    {prompt.parameters?.prompt}
                  </p>
                </div>
                {prompt.parameters?.negativePrompt && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Negative:</span>
                    <p className="text-xs text-rose-500 line-clamp-1">{prompt.parameters.negativePrompt}</p>
                  </div>
                )}
                {prompt.parameters?.tags && prompt.parameters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.parameters.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/generation?promptId=${prompt.id}`)} title="Send to Generation Studio">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(prompt)} title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal(prompt)} title="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(prompt.id)} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Edit Prompt" : "Create Prompt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt Name</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Cinematic Character Portrait" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt Text</label>
              <textarea 
                className="w-full p-3 min-h-[150px] border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none resize-y"
                value={formPrompt}
                onChange={e => setFormPrompt(e.target.value)}
                placeholder="Describe the scene..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Negative Prompt (Optional)</label>
              <Input value={formNegative} onChange={e => setFormNegative(e.target.value)} placeholder="Things to avoid..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Tags (Comma-separated)</label>
              <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="character, portrait, dark..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
