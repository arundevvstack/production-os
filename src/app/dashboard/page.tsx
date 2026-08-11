"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Folder, Image as ImageIcon, Activity, Plus, Sparkles, Server, LayoutGrid, Layers, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/v1/dashboard`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950 font-body">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!data) return <div className="p-12 text-center text-red-500 font-body">Failed to load dashboard</div>;

  // Generate a random-looking but deterministic gradient string based on text
  const getGradient = (name: string) => {
    const colors = [
      'from-red-500 to-orange-500',
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-500',
      'from-rose-500 to-red-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-background text-foreground font-body">
      {/* Ambient Glassmorphism Backgrounds */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Studio Dashboard <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Your intelligent production workspace.</p>
          </div>
          <Button onClick={() => router.push('/projects')} className="h-12 px-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 font-bold text-base">
            <Plus className="mr-2 h-5 w-5" /> New Workspace
          </Button>
        </div>

        {/* Premium Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Active Workspaces</CardTitle>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <LayoutGrid className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-slate-900 dark:text-white">{data.totalProjects}</div>
              <p className="text-sm font-medium text-slate-500 mt-1">Total creative projects</p>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Gateway Status</CardTitle>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Server className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-black text-slate-900 dark:text-white">Online</div>
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">Local inference ready</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Generated Assets</CardTitle>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-slate-900 dark:text-white">{data.projects.reduce((acc: number, p: any) => acc + (p.assets || 0), 0)}</div>
              <p className="text-sm font-medium text-slate-500 mt-1">Total media generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight">Recent Projects</h2>
            <Button variant="ghost" className="font-bold text-primary hover:bg-primary/10">View All <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.projects.map((p: any) => (
              <div 
                key={p.id} 
                onClick={() => router.push(`/projects/${p.id}`)}
                className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Thumbnail Header */}
                <div className="w-full h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {p.thumbnailUrl ? (
                    <img 
                      src={p.thumbnailUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getGradient(p.name)} opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 flex items-center justify-center`}>
                      <Folder className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {/* Overlay shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Active
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mb-1">{p.name}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> {p.assets} Assets
                  </p>
                  
                  <div className="mt-auto">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, Math.min(100, p.health))}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.projects.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center p-20 backdrop-blur-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-700/50 rounded-3xl shadow-xl">
              <Folder className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
              <p className="text-slate-500 mb-6 font-medium">Create your first workspace to start generating assets.</p>
              <Button onClick={() => router.push('/projects')} className="h-12 px-8 rounded-full shadow-lg font-bold text-base">
                <Plus className="mr-2 h-5 w-5" /> Create Workspace
              </Button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
