"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Image as ImageIcon, FileText, Wand2, RefreshCw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [brief, setBrief] = useState("");
  const [notes, setNotes] = useState("");
  const [references, setReferences] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchRecentAssets();
    fetchRecentPrompts();
  }, [projectId]);

  // Debounced auto-save
  useEffect(() => {
    if (!project) return;
    
    let currentSavedBrief = "";
    let currentSavedNotes = "";
    let currentSavedRefs = "";
    try {
      const parsed = JSON.parse(project.project_ref || "{}");
      currentSavedBrief = parsed.brief || "";
      currentSavedNotes = parsed.notes || "";
      currentSavedRefs = parsed.references || "";
    } catch(e) {
      currentSavedBrief = project.project_ref || "";
    }
    
    if (currentSavedBrief === brief && currentSavedNotes === notes && currentSavedRefs === references) return;
    
    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/v1/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, notes, references })
        });
        if (res.ok) {
          const updated = await res.json();
          setProject(updated);
        }
      } catch (e) {
        console.error("Failed to save brief");
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [brief, projectId, project]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        
        try {
          const parsed = JSON.parse(data.project_ref || "{}");
          setBrief(parsed.brief || "");
          setNotes(parsed.notes || "");
          setReferences(parsed.references || "");
        } catch(e) {
          setBrief(data.project_ref || "");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentAssets = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets`);
      if (res.ok) {
        const data = await res.json();
        setRecentAssets(data.slice(0, 4)); // Only top 4 recent
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentPrompts = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/prompts`);
      if (res.ok) {
        const data = await res.json();
        setRecentPrompts(data.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!project) return <div className="p-12 text-center text-slate-500">Loading Workspace...</div>;

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-slate-500">Project Workspace</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="icon" onClick={() => { fetchProject(); fetchRecentAssets(); }} title="Sync Workspace">
             <RefreshCw className="w-4 h-4" />
           </Button>
           <Button onClick={() => router.push(`/projects/${projectId}/generation`)}>
             <Sparkles className="mr-2 h-4 w-4" /> Generate
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors" onClick={() => router.push(`/projects/${projectId}/generation`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generation Studio</CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">Create new assets</p>
          </CardContent>
        </Card>

        <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors" onClick={() => router.push(`/projects/${projectId}/assets`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Library</CardTitle>
            <ImageIcon className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">View generated files</p>
          </CardContent>
        </Card>

        <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors" onClick={() => router.push(`/projects/${projectId}/prompts`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompt Library</CardTitle>
            <Wand2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">Saved prompt templates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <Card className="flex flex-col h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Project Information
              </CardTitle>
              <CardDescription>Auto-saves as you type</CardDescription>
            </div>
            {isSaving ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" /> : <Save className="h-4 w-4 text-slate-400" />}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Brief & Requirements</label>
              <textarea 
                className="w-full min-h-[100px] p-3 border rounded-md bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary outline-none resize-y"
                placeholder="Write your project brief here..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Production Notes</label>
              <textarea 
                className="w-full min-h-[100px] p-3 border rounded-md bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary outline-none resize-y"
                placeholder="Add director notes, ideas, or feedback..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">References & Inspiration</label>
              <textarea 
                className="w-full min-h-[100px] p-3 border rounded-md bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary outline-none resize-y"
                placeholder="Paste URLs, mood links, or reference text..."
                value={references}
                onChange={(e) => setReferences(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col h-[500px]">
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Recent Assets</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
            {recentAssets.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {recentAssets.map(asset => {
                  const url = asset.Versions?.[0]?.file_url;
                  if (!url) return null;
                  return (
                    <div key={asset.id} className="relative aspect-square border rounded-md overflow-hidden bg-slate-100 group">
                      <img src={url} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" onClick={() => router.push(`/projects/${projectId}/assets`)}>View Asset</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg h-full m-0 p-12 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-center text-slate-500 space-y-2">
                  <ImageIcon className="h-8 w-8 mx-auto opacity-50" />
                  <p>No assets generated yet.</p>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/generation`)}>Go to Studio</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col flex-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Recent Prompts</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {recentPrompts.length > 0 ? (
              recentPrompts.map(prompt => (
                <div key={prompt.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => router.push(`/projects/${projectId}/prompts`)}>
                  <p className="font-medium text-sm truncate">{prompt.name}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{prompt.parameters?.prompt || "No prompt text"}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-4">
                <p className="text-sm">No saved prompts.</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
