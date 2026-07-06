"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle, Bell, X } from "lucide-react";

export function SmartNotifications() {
  const params = useParams();
  const projectId = params.id as string;
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;

    // Simulate smart notifications engine
    // In production, this would open a WebSocket or SSE to the /api/v1/projects/[id]/notifications
    const timer = setTimeout(() => {
      setNotifications([
        {
          id: 1,
          type: "action",
          message: "3 Assets Pending Human Review in Asset Manager.",
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />
        },
        {
          id: 2,
          type: "success",
          message: "Luma API Job #104 completed successfully.",
          icon: <CheckCircle className="h-4 w-4 text-emerald-500" />
        }
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [projectId]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {notifications.map(n => (
        <div key={n.id} className="bg-white dark:bg-slate-900 border rounded-lg shadow-lg p-3 flex gap-3 items-start animate-in slide-in-from-bottom-5">
          <div className="mt-0.5">{n.icon}</div>
          <div className="flex-1 text-sm font-medium pr-4">{n.message}</div>
          <button onClick={() => setNotifications(notifications.filter(x => x.id !== n.id))} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
