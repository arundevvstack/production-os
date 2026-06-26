import React from "react";
import { Activity } from "lucide-react";

export interface ActivityEvent {
  id: string;
  eventType: string;
  description: string;
  actorName: string;
  created_at: string;
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden p-6">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Activity className="h-5 w-5 text-slate-500" />
        <h3 className="font-bold text-lg">Activity Timeline</h3>
      </div>
      
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {events.map((event, i) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Activity className="h-4 w-4" />
            </div>
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white border p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-slate-900 text-sm">{event.actorName}</div>
                <time className="text-[10px] font-medium text-slate-400">{new Date(event.created_at).toLocaleString()}</time>
              </div>
              <div className="text-sm text-slate-600">{event.description}</div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-10 italic">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
