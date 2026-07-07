"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Play, RotateCcw, X, Activity, CheckCircle2, AlertCircle, RefreshCw, FolderOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function GenerationStudioPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [jobs, setJobs] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  
  // Job creation state
  const [selectedModel, setSelectedModel] = useState("");
  const [promptText, setPromptText] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(4);
  const [cfg, setCfg] = useState(3.5);
  const [seed, setSeed] = useState("");
  const [isRandomSeed, setIsRandomSeed] = useState(true);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [scheduler, setScheduler] = useState("euler");
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Poll for jobs and gateway models
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/jobs`);
        if (res.ok) setJobs(await res.json());
      } catch (e) {
        console.error("Failed to fetch jobs");
      }
    };
    
    const fetchModels = async () => {
      try {
        const res = await fetch(`/api/v1/gateway-proxy/models`);
        if (res.ok) {
          const data = await res.json();
          // Only show models that are locally cached — uncached models require large
          // downloads that block the gateway's single-threaded uvicorn process
          const cachedModels = data.filter((m: any) => m.cached === true);
          setModels(cachedModels);
          if (cachedModels.length > 0 && !selectedModel) {
            setSelectedModel(cachedModels[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch gateway models");
      }
    };

    fetchModels();
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000); // Live polling
    return () => clearInterval(interval);
  }, [projectId, selectedModel]);

  // Set latest completed job as selected for preview if none selected
  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      const latestCompleted = jobs.find(j => j.status === 'Completed' && j.metadata?.result_url);
      if (latestCompleted) setSelectedJobId(latestCompleted.id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const handleDispatchJob = async () => {
    if (!selectedModel) {
      toast({ title: "Validation Error", description: "Please select a model.", variant: "destructive" });
      return;
    }
    if (!promptText.trim()) {
      toast({ title: "Validation Error", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: "local_gateway",
          asset_type: "Image",
          model_name: selectedModel,
          options: { 
            prompt: promptText,
            negativePrompt: negativePrompt || undefined,
            steps: Number(steps),
            cfg: Number(cfg),
            seed: isRandomSeed ? Math.floor(Math.random() * 2147483647) : (seed ? Number(seed) : undefined),
            width: Number(width),
            height: Number(height),
            batchSize: 1
          } 
        })
      });
      if (res.ok) {
        setPromptText("");
        toast({ title: "Job Dispatched", description: "Your generation job has been queued." });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Dispatch Failed", description: err.error || err.detail?.cause || "Unknown error", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopJob = async (jobId: string) => {
    try {
      await fetch(`/api/v1/projects/${projectId}/jobs/${jobId}/cancel`, { method: "POST" });
      toast({ title: "Job Cancelled", description: "The job has been stopped." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to cancel job", variant: "destructive" });
    }
  };

  const handleRetry = (job: any) => {
    // Options are stored as job.metadata in the DB (passed as `options` to the API)
    const opts = job.metadata || {};
    setPromptText(opts.prompt || "");
    setNegativePrompt(opts.negativePrompt || "");
    setSteps(opts.steps || 4);
    setCfg(opts.cfg || 3.5);
    setWidth(opts.width || 1024);
    setHeight(opts.height || 1024);
    if (opts.scheduler) setScheduler(opts.scheduler);
    if (opts.seed) {
      setSeed(String(opts.seed));
      setIsRandomSeed(false);
    }
    if (job.model_name) setSelectedModel(job.model_name);
    toast({ title: "Settings Loaded", description: `Loaded settings from job ${job.id.substring(0,8)}` });
  };

  const handleReuseLast = () => {
    const lastJob = jobs[0];
    if (lastJob) handleRetry(lastJob);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generation Studio</h1>
          <p className="text-slate-500">Local AI inference pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Job Creation / Prompt Queue */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Generator Settings</CardTitle>
              <Button variant="outline" size="sm" onClick={handleReuseLast} title="Reuse Last Settings">
                <RefreshCw className="h-4 w-4 mr-2" /> Reuse
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {!m.cached && <Badge variant="outline" className="text-[10px]">Cloud</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <textarea 
                  className="w-full p-3 min-h-[100px] border rounded-md bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary outline-none resize-y"
                  placeholder="Describe what you want to generate..." 
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Negative Prompt</label>
                <Input 
                  placeholder="Avoid..." 
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Width</label>
                  <Input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Height</label>
                  <Input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Steps</label>
                  <Input type="number" value={steps} onChange={e => setSteps(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">CFG Scale</label>
                  <Input type="number" step="0.1" value={cfg} onChange={e => setCfg(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Scheduler</label>
                  <Select value={scheduler} onValueChange={setScheduler}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="euler">Euler</SelectItem>
                      <SelectItem value="dpm++_2m_karras">DPM++ 2M Karras</SelectItem>
                      <SelectItem value="lms">LMS</SelectItem>
                      <SelectItem value="ddim">DDIM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-500">Seed</label>
                    <div className="flex items-center gap-1.5">
                      <Checkbox id="randomSeed" checked={isRandomSeed} onCheckedChange={(c: boolean) => setIsRandomSeed(c)} />
                      <label htmlFor="randomSeed" className="text-xs text-slate-500 cursor-pointer">Random</label>
                    </div>
                  </div>
                  <Input placeholder="Seed number" value={seed} onChange={e => { setSeed(e.target.value); setIsRandomSeed(false); }} disabled={isRandomSeed} />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button className="flex-1" onClick={handleDispatchJob} disabled={isLoading}>
                  {isLoading ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
                {isLoading && (
                  <Button variant="outline" className="flex-none" onClick={() => {
                    const runningJob = jobs.find(j => j.status === 'Running' || j.status === 'Pending');
                    if (runningJob) handleStopJob(runningJob.id);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Console & Job Queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview</CardTitle>
              {selectedJob?.metadata?.result_url && (
                <Button variant="outline" size="sm" onClick={() => window.location.href = `/projects/${projectId}/assets`}>
                  <FolderOpen className="h-4 w-4 mr-2" /> Asset Library
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[400px] bg-slate-100 dark:bg-slate-900 rounded-md overflow-hidden relative">
              {selectedJob ? (
                selectedJob.status === 'Running' || selectedJob.status === 'Pending' ? (
                   <div className="flex flex-col items-center justify-center text-slate-500">
                     <Activity className="h-12 w-12 animate-pulse mb-4" />
                     <p>Generating asset...</p>
                   </div>
                ) : selectedJob.metadata?.result_url ? (
                  <img src={selectedJob.metadata.result_url} alt="Preview" className="max-h-[500px] object-contain rounded shadow" />
                ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                    <AlertCircle className="h-10 w-10 mb-2 text-red-500" />
                    Failed to render or no asset found.
                  </div>
                )
              ) : (
                <p className="text-slate-400">No generation selected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Jobs</TabsTrigger>
                  <TabsTrigger value="running">Running</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {jobs.slice(0, 20).map(job => (
                    <JobRow key={job.id} job={job} onSelect={() => setSelectedJobId(job.id)} isSelected={selectedJobId === job.id} onRetry={() => handleRetry(job)} onStop={() => handleStopJob(job.id)} />
                  ))}
                  {jobs.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                      No jobs in the queue.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="running" className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {jobs.filter(j => j.status === 'Running' || j.status === 'Pending').map(job => (
                    <JobRow key={job.id} job={job} onSelect={() => setSelectedJobId(job.id)} isSelected={selectedJobId === job.id} onRetry={() => handleRetry(job)} onStop={() => handleStopJob(job.id)} />
                  ))}
                  {jobs.filter(j => j.status === 'Running' || j.status === 'Pending').length === 0 && (
                    <div className="p-12 text-center text-slate-500">No running jobs.</div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {jobs.filter(j => j.status === 'Completed').map(job => (
                    <JobRow key={job.id} job={job} onSelect={() => setSelectedJobId(job.id)} isSelected={selectedJobId === job.id} onRetry={() => handleRetry(job)} onStop={() => handleStopJob(job.id)} />
                  ))}
                  {jobs.filter(j => j.status === 'Completed').length === 0 && (
                    <div className="p-12 text-center text-slate-500">No completed jobs.</div>
                  )}
                </TabsContent>

                <TabsContent value="failed" className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {jobs.filter(j => j.status === 'Failed').map(job => (
                    <JobRow key={job.id} job={job} onSelect={() => setSelectedJobId(job.id)} isSelected={selectedJobId === job.id} onRetry={() => handleRetry(job)} onStop={() => handleStopJob(job.id)} />
                  ))}
                  {jobs.filter(j => j.status === 'Failed').length === 0 && (
                    <div className="p-12 text-center text-slate-500">No failed jobs.</div>
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

function JobRow({ job, onSelect, isSelected, onRetry, onStop }: { job: any, onSelect: () => void, isSelected: boolean, onRetry: () => void, onStop: () => void }) {
  return (
    <div 
      className={`flex items-center justify-between p-4 border rounded-lg transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'bg-white dark:bg-slate-900 border-slate-200'} shadow-sm`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        {job.status === 'Completed' ? (
          job.metadata?.result_url ? (
            <div className="flex-shrink-0">
              <img src={job.metadata.result_url} alt="Generated Result" className="h-10 w-10 rounded-md object-cover border border-slate-200 shadow-sm" />
            </div>
          ) : <CheckCircle2 className="h-8 w-8 text-green-500" />
        ) : job.status === 'Running' || job.status === 'Pending' ? (
          <div className="flex flex-col items-center justify-center w-10">
             <Activity className="h-6 w-6 text-blue-500 animate-pulse mb-1" />
             {job.progress !== undefined && <Progress value={job.progress} className="h-1 w-full" />}
          </div>
        )
          : job.status === 'Failed' ? <AlertCircle className="h-8 w-8 text-red-500" />
          : <div className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300" />}
        
        <div>
          <p className="font-medium text-sm line-clamp-1">{job.metadata?.prompt || job.metadata?.raw_response?.prompt || 'No Prompt'}</p>
          <p className="text-xs text-slate-500 mt-1">{job.model_name} • {job.id.substring(0,8)}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <Badge variant={
          job.status === 'Completed' ? 'default' :
          job.status === 'Failed' ? 'destructive' :
          job.status === 'Running' || job.status === 'Pending' ? 'secondary' : 'outline'
        }>
          {job.status}
        </Badge>
        
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRetry(); }} title="Retry">
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        {(job.status === 'Running' || job.status === 'Pending') && (
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onStop(); }} title="Stop">
            <X className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
