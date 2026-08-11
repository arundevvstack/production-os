"use client";

import { useState } from "react";
import { updateSceneAction, reorderSceneAction } from "./actions";
import { MapPin, Users, Clapperboard, Sun, Loader2, Save, X, ChevronUp, ChevronDown, ImageIcon, CheckCircle2 } from "lucide-react";
import { AssetCard } from "@/components/production/ui/AssetCard";

interface SceneCardProps {
  scene: any;
  projectId: string;
  /** image_url from the matching storyboard version scene. null = no image yet. */
  storyboardImageUrl: string | null;
  aspectRatio?: string;
}

export function SceneCard({ scene, projectId, storyboardImageUrl, aspectRatio }: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const version = scene.Versions?.[0];

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    await updateSceneAction(scene.id, projectId, formData);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleReorder = async (direction: "up" | "down") => {
    setIsReordering(true);
    await reorderSceneAction(scene.id, projectId, direction);
    setIsReordering(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT MODE — inline form keeps the same horizontal layout
  // ─────────────────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="border border-blue-300 bg-blue-50 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="flex flex-col md:flex-row">
          {/* 16:9 thumbnail placeholder in edit mode */}
          <div
            className="w-full md:w-64 lg:w-72 shrink-0 bg-slate-200 flex items-center justify-center"
            style={{ aspectRatio: aspectRatio ? (aspectRatio === "9:16" ? "9 / 16" : "16 / 9") : "16 / 9" }}
          >
            {storyboardImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={storyboardImageUrl}
                alt={`Scene ${scene.scene_number}`}
                className="w-full h-full"
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">No Image</span>
              </div>
            )}
          </div>

          {/* Edit fields */}
          <div className="flex-1 p-5 space-y-3 bg-white">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              SCENE {scene.scene_number}
            </div>
            <input
              name="title"
              defaultValue={scene.title}
              className="w-full font-bold text-lg p-2 border rounded"
              required
            />
            <textarea
              name="description"
              defaultValue={scene.description || ""}
              rows={2}
              className="w-full p-2 text-sm border rounded"
              placeholder="Description"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-0.5">Duration</label>
                <input name="duration" defaultValue={scene.duration || ""} placeholder="e.g. 00:30" className="w-full p-2 text-sm border rounded" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-0.5">Mood</label>
                <input name="mood" defaultValue={scene.mood || ""} className="w-full p-2 text-sm border rounded" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-0.5">Environment Notes</label>
              <input name="notes" defaultValue={scene.notes || ""} className="w-full p-2 text-sm border rounded" />
            </div>
          </div>

          {/* Actions */}
          <div className="md:w-28 bg-slate-50 flex flex-col items-center justify-center border-l p-4 gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="w-full bg-white border hover:bg-slate-50 text-slate-700 text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW MODE — cinematic 16:9 thumbnail + scene details
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">

        <AssetCard 
          assetUrl={storyboardImageUrl || undefined}
          className="w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 border-0 rounded-none shadow-none"
          aspectRatio={aspectRatio}
          badgeOverlay={
            <>
              {/* Scene number badge */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                SCENE {scene.scene_number}
              </div>
              {/* Approved badge */}
              {scene.status === "approved" && (
                <div className="absolute top-2 right-2 bg-emerald-500/90 text-white p-1 rounded-full z-10">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </>
          }
          hoverOverlay={
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); handleReorder("up"); }}
                disabled={isReordering}
                title="Move up"
                className="p-1.5 bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow transition"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReorder("down"); }}
                disabled={isReordering}
                title="Move down"
                className="p-1.5 bg-white/90 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg shadow transition"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        />

        {/* ── SCENE DETAILS ────────────────────────────────────────────────── */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate">
                  {scene.title}
                </h3>
                {scene.duration && (
                  <span className="text-xs text-slate-400 font-medium">
                    Duration: {scene.duration}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                {version?.scene_type && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider whitespace-nowrap">
                    {version.scene_type}
                  </span>
                )}
                {version?.time_of_day && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider whitespace-nowrap">
                    {version.time_of_day}
                  </span>
                )}
              </div>
            </div>

            {scene.description && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                {scene.description}
              </p>
            )}
          </div>

          {/* Metadata row */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                <MapPin className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Location</span>
              </div>
              <p className="text-xs font-medium text-slate-700 line-clamp-1">
                {version?.location_ref || "—"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                <Users className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Characters</span>
              </div>
              <p className="text-xs font-medium text-slate-700 line-clamp-1">
                {version?.characters_ref || "—"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                <Clapperboard className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Props</span>
              </div>
              <p className="text-xs font-medium text-slate-700 line-clamp-1">
                {version?.props_ref || "—"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                <Sun className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Mood</span>
              </div>
              <p className="text-xs font-medium text-slate-700 line-clamp-1">
                {scene.mood || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── ACTIONS ──────────────────────────────────────────────────────── */}
        <div className="md:w-24 bg-slate-50 flex items-center justify-center border-l border-slate-100 p-4">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-bold py-2 rounded-lg transition"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
