"use client";

import { useState } from "react";
import { CreateProjectWizard } from "@/components/projects/create-project-wizard";

export function NewProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
      >
        New Project
      </button>
      <CreateProjectWizard 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        onSuccess={() => {
          setIsOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
