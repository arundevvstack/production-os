"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertTriangle, Layers, DollarSign, Activity, Server, LayoutDashboard } from "lucide-react";

export default function ExecutiveDashboardPage() {
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

  if (isLoading) return <div className="p-12 text-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Aggregating Executive Metrics...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Failed to load dashboard</div>;

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-slate-700 dark:text-slate-300" /> Executive Dashboard
          </h1>
          <p className="text-slate-500">Global Production Overview & Intelligence</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Layers className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProjects}</div>
            <p className="text-xs text-muted-foreground">In production</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running AI Jobs</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.runningJobs}</div>
            <p className="text-xs text-muted-foreground">Across all providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Failures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.failedJobs}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend (Est)</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalSpent}</div>
            <p className="text-xs text-muted-foreground">API Generation costs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Project Health Table */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Project Portfolio</CardTitle>
            <CardDescription>Health and status of all productions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Project Name</th>
                  <th className="px-4 py-3 font-medium text-center">Health Score</th>
                  <th className="px-4 py-3 font-medium text-center">Assets</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.projects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={p.health > 80 ? "text-emerald-500 border-emerald-500" : p.health > 50 ? "text-amber-500 border-amber-500" : "text-red-500 border-red-500"}>
                        {p.health}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{p.assets}</td>
                    <td className="px-4 py-3 text-center">
                      {p.blocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="secondary">Active</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${p.id}/director`)}>Director</Button>
                    </td>
                  </tr>
                ))}
                {data.projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No projects found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Global Provider Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-4 w-4" /> Provider Distribution</CardTitle>
            <CardDescription>Global usage across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {Object.entries(data.providerUsage).map(([provider, count]: [string, any]) => {
                 const total = Object.values(data.providerUsage).reduce((a: any, b: any) => a + b, 0) as number;
                 const percentage = total > 0 ? (count / total) * 100 : 0;
                 return (
                   <div key={provider} className="flex items-center">
                     <div className="w-24 text-sm font-medium">{provider}</div>
                     <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 rounded-full" 
                         style={{ width: `${percentage}%` }}
                       />
                     </div>
                     <div className="w-12 text-right text-xs text-slate-500">{count}</div>
                   </div>
                 );
               })}
               {Object.keys(data.providerUsage).length === 0 && (
                 <div className="text-slate-500 text-sm text-center py-4">No jobs dispatched yet.</div>
               )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
