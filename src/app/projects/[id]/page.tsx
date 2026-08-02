"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ProductionMetrics } from "@/components/production/dashboard/ProductionMetrics";
import { ProductionBrief } from "@/components/production/dashboard/ProductionBrief";
import { WorkflowTimeline } from "@/components/production/dashboard/WorkflowTimeline";
import { AIAssistantPanel } from "@/components/production/dashboard/AIAssistantPanel";
import { RecentActivity } from "@/components/production/dashboard/RecentActivity";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);
  const [workflowState, setWorkflowState] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchProject(),
      fetchRecentAssets(),
      fetchRecentPrompts(),
      fetchWorkflowState()
    ]).finally(() => setIsLoaded(true));
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      if (res.ok) setProject(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentAssets = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/assets`);
      if (res.ok) setRecentAssets(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentPrompts = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/prompts`);
      if (res.ok) setRecentPrompts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkflowState = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/workflow`);
      if (res.ok) setWorkflowState(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBrief = useCallback(async (data: { brief: string; notes: string; references: string }) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setProject(await res.json());
        fetchWorkflowState();
      }
    } catch (e) {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  if (!isLoaded || !project) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading Workspace...</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-8 pb-32 px-8 pt-6 overflow-y-auto">
      <ProductionMetrics project={project} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - 60% (≈ 7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <ProductionBrief project={project} onSave={handleSaveBrief} isSaving={isSaving} />
          <RecentActivity recentAssets={recentAssets} recentPrompts={recentPrompts} projectId={projectId} />
        </div>

        {/* Right Column - 40% (≈ 5 cols) */}
        <div className="lg:col-span-5 space-y-8 sticky top-24">
          <WorkflowTimeline workflowState={workflowState} projectId={projectId} />
          <AIAssistantPanel workflowState={workflowState} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
