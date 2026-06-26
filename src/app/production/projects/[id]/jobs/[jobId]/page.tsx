import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, PlayCircle, CheckCircle2, AlertCircle, XCircle, ChevronLeft, Calendar, User, Code, FileJson, Laptop } from "lucide-react";
import { format } from "date-fns";

export default async function JobDetailPage({ params }: { params: { id: string, jobId: string } }) {
  const job = await prisma.productionAIJob.findUnique({
    where: { id: params.jobId },
    include: {
      provider: true,
      scene: true,
      shot: true,
      prompt_set: true
    }
  });

  if (!job) redirect(`/production/projects/${params.id}/jobs`);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Queued': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'Running': return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'Completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'Failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'Cancelled': return <XCircle className="h-5 w-5 text-slate-400" />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Queued': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Running': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Completed': return 'bg-green-50 border-green-200 text-green-700';
      case 'Failed': return 'bg-red-50 border-red-200 text-red-700';
      case 'Cancelled': return 'bg-slate-50 border-slate-200 text-slate-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href={`/production/projects/${params.id}/jobs`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-black transition">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Queue
      </Link>

      <div className="flex items-start justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Job Details 
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${getStatusBg(job.status)}`}>
              {getStatusIcon(job.status)}
              {job.status}
            </span>
          </h1>
          <p className="text-slate-500 font-mono text-sm">{job.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Target */}
        <div className="space-y-6">
          <div className="border rounded-xl bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-3 text-sm flex items-center gap-2">
              <Laptop className="h-4 w-4 text-slate-400" /> Execution Context
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Provider</div>
                <div className="font-medium">{job.provider.name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Model</div>
                <div className="font-medium">{job.model_name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Asset Type</div>
                <div className="font-medium">{job.asset_type}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Priority</div>
                <div className="font-medium">{job.priority}</div>
              </div>
              {job.external_job_id && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">External Job ID</div>
                  <div className="font-mono text-xs break-all text-blue-600">{job.external_job_id}</div>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-xl bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-3 text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" /> Timeline
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-blue-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900 text-xs">Job Created</div>
                  </div>
                  <div className="text-slate-500 text-xs">{format(job.created_at, 'MMM d, yyyy HH:mm:ss')}</div>
                </div>
              </div>

              {job.started_at && (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-blue-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-xs">Execution Started</div>
                    </div>
                    <div className="text-slate-500 text-xs">{format(job.started_at, 'MMM d, yyyy HH:mm:ss')}</div>
                  </div>
                </div>
              )}

              {job.completed_at && (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-blue-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900 text-xs">Job Completed</div>
                    </div>
                    <div className="text-slate-500 text-xs">{format(job.completed_at, 'MMM d, yyyy HH:mm:ss')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Prompt & Logs */}
        <div className="md:col-span-2 space-y-6">
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-[300px]">
            <div className="border-b p-4 bg-slate-50 flex items-center gap-2">
              <Code className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-sm">Prompt Snapshot</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-900 text-emerald-400 font-mono text-sm">
              {job.prompt_set ? (
                <pre className="whitespace-pre-wrap">
{JSON.stringify({
  image_prompt: job.prompt_set.image_prompt,
  video_prompt: job.prompt_set.video_prompt,
  character_prompt: job.prompt_set.character_prompt,
  environment_prompt: job.prompt_set.environment_prompt
}, null, 2)}
                </pre>
              ) : (
                <span className="text-slate-500">No prompt snapshot available.</span>
              )}
            </div>
          </div>

          <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col h-[300px]">
            <div className="border-b p-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-slate-400" />
                <h3 className="font-bold text-sm">Execution Logs (JSON)</h3>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50 font-mono text-xs text-slate-700">
              {job.error_message ? (
                <div className="text-red-600 font-bold mb-4">
                  ERROR: {job.error_message}
                </div>
              ) : null}
              {job.metadata ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(job.metadata, null, 2)}</pre>
              ) : (
                <div className="text-slate-400">Waiting for logs...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
