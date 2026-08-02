"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

export function GlobalPageHeader() {
  const pathname = usePathname();
  
  if (!pathname) return null;

  let title = "";
  let description = "";

  if (pathname.includes('/shots/review')) {
    title = "Approved Shot List";
  } else if (pathname.includes('/shots')) {
    title = "Shot List";
  } else if (pathname.includes('/scenes/review')) {
    title = "Approved Scenes";
  } else if (pathname.includes('/scenes')) {
    title = "Production Scenes";
  } else if (pathname.includes('/characters')) {
    title = "Character Manager";
    description = "Manage and generate digital actors for this project.";
  } else if (pathname.includes('/locations')) {
    title = "Location Manager";
    description = "Manage and generate production locations.";
  } else if (pathname.includes('/visual-bible')) {
    title = "Visual Bible";
  } else if (pathname.includes('/prompts')) {
    title = "Generation Studio";
  } else if (pathname.includes('/intelligence')) {
    title = "Master Identity Graph";
  } else if (pathname.endsWith('/assets')) {
    title = "Project Assets";
  } else {
    // Return null for project root dashboard
    return null;
  }

  return (
    <div className="px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10 sticky top-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
    </div>
  );
}
