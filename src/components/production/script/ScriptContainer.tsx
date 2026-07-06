"use client";

import React, { useState } from "react";
import { Loader2, Sparkles, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ScriptEditor } from "./ScriptEditor";
import { ScriptEntryOptions } from "./ScriptEntryOptions";
import { ScriptVersionManager } from "./ScriptVersionManager";
import { AIGenerateScriptWizard } from "./AIGenerateScriptWizard";
import { createScriptVersion, parseUploadedScript, generateScriptWithAI } from "@/app/projects/[id]/script/actions";

interface ScriptContainerProps {
  projectId: string;
  scripts: { id: string; version: number; is_locked: boolean; content: string | null }[];
}

export function ScriptContainer({ projectId, scripts }: ScriptContainerProps) {
  // Sort versions descending to pick latest initially
  const sortedScripts = [...scripts].sort((a, b) => b.version - a.version);
  const [activeScriptId, setActiveScriptId] = useState<string>(sortedScripts[0]?.id || "");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  
  const triggerAnalysis = async (scriptId: string) => {
    setIsAnalyzing(true);
    toast({ title: "Analysis Started", description: "AI is analyzing the script and extracting production breakdown..." });
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/script/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId })
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
          throw new Error(await res.text());
      }
      if (!contentType.includes("application/json")) {
          throw new Error(
              `Expected JSON but received ${contentType}\n${await res.text()}`
          );
      }
      const data = await res.json();
      toast({ title: "Analysis Complete", description: "Production breakdown has been extracted successfully." });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeScript = scripts.find(s => s.id === activeScriptId);

  const handleCreateNew = async () => {
    const newScript = await createScriptVersion(projectId, "<p>New Script</p>");
    setActiveScriptId(newScript.id);
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const parsedHtml = await parseUploadedScript(formData);
    const newScript = await createScriptVersion(projectId, parsedHtml);
    setActiveScriptId(newScript.id);
  };

  const handleGenerate = async (params: Record<string, string>) => {
    const newScript = await generateScriptWithAI(projectId, params);
    setActiveScriptId(newScript.id);
  };

  if (!scripts.length || !activeScript) {
    return (
      <>
        <ScriptEntryOptions 
          onCreateNew={handleCreateNew}
          onUpload={handleUpload}
          onGenerate={() => setIsWizardOpen(true)}
        />
        <AIGenerateScriptWizard 
          open={isWizardOpen} 
          onOpenChange={setIsWizardOpen} 
          onGenerate={handleGenerate} 
        />
      </>
    );
  }

  return (
    <div className="flex flex-col">
      
      <div className="flex items-center justify-between mb-2">
        <ScriptVersionManager 
          projectId={projectId}
          versions={sortedScripts}
          currentVersionId={activeScriptId}
          onVersionSelect={setActiveScriptId}
        />
        <button
          onClick={() => triggerAnalysis(activeScript.id)}
          disabled={isAnalyzing || activeScript.is_locked}
          className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
          {isAnalyzing ? "Analyzing..." : "Extract Breakdown"}
        </button>
      </div>

      <ScriptEditor 
        scriptId={activeScript.id}
        initialContent={activeScript.content || ""}
        isReadOnly={activeScript.is_locked}
      />
    </div>
  );
}
