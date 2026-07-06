"use client";

import React, { useEffect, useState } from "react";
import { Brain, AlertTriangle, AlertCircle, Info, Activity, ShieldAlert, CheckCircle2, ListTodo, Search, Zap, Loader2, Workflow, FolderX, FolderSearch } from "lucide-react";

export default function ProductionIntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch(`/api/v1/projects/${resolvedParams.id}/intelligence`);
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok) {
            throw new Error(await res.text());
        }
        if (!contentType.includes("application/json")) {
            throw new Error(`Expected JSON but received ${contentType}\n${await res.text()}`);
        }
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="font-medium">Analyzing Production Metadata...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <h3 className="font-bold flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Error loading intelligence</h3>
        <p className="text-sm mt-1">{error || "No data received."}</p>
      </div>
    );
  }

  const { healthScore, healthStatus, suggestions, sceneReadiness, jobHealth, assetCoverage, missingItems } = data;

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Needs Attention': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getHealthRing = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-500';
      case 'Good': return 'text-blue-500';
      case 'Needs Attention': return 'text-amber-500';
      case 'Critical': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-indigo-600" />
            Production Intelligence
          </h1>
          <p className="text-slate-500">Live analytical insights and proactive production recommendations.</p>
        </div>
      </div>

      {/* Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Health Score */}
        <div className="border rounded-xl bg-white p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Activity className="h-4 w-4" /> Health Score
          </div>
          <div className={`mt-8 mb-4 text-7xl font-black tracking-tighter ${getHealthRing(healthStatus)}`}>
            {healthScore}
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider ${getHealthColor(healthStatus)}`}>
            {healthStatus}
          </div>
        </div>

        {/* AI Job Health */}
        <div className="border rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            <Zap className="h-4 w-4" /> AI Job Health
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-3xl font-black text-slate-900">{jobHealth.running}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Running</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{jobHealth.queued}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Queued</div>
            </div>
          </div>
          <div className="pt-4 border-t flex items-center justify-between">
            <div className="text-sm font-medium text-slate-600">Failure Rate</div>
            <div className={`text-sm font-bold ${jobHealth.failureRate > 10 ? 'text-red-500' : 'text-green-500'}`}>
              {jobHealth.failureRate}%
            </div>
          </div>
        </div>

        {/* Missing Items Scanner */}
        <div className="border rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            <Search className="h-4 w-4" /> Missing Items Scanner
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FolderX className="h-4 w-4 text-amber-500" /> Missing Prompts
              </div>
              <div className="font-bold">{missingItems.prompts}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FolderSearch className="h-4 w-4 text-blue-500" /> Missing References
              </div>
              <div className="font-bold">{missingItems.ProductionReference}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ListTodo className="h-4 w-4 text-purple-500" /> Empty Asset Placeholders
              </div>
              <div className="font-bold">{missingItems.assetPlaceholders}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Suggestions */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="border-b p-4 bg-slate-50 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-sm">Actionable Suggestions & Blockers</h3>
            <span className="ml-auto bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {suggestions.length}
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
            {suggestions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                No suggestions. Production is perfectly on track.
              </div>
            ) : (
              suggestions.map((suggestion: any) => (
                <div key={suggestion.id} className="p-3 border bg-white rounded-lg shadow-sm flex items-start gap-3">
                  {suggestion.type === 'ERROR' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                  {suggestion.type === 'WARNING' && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
                  {suggestion.type === 'INFO' && <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
                  <div>
                    <div className="text-sm font-medium text-slate-900">{suggestion.message}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border px-1.5 py-0.5 rounded">
                        {suggestion.category}
                      </span>
                      {suggestion.target && (
                        <span className="text-[10px] font-bold text-indigo-600">
                          {suggestion.target}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scene Readiness Analyzer */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="border-b p-4 bg-slate-50 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-blue-500" />
            <h3 className="font-bold text-sm">Scene Readiness Analyzer</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {sceneReadiness.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No scenes found in project.</div>
            ) : (
              sceneReadiness.map((scene: any) => {
                let statusColor = '';
                switch (scene.status) {
                  case 'Ready': statusColor = 'bg-green-50 text-green-700 border-green-200'; break;
                  case 'Almost Ready': statusColor = 'bg-blue-50 text-blue-700 border-blue-200'; break;
                  case 'Planning': statusColor = 'bg-slate-50 text-slate-700 border-slate-200'; break;
                  case 'Blocked': statusColor = 'bg-red-50 text-red-700 border-red-200'; break;
                }

                return (
                  <div key={scene.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-sm">Scene {scene.scene_number}: {scene.title}</div>
                      <div className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${statusColor}`}>
                        {scene.status}
                      </div>
                    </div>
                    {scene.blockers.length > 0 ? (
                      <div className="space-y-1 mt-2 bg-red-50/50 p-2 rounded border border-red-100">
                        <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Blockers</div>
                        {scene.blockers.map((blocker: string, idx: number) => (
                          <div key={idx} className="text-xs text-red-600 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-red-500" /> {blocker}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 flex items-center gap-1.5 mt-2 bg-green-50/50 p-2 rounded border border-green-100">
                        <CheckCircle2 className="h-4 w-4" /> All dependencies met. Ready for generation.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
