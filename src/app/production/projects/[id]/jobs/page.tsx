import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Clock, AlertCircle, PlayCircle, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function JobQueuePage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });

  if (!project) redirect(`/production/projects`);

  const jobs = await prisma.productionAIJob.findMany({
    where: { project_id: params.id },
    include: {
      provider: true,
      scene: true,
      shot: true
    },
    orderBy: { created_at: 'desc' }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Queued': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'Running': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Cancelled': return <XCircle className="h-4 w-4 text-slate-400" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Queued': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Running': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'Cancelled': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const metrics = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'Running').length,
    queued: jobs.filter(j => j.status === 'Queued').length,
    failed: jobs.filter(j => j.status === 'Failed').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Job Queue</h1>
          <p className="text-slate-500">Monitor and manage AI generation tasks.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 border rounded-lg bg-white">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Running</div>
            <div className="text-2xl font-black text-blue-600">{metrics.running}</div>
          </div>
          <div className="text-center px-4 py-2 border rounded-lg bg-white">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Queued</div>
            <div className="text-2xl font-black text-amber-600">{metrics.queued}</div>
          </div>
          <div className="text-center px-4 py-2 border rounded-lg bg-white">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Failed</div>
            <div className="text-2xl font-black text-red-600">{metrics.failed}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by job ID, model, or status..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-black outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition text-sm font-medium">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Job ID</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Provider / Model</th>
              <th className="px-6 py-4">Asset Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/50 transition cursor-pointer group">
                <td className="px-6 py-4">
                  <Link href={`/production/projects/${project.id}/jobs/${job.id}`} className="block">
                    <span className="font-mono font-medium text-blue-600 hover:underline">{job.id.substring(0, 8)}...</span>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    {job.scene ? `S${job.scene.scene_number.toString().padStart(2, '0')}` : 'General'}
                    {job.shot ? ` - Shot ${job.shot.shot_number}` : ''}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{job.provider.name}</div>
                  <div className="text-xs text-slate-500">{job.model_name}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold uppercase">{job.asset_type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusBg(job.status)}`}>
                    {getStatusIcon(job.status)}
                    {job.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {formatDistanceToNow(job.created_at, { addSuffix: true })}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 border-2 border-dashed m-4 rounded-xl">
                  No AI jobs have been queued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
