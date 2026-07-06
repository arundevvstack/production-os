"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Bell, X, Activity } from "lucide-react";
import Link from "next/link";

export function SmartNotifications() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        const jobsRes = await fetch(`/api/v1/projects/${projectId}/jobs`);
        if (!jobsRes.ok) return;
        
        const jobs = await jobsRes.json();
        const newNotifs: any[] = [];
        
        // Find recently completed jobs (completed in the last 60 seconds)
        const recentCompleted = jobs.filter((j: any) => 
          j.status === 'Completed' && 
          j.completed_at && 
          (new Date().getTime() - new Date(j.completed_at).getTime() < 60000)
        );
        
        recentCompleted.slice(0, 3).forEach((job: any) => {
          newNotifs.push({
            id: `completed-${job.id}`,
            type: "success",
            message: `${job.provider_id} Job completed successfully.`,
            icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
            link: `/projects/${projectId}/generation`
          });
        });

        // Find running jobs
        const running = jobs.filter((j: any) => j.status === 'Running');
        if (running.length > 0) {
          newNotifs.push({
            id: 'running-jobs',
            type: "action",
            message: `${running.length} Jobs currently running in Generation Studio.`,
            icon: <Activity className="h-4 w-4 text-blue-500 animate-pulse" />,
            link: `/projects/${projectId}/generation`
          });
        }
        
        // Find failed jobs
        const failed = jobs.filter((j: any) => j.status === 'Failed');
        if (failed.length > 0) {
          newNotifs.push({
            id: 'failed-jobs',
            type: "error",
            message: `${failed.length} Jobs failed to generate.`,
            icon: <AlertCircle className="h-4 w-4 text-rose-500" />,
            link: `/projects/${projectId}/generation`
          });
        }
        
        setNotifications(newNotifs);
      } catch (e) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => clearInterval(timer);
  }, [projectId]);

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80">
      {visibleNotifications.map(n => (
        <div 
          key={n.id} 
          className="bg-white dark:bg-slate-900 border rounded-lg shadow-xl p-3 flex gap-3 items-start animate-in slide-in-from-top-5 hover:border-slate-300 transition-colors cursor-pointer group"
          onClick={() => {
            if (n.link) router.push(n.link);
          }}
        >
          <div className="mt-0.5">{n.icon}</div>
          <div className="flex-1 text-sm font-medium pr-4 group-hover:text-indigo-600 transition-colors">{n.message}</div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setDismissedIds(prev => new Set(prev).add(n.id));
            }} 
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
