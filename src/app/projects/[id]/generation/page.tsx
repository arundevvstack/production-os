"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw, X, Activity, Image as ImageIcon, Video, Music, CheckCircle2, AlertCircle } from "lucide-react";

export default function GenerationStudioPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [jobs, setJobs] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  
  // Job creation state
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState("Image");
  const [selectedModel, setSelectedModel] = useState("");
  const [promptText, setPromptText] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  // Poll for jobs and providers
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/jobs`);
        if (res.ok) setJobs(await res.json());
      } catch (e) {
        console.error("Failed to fetch jobs");
      }
    };
    
    const fetchProviders = async () => {
      try {
        const res = await fetch(`/api/v1/providers`);
        if (res.ok) {
          const data = await res.json();
          // Map backend providers to frontend format with models list
          // Hardcoding supported models for the UI drop-down for now since capabilities aren't detailed enough
          const mapped = data.map((p: any) => {
            let models = ["default"];
            if (p.name.toLowerCase().includes('openrouter')) models = ["gpt-4o", "claude-3-5-sonnet"];
            if (p.name.toLowerCase().includes('openai')) models = ["gpt-4o", "dall-e-3", "tts-1"];
            if (p.name.toLowerCase().includes('gemini') || p.name.toLowerCase().includes('google genai')) models = ["gemini-1.5-pro", "gemini-1.5-flash"];
            if (p.name.toLowerCase().includes('runway')) models = ["gen3a-turbo"];
            if (p.name.toLowerCase().includes('luma')) models = ["ray-1-6"];
            if (p.name.toLowerCase().includes('flux')) models = ["flux-pro-1.1", "flux-dev"];
            return { id: p.id, name: p.name, models };
          });
          setProviders(mapped);
        }
      } catch (e) {
        console.error("Failed to fetch providers");
      }
    };

    fetchProviders();
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000); // Live polling
    return () => clearInterval(interval);
  }, [projectId]);

  const handleDispatchJob = async () => {
    if (!selectedProvider || !selectedModel || !promptText) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProvider,
          asset_type: selectedAssetType,
          model_name: selectedModel,
          options: { prompt: promptText } // Or you can pass prompt directly depending on the dispatcher logic, JobDispatcher merges it
        })
      });
      if (res.ok) {
        setPromptText("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generation Studio</h1>
          <p className="text-slate-500">Real-time AI Production Pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Activity className="mr-2 h-4 w-4" /> Cost Monitor</Button>
          <Button variant="default">Batch Generate</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Job Creation / Prompt Queue */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger><SelectValue placeholder="Select Provider" /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                  <SelectContent>
                    {providers.find(p => p.id === selectedProvider)?.models.map((m: string) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Type</label>
                <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                  <SelectTrigger><SelectValue placeholder="Asset Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Audio">Audio / SFX</SelectItem>
                    <SelectItem value="Voice">Voice / TTS</SelectItem>
                    <SelectItem value="Storyboard">Storyboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Override</label>
                <Input 
                  placeholder="Enter prompt..." 
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleDispatchJob} disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" /> Dispatch Generation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Running Jobs:</span>
                <span className="font-medium">{jobs.filter(j => j.status === 'Running').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Queued Jobs:</span>
                <span className="font-medium">{jobs.filter(j => j.status === 'Queued').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Failed Jobs:</span>
                <span className="font-medium text-red-500">{jobs.filter(j => j.status === 'Failed').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Console & Job Queue */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Console</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Jobs</TabsTrigger>
                  <TabsTrigger value="running">Running</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                      <div className="flex items-center gap-4">
                        {job.status === 'Completed' && <CheckCircle2 className="h-8 w-8 text-green-500" />}
                        {job.status === 'Running' && <Activity className="h-8 w-8 text-blue-500 animate-pulse" />}
                        {job.status === 'Failed' && <AlertCircle className="h-8 w-8 text-red-500" />}
                        {job.status === 'Queued' && <div className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300" />}
                        
                        <div>
                          <p className="font-medium">{job.asset_type} Generation</p>
                          <p className="text-xs text-slate-500">{job.model_name} • {job.id.substring(0,8)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          job.status === 'Completed' ? 'default' :
                          job.status === 'Failed' ? 'destructive' :
                          job.status === 'Running' ? 'secondary' : 'outline'
                        }>
                          {job.status}
                        </Badge>
                        {job.status === 'Running' && (
                          <Button size="icon" variant="ghost" title="Cancel">
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        {job.status === 'Failed' && (
                          <Button size="icon" variant="ghost" title="Retry">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                      No jobs in the queue.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
