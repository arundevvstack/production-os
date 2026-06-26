"use client";

import React, { useState } from "react";
import { CheckSquare, Square, AlertCircle } from "lucide-react";

export interface ChecklistItemType {
  id: string;
  content: string;
  is_completed: boolean;
  is_required: boolean;
  completed_by?: string;
}

interface ChecklistPanelProps {
  items: ChecklistItemType[];
  onToggleItem: (id: string, isCompleted: boolean) => void;
}

export function ChecklistPanel({ items, onToggleItem }: ChecklistPanelProps) {
  const [localItems, setLocalItems] = useState(items);

  const handleToggle = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setLocalItems(prev => prev.map(item => item.id === id ? { ...item, is_completed: newStatus } : item));
    onToggleItem(id, newStatus);
  };

  if (!localItems || localItems.length === 0) {
    return null;
  }

  const completedCount = localItems.filter(i => i.is_completed).length;

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Stage Checklist</h3>
        <span className="text-xs font-medium bg-white px-2 py-1 rounded border shadow-sm">
          {completedCount} / {localItems.length}
        </span>
      </div>
      <div className="p-2 space-y-1">
        {localItems.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition cursor-pointer ${item.is_completed ? 'opacity-60' : ''}`}
            onClick={() => handleToggle(item.id, item.is_completed)}
          >
            {item.is_completed ? (
              <CheckSquare className="h-5 w-5 text-black" />
            ) : (
              <Square className="h-5 w-5 text-slate-300" />
            )}
            <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
              {item.content}
            </span>
            {item.is_required && (
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertCircle className="h-3 w-3" /> Required
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
