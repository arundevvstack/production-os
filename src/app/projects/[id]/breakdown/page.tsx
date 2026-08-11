"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { BreakdownManager } from "./BreakdownManager";
import { BreakdownProvider } from "./BreakdownContext";

export default function ProductionBreakdownPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [workflowState, setWorkflowState] = useState<any>(null);
  const [script, setScript] = useState<any>(null);
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchProjectData(),
      fetchWorkflowState()
    ]).finally(() => setIsLoaded(true));
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // Restore original distinct API fetches
      const [projRes, scriptRes, bdRes] = await Promise.all([
        fetch(`/api/v1/projects/${projectId}`),
        fetch(`/api/v1/projects/${projectId}/script`),
        fetch(`/api/v1/projects/${projectId}/breakdown?t=${Date.now()}`)
      ]);

      if (projRes.ok) setProject(await projRes.json());
      if (scriptRes.ok) setScript(await scriptRes.json());
      if (bdRes.ok) {
        const bdData = await bdRes.json();
        setBreakdownData(bdData);
        console.log("[DEBUG] Breakdown Data Fetched: Projects, Script, Characters, Locations, Props, etc.", Object.keys(bdData));
      }
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

  if (!isLoaded) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading Breakdown...</div>;
  }

  // 1. NO SCRIPT AVAILABLE
  // This should ONLY trigger if the script record genuinely does not exist in the database.
  if (!script || script.error || Object.keys(script).length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full bg-white rounded-3xl">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-slate-800">No Script Available</h2>
        <p className="text-slate-500 max-w-md text-sm leading-relaxed">Please upload or generate a script in the script editor first to extract the production breakdown.</p>
      </div>
    );
  }

  // 2. VIEW MODEL MAPPING (Adapter Pattern)
  // Maps the old backend structure to the new Enterprise BreakdownManager without modifying APIs.
  const breakdownViewModel = {
    id: script.id,
    content: script.content,
    Characters: breakdownData?.characters || [],
    Locations: breakdownData?.locations || [],
    Props: breakdownData?.props || [],
    Vehicles: breakdownData?.vehicles || [],
    Costumes: breakdownData?.costumes || [],
    Animals: breakdownData?.animals || [],
    VFXs: breakdownData?.vfxs || [],
    SFXs: breakdownData?.audios || [],
    Makeups: breakdownData?.makeups || [],
    Lightings: breakdownData?.lightings || [],
    Cameras: breakdownData?.cameras || [],
    Continuities: breakdownData?.continuities || []
  };

  const hasItems = 
    breakdownViewModel.Characters.length > 0 || 
    breakdownViewModel.Locations.length > 0 || 
    breakdownViewModel.Props.length > 0 ||
    breakdownViewModel.Vehicles.length > 0 ||
    breakdownViewModel.Costumes.length > 0 ||
    breakdownViewModel.VFXs.length > 0;

  // 3. NO BREAKDOWN ELEMENTS
  // This triggers if a script exists, but AI extraction has not populated any entities yet.
  if (!hasItems) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full bg-white rounded-3xl">
        <h2 className="text-xl font-bold mb-2 text-slate-800">No Breakdown Elements Found</h2>
        <p className="text-slate-500 max-w-md text-sm">Return to the script editor and click "Extract Breakdown" to populate these items.</p>
      </div>
    );
  }

  // 4. RENDER ENTERPRISE WORKSPACE
  return (
    <BreakdownProvider script={breakdownViewModel}>
      <BreakdownManager script={breakdownViewModel} projectId={projectId} />
    </BreakdownProvider>
  );
}
