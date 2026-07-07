"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Folder, Image as ImageIcon, Activity, Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Re-using the dashboard endpoint, but we only care about basic stats
      const res = await fetch(`/api/v1/dashboard`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading Studio...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Failed to load dashboard</div>;

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studio Dashboard</h1>
          <p className="text-slate-500">Welcome to your local AI generation studio.</p>
        </div>
        <Button onClick={() => router.push('/projects')}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Folder className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active Workspaces</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Gateway</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Online</div>
            <p className="text-xs text-muted-foreground">Ready for generation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <ImageIcon className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.projects.reduce((acc: number, p: any) => acc + (p.assets || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">Generated locally</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Jump back into your recent workspaces</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {data.projects.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                  <div className="flex items-center gap-4">
                    <Folder className="h-8 w-8 text-slate-400" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.assets} Assets</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Open</Badge>
                </div>
              ))}
              {data.projects.length === 0 && (
                <div className="p-8 text-center text-slate-500">No projects found. Create one to get started.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Gateway Status</CardTitle>
            <CardDescription>Local GPU Inference</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Activity className="h-16 w-16 text-emerald-500 mx-auto" />
              <div>
                <h3 className="font-medium text-lg">AI Gateway Active</h3>
                <p className="text-sm text-slate-500">Secure connection established.</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/monitor')}>View Live Monitor</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
