import React from "react";
import { StatusBadge } from "./StatusBadge";
import { Check, MessageSquare, Paperclip, Activity } from "lucide-react";

interface StageHeaderProps {
  title: string;
  status: string;
  progress: number;
  assignedUser?: string;
  dueDate?: Date | null;
  commentsCount?: number;
  attachmentsCount?: number;
  onComplete?: () => void;
  isCompleteLocked?: boolean;
}

export function StageHeader({
  title,
  status,
  progress,
  assignedUser,
  dueDate,
  commentsCount = 0,
  attachmentsCount = 0,
  onComplete,
  isCompleteLocked = false
}: StageHeaderProps) {
  return (
    <div className="border-b pb-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-slate-500 text-sm font-medium mr-4">
            <div className="flex items-center gap-1 hover:text-black cursor-pointer transition">
              <MessageSquare className="h-4 w-4" /> {commentsCount}
            </div>
            <div className="flex items-center gap-1 hover:text-black cursor-pointer transition">
              <Paperclip className="h-4 w-4" /> {attachmentsCount}
            </div>
          </div>

          {onComplete && (
            <button 
              onClick={onComplete}
              disabled={isCompleteLocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isCompleteLocked 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-slate-800'
              }`}
            >
              <Check className="h-4 w-4" />
              Complete Stage
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Progress:</span>
          <div className="w-32 bg-slate-100 rounded-full h-2">
            <div className="bg-black h-2 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-semibold">{progress}%</span>
        </div>
        
        {assignedUser && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Assignee:</span>
            <div className="h-5 w-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-[10px]">
              {assignedUser.charAt(0)}
            </div>
            <span className="font-medium text-slate-700">{assignedUser}</span>
          </div>
        )}

        {dueDate && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Due:</span>
            <span className="font-medium text-slate-700">{new Date(dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
