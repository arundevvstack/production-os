"use client";

import React, { use } from "react";
import { ProfileDetailView } from "@/components/profile/profile-detail-view";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ProfileDetailPage({ params }: PageProps) {
  // Safe resolution for Next.js async params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Dossier Workspace</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Operational Identity Profiles</p>
        </div>
      </div>

      <ProfileDetailView id={id} sourceRoute="profile" />
    </div>
  );
}
