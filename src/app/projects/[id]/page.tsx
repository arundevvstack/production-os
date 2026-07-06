"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Image as ImageIcon, Video, AlertTriangle, CheckCircle, BarChart3, Database, FileVideo, Users, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/analytics`);
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (!analytics) return <div className="p-12 text-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Dashboard</h1>
          <p className="text-slate-500">Enterprise Analytics & Production Workspace Overview</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => router.push(`/projects/${projectId}/generation`)}>Generation Studio</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generated Assets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">{analytics.totalJobs} total AI jobs dispatched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{analytics.approvedAssets} approved for final delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.failureRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{analytics.failedJobs} generation failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Generation Time</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgGenTimeSeconds.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Across all multimodal providers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Workspace Modules</CardTitle>
            <CardDescription>Navigate production areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/projects/${projectId}/assets`)}>
               <ImageIcon className="mr-2 h-4 w-4" /> Asset Manager
             </Button>
             <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/projects/${projectId}/reviews`)}>
               <Users className="mr-2 h-4 w-4" /> Human Review Queue
             </Button>
             <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/projects/${projectId}/editing`)}>
               <FileVideo className="mr-2 h-4 w-4" /> Editing Workspace
             </Button>
             <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/projects/${projectId}/delivery`)}>
               <PackageOpen className="mr-2 h-4 w-4" /> Delivery Manager
             </Button>
          </CardContent>
        </Card>

        {/* Provider Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Provider Utilization</CardTitle>
            <CardDescription>Distribution of jobs across AI providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {Object.entries(analytics.providerUsage).map(([provider, count]: [string, any]) => (
                 <div key={provider} className="flex items-center">
                   <div className="w-32 text-sm font-medium">{provider}</div>
                   <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-indigo-500 rounded-full" 
                       style={{ width: `${(count / analytics.totalJobs) * 100}%` }}
                     />
                   </div>
                   <div className="w-12 text-right text-sm text-slate-500">{count}</div>
                 </div>
               ))}
               {Object.keys(analytics.providerUsage).length === 0 && (
                 <div className="text-slate-500 text-sm text-center py-4">No jobs dispatched yet.</div>
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
