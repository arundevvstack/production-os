"use client";

import React, { useState } from "react";
import { Edit2 } from "lucide-react";
import { EditShotModal } from "./EditShotModal";

interface EditShotButtonProps {
  shot: any;
  projectId: string;
}

export function EditShotButton({ shot, projectId }: EditShotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const v = shot.Versions?.[0];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
        title="Edit Shot Details"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <EditShotModal 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          shotVersion={v || {}}
          shot={shot}
          projectId={projectId}
        />
      )}
    </>
  );
}
