"use client";

import React, { useEffect, useState } from "react";
import { Terminal, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function GenerationConsole({ projectId, shotId }: { projectId: string, shotId: string }) {
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    try {
      // For this MVP, we will reuse the standard fetch or create a fast polling mechanism.
      // Since we don't have a dedicated API for fetching jobs by shotId yet, we will simulate the feed
      // or we can just fetch the recent jobs for the project and filter.
      // We will create a small endpoint if needed, but for now we'll do an interval refresh of the page or just a basic UI mockup if the API is missing.
      // Actually, we can fetch all jobs for the project and filter client side.
      const res = await fetch(`/api/v1/projects/${projectId}/jobs`);
      if (res.ok) {
        const data = await res.json();
        const shotJobs = data.filter((j: any) => j.shot_id === shotId);
        setJobs(shotJobs);
      }
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [projectId, shotId]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900 sticky top-0">
        <Terminal className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Execution Console</span>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-1">
        {jobs.length === 0 ? (
          <div className="text-slate-600 italic">No execution logs found for this shot.</div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="flex items-start gap-3 hover:bg-slate-900/50 p-1 rounded">
              <span className="text-slate-500 whitespace-nowrap">
                [{format(new Date(job.created_at), 'HH:mm:ss')}]
              </span>
              
              <span className="text-blue-400 whitespace-nowrap">
                JOB_{job.id.substring(0, 8)}
              </span>

              {job.status === 'Completed' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />}
              {job.status === 'Failed' && <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
              {job.status === 'Running' && <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />}
              {job.status === 'Queued' && <Clock className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />}

              <span className={`flex-1 ${
                job.status === 'Completed' ? 'text-green-400' :
                job.status === 'Failed' ? 'text-red-400' :
                job.status === 'Running' ? 'text-blue-400' : 'text-yellow-400'
              }`}>
                {job.status.toUpperCase()} 
                <span className="text-slate-400 ml-2">
                  (Provider: {job.provider?.name || job.provider_id}) - Model: {job.model_name}
                </span>
                {job.error_message && (
                  <span className="block text-red-400 mt-1">Error: {job.error_message}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
