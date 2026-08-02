"use client";

import React, { useState } from "react";
import { Edit2 } from "lucide-react";
import { EditShotModal } from "./EditShotModal";

interface EditShotButtonProps {
  shot: any;
  projectId: string;
  scene?: any;
  visualBible?: any;
}

export function EditShotButton({ shot, projectId, scene, visualBible }: EditShotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentVersion = shot.Versions?.[0] || null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-2 text-sm font-medium"
      >
        <Edit2 className="w-4 h-4" /> Edit Shot
      </button>

      {isOpen && (
        <EditShotModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          shotVersion={currentVersion}
          shot={shot}
          projectId={projectId}
          scene={scene}
          visualBible={visualBible}
        />
      )}
    </>
  );
}
