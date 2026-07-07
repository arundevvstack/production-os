"use client";

import React, { useState } from "react";
import { EditSceneModal } from "./EditSceneModal";

interface EditSceneButtonProps {
  scene: any;
  sceneIndex: number;
  projectId: string;
}

export function EditSceneButton({ scene, sceneIndex, projectId }: EditSceneButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2 rounded-lg transition"
      >
        Edit Details
      </button>

      <EditSceneModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scene={scene}
        sceneIndex={sceneIndex}
        projectId={projectId}
      />
    </>
  );
}
