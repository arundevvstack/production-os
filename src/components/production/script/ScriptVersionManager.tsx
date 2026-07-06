"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { duplicateVerifiedScript, verifyScript } from "@/app/projects/[id]/script/actions";
import { Copy, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useState, useEffect } from "react";

interface ScriptVersionManagerProps {
  projectId: string;
  versions: { id: string; version: number; is_locked: boolean; content: string | null }[];
  currentVersionId: string;
  onVersionSelect: (id: string) => void;
}

export function ScriptVersionManager({ projectId, versions, currentVersionId, onVersionSelect }: ScriptVersionManagerProps) {
  const currentScript = versions.find(v => v.id === currentVersionId);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDuplicate = () => {
    if (!currentScript) return;
    startTransition(async () => {
      await duplicateVerifiedScript(projectId, currentScript.content || "");
      // The page will revalidate and we can select the new version, but it happens automatically via SSR props
    });
  };

  const handleVerify = () => {
    if (!currentScript) return;
    startTransition(async () => {
      await verifyScript(currentScript.id, projectId);
    });
  };

  if (!versions.length || !isMounted) return null;

  return (
    <div className="flex items-center justify-between p-4 border rounded-t-2xl bg-slate-50">
      <div className="flex items-center space-x-4">
        <Select value={currentVersionId} onValueChange={onVersionSelect}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                Version {v.version} {v.is_locked ? "(Verified)" : "(Draft)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentScript?.is_locked && (
          <div className="flex items-center text-emerald-600 text-sm font-medium">
            <Lock className="w-4 h-4 mr-1.5" />
            Verified & Locked
          </div>
        )}
      </div>

      <div>
        {currentScript?.is_locked ? (
          <Button onClick={handleDuplicate} variant="outline" size="sm" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
            Edit / Create New Version
          </Button>
        ) : (
          <Button onClick={handleVerify} variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Verify Script
          </Button>
        )}
      </div>
    </div>
  );
}
