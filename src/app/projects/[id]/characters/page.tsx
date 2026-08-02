"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, User, Sparkles, Trash2, Edit2, Check, X, Loader2, RefreshCw,
  AlertTriangle, Eye, ChevronDown, ChevronUp, Volume2, Music, Mic, FileText, Info,
  Download, ExternalLink, RefreshCcw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIdentityManager } from "@/components/production/workspace/IdentityContext";
// ─────────────────────────────────────────────
// ENTITY TYPE CLASSIFICATION
// ─────────────────────────────────────────────

type VisualDepartment = 'Characters' | 'Animals' | 'Vehicles' | 'Props' | 'Locations' | 'VFX';
type AudioDepartment = 'SFXs' | 'Music' | 'Audios';
type NonVisualCategory =
  | 'Narrator' | 'Voice Over' | 'Dialogue Notes' | 'Ambient Sound'
  | 'Background Music' | 'Score' | 'Songs' | 'Foley' | 'Sound Effects'
  | 'Background Sound';

const VISUAL_DEPARTMENTS: string[] = ['Characters', 'Animals', 'Vehicles', 'Props', 'Locations', 'VFX', 'Costumes'];
const NON_VISUAL_DEPARTMENTS: string[] = ['SFXs', 'Music', 'Audios'];
const NON_VISUAL_CATEGORIES: string[] = [
  'Narrator', 'Voice Over', 'Dialogue Notes', 'Ambient Sound', 'Background Music',
  'Score', 'Songs', 'Foley', 'Sound Effects', 'Background Sound', 'Ambient', 'Dialogue', 'Background'
];

function classifyEntity(char: any): { isVisual: boolean; reason?: string; icon?: any } {
  const dept = char.department || char.entity_type || 'Characters';
  const category = char.category || '';

  if (NON_VISUAL_DEPARTMENTS.some(d => dept.toLowerCase().includes(d.toLowerCase()))) {
    return {
      isVisual: false,
      reason: `This entity belongs to the "${dept}" department and is an audio element. Audio entities cannot generate visual references.`,
      icon: dept.toLowerCase().includes('music') ? Music : Volume2
    };
  }

  if (NON_VISUAL_CATEGORIES.some(c => category.toLowerCase().includes(c.toLowerCase()))) {
    return {
      isVisual: false,
      reason: `This entity's category "${category}" is non-visual (narration/audio). It cannot generate a character reference image.`,
      icon: Mic
    };
  }

  const name = (char.name || '').toLowerCase();
  const desc = (char.description || '').toLowerCase();
  const nonVisualKeywords = ['voice over', 'narrator', 'narration', 'voiceover', 'off-screen voice', 'background score', 'ambient'];
  if (nonVisualKeywords.some(kw => name.includes(kw) || desc.includes(kw))) {
    return {
      isVisual: false,
      reason: `This entity ("${char.name}") appears to be a narration or audio element based on its name and description. Audio entities cannot generate character portraits.`,
      icon: Volume2
    };
  }

  return { isVisual: true };
}

// ─────────────────────────────────────────────
// PROMPT BUILDER — FULL CONTEXT PIPELINE
// ─────────────────────────────────────────────

interface BuiltPrompt {
  positive: string;
  negative: string;
  summary: CharacterSummary;
  warnings: string[];
  isValid: boolean;
  failReason?: string;
}

interface CharacterSummary {
  name: string;
  age?: string;
  gender?: string;
  role?: string;
  description?: string;
  appearance?: string;
  faceReference?: string;
  bodyReference?: string;
  costume?: string;
  personality?: string;
  expressions?: string;
  visualBibleStyle?: string;
  visualBibleLighting?: string;
}

function buildCharacterPrompt(char: any, genType: string, visualBible: any): BuiltPrompt {
  const m = (char.metadata || {}) as any;
  const warnings: string[] = [];

  // Extract all known visual attributes
  const summary: CharacterSummary = {
    name: char.name,
    age: char.age || m.age || undefined,
    gender: char.gender || m.gender || undefined,
    role: m.role || char.importance || undefined,
    description: char.description || m.description || undefined,
    appearance: m.appearance || m.physical_description || undefined,
    faceReference: m.face_reference || m.face || undefined,
    bodyReference: m.body_reference || m.body || undefined,
    costume: m.costume || m.wardrobe || m.clothing || undefined,
    personality: char.personality || m.personality || m.traits || undefined,
    expressions: m.expressions || m.expression || undefined,
    visualBibleStyle: undefined,
    visualBibleLighting: undefined,
  };

  // Enrich from Visual Bible
  if (visualBible) {
    const charBible = visualBible.character_bible;
    if (charBible) {
      const bibleEntry = Array.isArray(charBible)
        ? charBible.find((cb: any) =>
            cb.name?.toLowerCase() === char.name?.toLowerCase() ||
            cb.character?.toLowerCase() === char.name?.toLowerCase()
          )
        : null;
      if (bibleEntry) {
        if (!summary.appearance && bibleEntry.appearance) summary.appearance = bibleEntry.appearance;
        if (!summary.costume && bibleEntry.costume) summary.costume = bibleEntry.costume;
        if (!summary.age && bibleEntry.age) summary.age = bibleEntry.age;
        if (!summary.gender && bibleEntry.gender) summary.gender = bibleEntry.gender;
      }
    }
    if (visualBible.style_bible?.look) summary.visualBibleStyle = visualBible.style_bible.look;
    if (visualBible.lighting_bible?.style) summary.visualBibleLighting = visualBible.lighting_bible.style;
    const costumeBible = visualBible.costume_bible;
    if (costumeBible && !summary.costume) {
      const costumeEntry = Array.isArray(costumeBible)
        ? costumeBible.find((c: any) => c.character?.toLowerCase() === char.name?.toLowerCase())
        : null;
      if (costumeEntry?.description) summary.costume = costumeEntry.description;
    }
  }

  // Quality Validation
  if (!summary.gender) warnings.push("Missing gender. Identity may be inconsistent.");
  if (!summary.appearance && !summary.faceReference) warnings.push("Missing appearance/face. Will generate a generic subject.");
  if (!summary.costume) warnings.push("Missing costume details.");
  
  const dept = char.department || char.entity_type || 'Characters';
  const isLocation = VISUAL_DEPARTMENTS.filter(d => d === 'Locations').some(d => d === dept);
  if (isLocation) warnings.push(`This entity is a "${dept}". Reference Sheet mode is intended for characters.`);

  // Professional Turnaround Sheet Prompt (Identity Locked V4)
  
  // 1. Identity Prompt (STRICTLY LOCKED)
  const identityPrompt = [
    `Subject: ${summary.name || 'Unknown'}`,
    summary.gender ? `Gender: ${summary.gender}` : null,
    summary.age ? `Age: ${summary.age}` : null,
    m.ethnicity ? `Ethnicity: ${m.ethnicity}` : null,
    m.height ? `Height: ${m.height}` : null,
    summary.bodyReference || m.body ? `Body: ${summary.bodyReference || m.body}` : null,
    summary.faceReference || m.face ? `Face: ${summary.faceReference || m.face}` : null,
    m.hair ? `Hair: ${m.hair}` : null,
    m.eyes ? `Eyes: ${m.eyes}` : null,
    m.skin ? `Skin: ${m.skin}` : null,
    summary.personality ? `Personality: ${summary.personality}` : null,
    summary.description ? `Description: ${summary.description}` : null,
    summary.appearance ? `Appearance: ${summary.appearance}` : null,
  ].filter(Boolean).join(', ');

  // 2. Dynamic Prompts (Based on genType)
  let actionPrefix = '';
  let posePrompt = '';
  let expressionPrompt = `Expression: ${summary.expressions || 'Neutral'}`;
  let costumePrompt = `Wardrobe: ${summary.costume || 'Neutral clothing'}`;
  let backgroundPrompt = 'Neutral seamless background';
  let cameraPrompt = 'Eye level, 85mm lens';

  if (genType === 'Master Portrait' || genType === 'Portrait') {
    actionPrefix = `Generate a professional photorealistic master portrait.`;
    posePrompt = `Pose: Professional reference portrait pose, looking at camera`;
  } else if (genType === 'Reference Sheet') {
    actionPrefix = `Generate a professional photorealistic character turnaround sheet.`;
    posePrompt = `Pose: T-pose and side profile reference sheet`;
  } else if (genType === 'Full Body') {
    actionPrefix = `Generate a professional photorealistic full body character standing shot.`;
    posePrompt = `Pose: Full body standing natural pose`;
    cameraPrompt = 'Full body shot, 50mm lens';
  } else if (genType === 'Action Pose' || genType === 'Action') {
    actionPrefix = `Generate a professional photorealistic character action pose shot.`;
    posePrompt = `Pose: Dynamic cinematic action pose`;
  } else if (genType === 'Expression Sheet') {
    actionPrefix = `Generate a professional photorealistic character expression sheet.`;
    posePrompt = `Pose: Headshot expression grid`;
    expressionPrompt = `Expression: Multiple expressions (happy, serious, angry, sad, thinking, surprised)`;
  } else if (genType === 'Costume Sheet') {
    actionPrefix = `Generate a professional photorealistic costume reference sheet.`;
    posePrompt = `Pose: Standing natural pose, showcasing clothing details front and back`;
    if (m.accessories) costumePrompt += `, Accessories: ${m.accessories}`;
  } else if (genType === 'Face Reference') {
    actionPrefix = `Generate a professional photorealistic extreme facial close-up for reference.`;
    posePrompt = `Pose: Extreme face close-up`;
    cameraPrompt = 'Macro close-up, 100mm lens';
  } else if (genType === 'Transparent PNG') {
    actionPrefix = `Generate a professional photorealistic character isolated on a pure solid white background.`;
    posePrompt = `Pose: Standing natural pose`;
    backgroundPrompt = `Pure solid white background, completely isolated, no shadows on background`;
  } else {
    actionPrefix = `Generate a professional photorealistic character reference sheet.`;
    posePrompt = `Pose: Professional reference pose`;
  }

  const lightingPrompt = `Lighting: Soft studio lighting, Professional casting reference lighting, High dynamic range`;
  const qualityPrompt = `Ultra detailed skin, Natural skin texture, Sharp facial details, Natural eyes, Realistic fabric, Photorealistic, 8K, Ultra realistic, Consistent identity across every angle, Film production reference`;

  const positive = [
    actionPrefix,
    `IDENTITY: [${identityPrompt}]`,
    posePrompt,
    expressionPrompt,
    costumePrompt,
    cameraPrompt,
    lightingPrompt,
    backgroundPrompt,
    qualityPrompt
  ].join('\n');

  // Negative prompt (Strict Hollywood Standard)
  const negativeBase = m.negative_prompt ? m.negative_prompt + ', ' : '';
  const negative = negativeBase + 'cartoon, anime, illustration, cgi, painting, concept art, fantasy, low quality, low resolution, cropped, multiple people, crowd, background scenery, building, vehicle, city, landscape, tree, text, watermark, logo, frame, distorted anatomy, bad hands, duplicate face, duplicate body, blurry, oversaturated, over sharpened';

  return { positive, negative, summary, warnings, isValid: true };
}

// ─────────────────────────────────────────────
// PROMPT PREVIEW MODAL
// ─────────────────────────────────────────────

function PromptPreviewModal({
  char, genType, visualBible, onConfirm, onClose, isGenerating
}: {
  char: any;
  genType: string;
  visualBible: any;
  onConfirm: (positive: string, negative: string) => void;
  onClose: () => void;
  isGenerating: boolean;
}) {
  const built = buildCharacterPrompt(char, genType, visualBible);
  const [editedPositive, setEditedPositive] = useState(built.positive);
  const [editedNegative, setEditedNegative] = useState(built.negative);
  const [showSummary, setShowSummary] = useState(false);

  const s = built.summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Prompt Preview — {genType}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review and edit before generating. Every parameter is sourced from the entity data and Visual Bible.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Warnings */}
          {built.warnings.length > 0 && (
            <div className="space-y-2">
              {built.warnings.map((w, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Character Summary */}
          <div>
            <button
              onClick={() => setShowSummary(v => !v)}
              className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 mb-2 transition-colors"
            >
              <Info className="w-4 h-4 text-red-600" />
              Character Summary
              {showSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showSummary && (
              <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {[
                  ['Name', s.name], ['Gender', s.gender], ['Age', s.age], ['Role', s.role],
                  ['Description', s.description], ['Appearance', s.appearance],
                  ['Face Reference', s.faceReference], ['Body Reference', s.bodyReference],
                  ['Costume', s.costume], ['Personality', s.personality],
                  ['Expressions', s.expressions], ['Visual Bible Style', s.visualBibleStyle],
                  ['Visual Bible Lighting', s.visualBibleLighting]
                ].filter(([, val]) => val).map(([label, val]) => (
                  <div key={label as string}>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">{label}</span>
                    <span className="text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Positive Prompt */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">
              Final Prompt <span className="text-xs font-normal text-slate-400">(editable)</span>
            </label>
            <textarea
              value={editedPositive}
              onChange={e => setEditedPositive(e.target.value)}
              rows={6}
              className="w-full text-sm font-mono p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none leading-relaxed text-slate-800"
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">
              Negative Prompt <span className="text-xs font-normal text-slate-400">(editable)</span>
            </label>
            <textarea
              value={editedNegative}
              onChange={e => setEditedNegative(e.target.value)}
              rows={3}
              className="w-full text-xs font-mono p-3 rounded-lg border border-red-100 bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 resize-none leading-relaxed text-red-700"
            />
          </div>

          {/* Generation Settings */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Generation Settings</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Type</span>
                <span className="font-semibold text-slate-800">{genType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Aspect Ratio</span>
                <span className="font-semibold text-slate-800">{genType === 'Portrait' ? '2:3' : '3:4'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Model</span>
                <span className="font-semibold text-slate-800">Auto (Configured)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-between items-center">
          <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            Cancel
          </button>
          <Button
            onClick={() => onConfirm(editedPositive, editedNegative)}
            disabled={isGenerating || !editedPositive.trim()}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Generate {genType}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NON-VISUAL ENTITY REJECTION MODAL
// ─────────────────────────────────────────────

function NonVisualRejectionModal({ char, reason, icon: Icon, onClose }: {
  char: any; reason: string; icon: any; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Non-Visual Entity</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">{reason}</p>
          <div className="flex flex-col gap-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
              <strong>Entity:</strong> {char.name}<br />
              <strong>Department:</strong> {char.department || char.entity_type || 'Unknown'}<br />
              <strong>Category:</strong> {char.category || 'Unknown'}
            </div>
            <Button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
              Understood
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ASSET VIEWER MODAL
// ─────────────────────────────────────────────

function AssetViewerModal({ char, assets, pendingAssets = {}, onClose, onRegenerate, onAccept, onReject, generationStatus }: { char: any; assets: Record<string, string>; pendingAssets?: Record<string, string>; onClose: () => void; onRegenerate: (type: string) => void; onAccept: (type: string) => void; onReject: (type: string) => void; generationStatus: string | null }) {
  const ASSET_TYPES = [
    'Master Portrait',
    'Reference Sheet',
    'Full Body',
    'Action Pose',
    'Expression Sheet',
    'Costume Sheet',
    'Face Reference',
    'Transparent PNG'
  ];

  const [activeTab, setActiveTab] = useState('Master Portrait');
  const isPending = !!pendingAssets[activeTab];
  const activeImage = pendingAssets[activeTab] || assets[activeTab] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 truncate">{char.name}</h3>
            <button onClick={onClose} className="p-1 md:hidden text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-2 flex-1 overflow-y-auto space-y-1">
            {ASSET_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setActiveTab(type)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  activeTab === type ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{type}</span>
                <div className="flex gap-1 items-center shrink-0">
                  {pendingAssets[type] ? (
                    <Badge className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Pending</Badge>
                  ) : assets[type] ? (
                    <Badge className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Approved</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] font-bold uppercase text-slate-400 border-slate-200">Missing</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-200">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2" onClick={() => {
              Object.entries(assets).forEach(([type, url]) => {
                if(!url) return;
                const a = document.createElement('a');
                a.href = url;
                a.download = `${char.name.replace(/\s+/g, '_')}_${type.replace(/\s+/g, '_')}.png`;
                a.click();
              });
            }}>
              <Download className="w-4 h-4" />
              Download All
            </Button>
          </div>
        </div>

        {/* Main Image Viewer */}
        <div className="flex-1 bg-slate-100 relative flex flex-col min-w-0">
           <div className="absolute top-4 right-4 z-10 hidden md:block">
             <button onClick={onClose} className="p-2 bg-white/80 backdrop-blur-md shadow-sm text-slate-500 hover:text-slate-900 rounded-full hover:bg-white transition-colors">
               <X className="w-5 h-5" />
             </button>
           </div>
           
           <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
              {activeImage ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img 
                    src={activeImage} 
                    alt={`${char.name} - ${activeTab}`} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    {isPending ? (
                      <>
                        <Button size="sm" variant="outline" className="bg-white/90 text-red-600 hover:bg-red-50 shadow-lg backdrop-blur-md gap-2" onClick={() => onReject(activeTab)}>
                          <X className="w-4 h-4" /> Reject
                        </Button>
                        <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg backdrop-blur-md gap-2" onClick={() => onAccept(activeTab)}>
                          <Check className="w-4 h-4" /> Accept Version
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="bg-white/90 text-slate-900 hover:bg-slate-100 shadow-lg backdrop-blur-md gap-2" onClick={() => onRegenerate(activeTab)} disabled={!!generationStatus}>
                          {generationStatus && generationStatus.includes(activeTab) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} 
                          Regenerate
                        </Button>
                        <Button size="sm" className="bg-white/90 text-slate-900 hover:bg-white shadow-lg backdrop-blur-md gap-2" onClick={() => {
                          const a = document.createElement('a');
                          a.href = activeImage;
                          a.download = `${char.name.replace(/\s+/g, '_')}_${activeTab.replace(/\s+/g, '_')}.png`;
                          a.click();
                        }}>
                          <Download className="w-4 h-4" /> Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">Asset not generated</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CHARACTER CARD
// ─────────────────────────────────────────────

function CharacterCard({ char, projectId, visualBible, onUpdate, onDelete }: {
  char: any; projectId: string; visualBible: any;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) {
  const { digitalHumans } = useIdentityManager();
  const human = digitalHumans[char.id];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: char.name,
    age: char.age || "",
    gender: char.gender || "",
    description: char.description || "",
    metadata: char.metadata || {}
  });

  const [previewState, setPreviewState] = useState<{ open: boolean; genType: string }>({ open: false, genType: 'Character Package' });
  const [rejectionState, setRejectionState] = useState<{ open: boolean; reason: string; icon: any } | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  const m = form.metadata as any;
  const ASSET_TYPES = [
    { name: 'Master Portrait', width: 1024, height: 1536 },
    { name: 'Reference Sheet', width: 2048, height: 1152 },
    { name: 'Full Body', width: 1024, height: 1536 },
    { name: 'Action Pose', width: 1024, height: 1536 },
    { name: 'Expression Sheet', width: 2048, height: 1152 },
    { name: 'Costume Sheet', width: 2048, height: 1152 },
    { name: 'Face Reference', width: 1024, height: 1024 },
    { name: 'Transparent PNG', width: 1024, height: 1536 }
  ];

  const classification = classifyEntity(char);

  const handleGeneratePackageClick = () => {
    if (!classification.isVisual) {
      setRejectionState({ open: true, reason: classification.reason!, icon: classification.icon! });
      return;
    }
    // Directly start package generation
    generateCharacterPackage();
  };

  const generateCharacterPackage = async () => {
    setGenerationStatus('Initializing...');
    const generatedAssets: Record<string, string> = { ...(m.assets || {}) };

    let identitySeed = m.identity?.seed;
    if (!identitySeed) {
      identitySeed = Math.floor(Math.random() * 4294967295);
    }
    const identityData: any = { 
      seed: identitySeed, 
      cfg: 7, 
      steps: 30, 
      sampler: 'DPM++ 2M Karras',
      identity_version: (m.identity?.identity_version || 0) + 1,
      generation_timestamp: new Date().toISOString()
    };
    
    let currentMasterUrl: string | undefined = undefined;

    try {
      for (let i = 0; i < ASSET_TYPES.length; i++) {
        const asset = ASSET_TYPES[i];
        setGenerationStatus(`Generating ${asset.name} (${i + 1}/8)...`);
        
        const built = buildCharacterPrompt(char, asset.name, visualBible);
        
        const payload: any = { 
          custom_prompt: built.positive, 
          negative_prompt: built.negative,
          width: asset.width,
          height: asset.height,
          seed: identitySeed,
          identity_target_seed: identitySeed
        };
        
        if (asset.name !== 'Master Portrait' && currentMasterUrl) {
          payload.master_image_url = currentMasterUrl;
        }

        const res = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (data.success && data.asset_url) {
          generatedAssets[asset.name] = data.asset_url;
          if (asset.name === 'Master Portrait') {
            currentMasterUrl = data.asset_url;
            identityData.master_image_url = data.asset_url;
            if (data.identity_score) identityData.identity_score = data.identity_score;
          }
        } else {
          console.error(`Failed to generate ${asset.name}`, data.error);
        }
      }

      setGenerationStatus('Saving Package...');
      
      const updatedMetadata = { ...m, assets: generatedAssets, identity: identityData };
      const patchRes = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ metadata: updatedMetadata, reference_image_url: currentMasterUrl || generatedAssets['Master Portrait'] || char.reference_image_url })
      });

      if (patchRes.ok) {
        onUpdate(char.id, { 
          metadata: updatedMetadata, 
          reference_image_url: currentMasterUrl || generatedAssets['Master Portrait'] || char.reference_image_url 
        });
        toast({ title: "Package Complete", description: `Successfully generated 8 assets for ${char.name}.` });
      }

    } catch (e) {
      console.error(e);
      toast({ title: "Generation Failed", description: "An unexpected error occurred during package generation.", variant: "destructive" });
    } finally {
      setGenerationStatus(null);
    }
  };

  const generateSingleAsset = async (assetName: string) => {
    setGenerationStatus(`Regenerating ${assetName}...`);
    const pendingAssets: Record<string, string> = { ...(m.pending_assets || {}) };

    let identitySeed = m.identity?.seed;
    if (!identitySeed) {
      identitySeed = Math.floor(Math.random() * 4294967295);
    }
    const identityData = m.identity || { seed: identitySeed, cfg: 7, steps: 30, sampler: 'DPM++ 2M Karras' };
    const masterUrl = identityData.master_image_url || m.assets?.['Master Portrait'];

    try {
      const assetDef = ASSET_TYPES.find(a => a.name === assetName);
      if (!assetDef) throw new Error("Unknown asset type");

      const built = buildCharacterPrompt(char, assetDef.name, visualBible);
      
      const payload: any = { 
        custom_prompt: built.positive, 
        negative_prompt: built.negative,
        width: assetDef.width,
        height: assetDef.height,
        seed: identitySeed,
        identity_target_seed: identitySeed
      };
      
      if (assetDef.name !== 'Master Portrait' && masterUrl) {
        payload.master_image_url = masterUrl;
      }

      const res = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success && data.asset_url) {
        pendingAssets[assetName] = data.asset_url;
      } else {
        throw new Error(`Failed to generate ${assetName}`);
      }

      const updatedMetadata = { ...m, pending_assets: pendingAssets, identity: identityData };
      const patchRes = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}`, {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ metadata: updatedMetadata })
      });

      if (patchRes.ok) {
        onUpdate(char.id, { metadata: updatedMetadata });
        toast({ title: "Asset Regenerated", description: `${assetName} is pending approval.` });
      }

    } catch (e) {
      console.error(e);
      toast({ title: "Generation Failed", description: "An unexpected error occurred during asset generation.", variant: "destructive" });
    } finally {
      setGenerationStatus(null);
    }
  };

  const handleAcceptAsset = async (assetName: string) => {
    const pendingUrl = m.pending_assets?.[assetName];
    if (!pendingUrl) return;
    
    const newAssets = { ...m.assets, [assetName]: pendingUrl };
    const newPending = { ...m.pending_assets };
    delete newPending[assetName];
    
    const updatedMetadata = { ...m, assets: newAssets, pending_assets: newPending };
    const newRefImage = assetName === 'Master Portrait' ? pendingUrl : char.reference_image_url;

    const res = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata: updatedMetadata, reference_image_url: newRefImage })
    });
    
    if (res.ok) {
       onUpdate(char.id, { metadata: updatedMetadata, reference_image_url: newRefImage });
       toast({ title: "Asset Approved", description: `${assetName} has been saved.` });
    }
  };

  const handleRejectAsset = async (assetName: string) => {
    const newPending = { ...m.pending_assets };
    delete newPending[assetName];
    const updatedMetadata = { ...m, pending_assets: newPending };
    
    const res = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata: updatedMetadata })
    });
    
    if (res.ok) {
       onUpdate(char.id, { metadata: updatedMetadata });
       toast({ title: "Asset Rejected", description: `Discarded pending ${assetName}.` });
    }
  };

  const save = async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/characters/${char.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    if (res.ok) { onUpdate(char.id, form); setEditing(false); }
  };

  const updateMetadata = (key: string, value: string) => {
    setForm(p => ({ ...p, metadata: { ...p.metadata, [key]: value } }));
  };

  const hasAssets = m.assets && Object.keys(m.assets).length > 0;
  const heroImage = hasAssets ? m.assets['Master Portrait'] || char.reference_image_url : char.reference_image_url;
  const hasImage = !!heroImage;
  const numAssets = hasAssets ? Object.keys(m.assets).length : (hasImage ? 1 : 0);

  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <div className={`group relative rounded-2xl border bg-white hover:shadow-2xl transition-all duration-250 hover:-translate-y-1 overflow-hidden flex flex-col ${!classification.isVisual ? 'opacity-60 border-slate-200 hover:shadow-none hover:-translate-y-0' : 'border-slate-200'}`}>
        
        {/* IMAGE HERO SECTION - 16:9 Aspect Ratio */}
        <div className="relative w-full aspect-video bg-slate-100 flex-shrink-0 group/image overflow-hidden cursor-pointer" onClick={() => hasAssets && setViewerOpen(true)}>
          {hasImage ? (
            <>
              <img 
                src={heroImage} 
                alt={char.name} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover/image:scale-[1.03] group-hover/image:brightness-105 transition-all duration-300 ease-out" 
              />
              {/* Bottom Gradient for Name/Role */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-4 z-10 pointer-events-none transition-opacity duration-300">
                <div className="w-full">
                  <h3 className="text-white font-bold text-lg leading-tight truncate drop-shadow-md">{char.name}</h3>
                  {m.role && <p className="text-red-300 text-xs font-semibold uppercase tracking-wider mt-0.5 drop-shadow-md">{m.role}</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              {classification.isVisual ? (
                <>
                  <User className="w-12 h-12 mb-3 opacity-40" />
                  <span className="text-xs font-bold tracking-widest uppercase">No Reference</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-12 h-12 mb-3 opacity-40" />
                  <span className="text-xs font-bold tracking-widest uppercase">Audio Entity</span>
                </>
              )}
            </div>
          )}

          {/* Badges - Top Right */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-20">
             <Badge className={`px-2 py-0.5 text-[10px] font-bold shadow-sm rounded-md border-0 ${hasImage ? 'bg-emerald-500/90 backdrop-blur hover:bg-emerald-600' : 'bg-slate-800/90 backdrop-blur hover:bg-slate-700'}`}>
               {hasImage ? `${numAssets} Assets Generated` : 'Draft'}
             </Badge>
             {hasImage && m.model && (
               <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white/90 border-white/20 text-[9px] shadow-sm rounded-md">
                 {m.model}
               </Badge>
             )}
             {hasImage && m.identity?.seed && (
               <Badge className="bg-indigo-500/90 backdrop-blur hover:bg-indigo-600 text-white text-[9px] shadow-sm rounded-md px-2 border-0 flex items-center gap-1">
                 <Check className="w-3 h-3" /> Identity Locked
               </Badge>
             )}
             {hasImage && m.identity?.identity_score && (
               <Badge className="bg-emerald-500/90 backdrop-blur text-white text-[9px] shadow-sm rounded-md px-2 border-0 flex items-center gap-1">
                 Score: {m.identity.identity_score}%
               </Badge>
             )}
             {hasImage && m.identity?.identity_version && (
               <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white/90 border-white/20 text-[9px] shadow-sm rounded-md">
                 v{m.identity.identity_version}
               </Badge>
             )}
             {!hasImage && !editing && (
               <div className="w-full flex justify-end">
                 <h3 className="text-slate-800 font-bold text-lg drop-shadow bg-white/80 px-2 py-0.5 rounded-md backdrop-blur-sm mt-1">{char.name}</h3>
               </div>
             )}
          </div>
        </div>

        {/* CARD BODY - Metadata */}
        <div className="p-4 flex-1 flex flex-col min-h-0 bg-white relative z-10 border-t border-slate-100">
          {human?.health && !editing && (
            <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Identity Health</span>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs font-extrabold ${human.health.isIdentityLocked ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {human.health.completionPercent}% Package
                  </span>
                  <div className="w-px h-3 bg-slate-300"></div>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${human.health.storyboardReady ? 'text-emerald-600' : 'text-amber-500'}`}>
                    Storyboard {human.health.storyboardReady ? 'Ready' : 'Block'}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-[10px] font-bold text-slate-400 text-right">
                <div className="flex items-center justify-end gap-1"><Check className={`w-3 h-3 ${human.health.isIdentityLocked ? 'text-emerald-500' : 'text-slate-300'}`}/> Master</div>
                <div className="flex items-center justify-end gap-1 mt-0.5"><Check className={`w-3 h-3 ${human.health.videoReady ? 'text-emerald-500' : 'text-slate-300'}`}/> Video</div>
              </div>
            </div>
          )}
          {editing ? (
            <div className="space-y-3 pb-2 flex-1">
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="h-8 text-sm font-semibold focus-visible:ring-red-500" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="Age" className="h-8 text-xs focus-visible:ring-red-500" />
                <Input value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} placeholder="Gender" className="h-8 text-xs focus-visible:ring-red-500" />
              </div>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="General Description" className="h-8 text-xs focus-visible:ring-red-500" />
              <Input value={m.face_reference || ""} onChange={e => updateMetadata("face_reference", e.target.value)} placeholder="Face reference..." className="h-8 text-xs focus-visible:ring-red-500" />
              <Input value={m.body_reference || ""} onChange={e => updateMetadata("body_reference", e.target.value)} placeholder="Body reference..." className="h-8 text-xs focus-visible:ring-red-500" />
              <Input value={m.costume || ""} onChange={e => updateMetadata("costume", e.target.value)} placeholder="Costume / Clothing..." className="h-8 text-xs focus-visible:ring-red-500" />
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-500 w-full" onClick={save}><Check className="h-3.5 w-3.5 mr-1.5" />Save Changes</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs w-full" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1.5" />Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Description */}
              {char.description && (
                 <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                   {char.description}
                 </p>
              )}

              {/* Metadata Chips */}
              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                 {char.gender && <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold px-2 border border-slate-200/60 rounded-md">{char.gender}</Badge>}
                 {char.age && <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold px-2 border border-slate-200/60 rounded-md">{char.age}</Badge>}
                 {(char.department || char.entity_type) && <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold px-2 border border-slate-200/60 rounded-md">{char.department || char.entity_type}</Badge>}
                 {m.face_reference && <Badge variant="outline" className="text-[10px] text-slate-500 font-medium px-2 rounded-md">Has Face Ref</Badge>}
              </div>
            </div>
          )}
        </div>

        {/* ACTION BAR (Horizontal Toolbar) */}
        {!editing && (
          <div className="border-t border-slate-100 bg-slate-50 flex items-center p-1.5 gap-1 shrink-0 flex-wrap sm:flex-nowrap">
             {classification.isVisual ? (
               <>
                 {generationStatus ? (
                   <div className="flex-1 flex items-center justify-center gap-2 h-11 text-slate-500 bg-slate-200/50 rounded-lg min-w-[120px]">
                     <Loader2 className="h-4 w-4 animate-spin" />
                     <span className="text-[11px] font-semibold">{generationStatus}</span>
                   </div>
                 ) : hasAssets ? (
                   <>
                     <Button variant="ghost" size="sm" onClick={() => setViewerOpen(true)} title="View Package" className="flex-1 flex-col h-11 px-1 gap-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 min-w-[50px] rounded-lg">
                       <ExternalLink className="h-4 w-4" />
                       <span className="text-[9px] font-semibold leading-none">View Package</span>
                     </Button>
                     <Button variant="ghost" size="sm" onClick={handleGeneratePackageClick} title="Regenerate Package" className="flex-1 flex-col h-11 px-1 gap-1 text-slate-500 hover:text-red-600 hover:bg-red-50 min-w-[50px] rounded-lg">
                       <RefreshCcw className="h-4 w-4" />
                       <span className="text-[9px] font-semibold leading-none">Regenerate</span>
                     </Button>
                   </>
                 ) : (
                   <Button variant="ghost" size="sm" onClick={handleGeneratePackageClick} className="flex-1 h-11 text-white bg-red-600 hover:bg-red-500 gap-2 min-w-[120px] rounded-lg shadow-sm">
                     <Sparkles className="h-4 w-4" />
                     <span className="text-[11px] sm:text-xs font-bold tracking-wide">Generate Character Package</span>
                   </Button>
                 )}

                 {/* Separator */}
                 <div className="w-px h-8 bg-slate-200 mx-1 shrink-0 hidden sm:block"></div>

                 <Button variant="ghost" size="sm" onClick={() => setEditing(true)} title="Edit Character Metadata" className="flex-col h-11 w-12 p-0 gap-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200/70 shrink-0 rounded-lg">
                   <Edit2 className="h-4 w-4" />
                   <span className="text-[9px] font-semibold leading-none">Edit</span>
                 </Button>
                 <Button variant="ghost" size="sm" onClick={() => onDelete(char.id)} title="Delete Character" className="flex-col h-11 w-12 p-0 gap-1 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0 rounded-lg">
                   <Trash2 className="h-4 w-4" />
                   <span className="text-[9px] font-semibold leading-none">Delete</span>
                 </Button>
               </>
             ) : (
               <div className="flex items-center justify-between w-full px-3 h-11">
                 <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Audio Entity</span>
                 <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-200 rounded-lg"><Edit2 className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="sm" onClick={() => onDelete(char.id)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Prompt Preview Modal is removed for the fully automated package flow */}

      {/* Asset Viewer Modal Lightbox */}
      {viewerOpen && (
        <AssetViewerModal
          char={char}
          assets={m.assets || {}}
          pendingAssets={m.pending_assets || {}}
          onClose={() => setViewerOpen(false)}
          onRegenerate={generateSingleAsset}
          onAccept={handleAcceptAsset}
          onReject={handleRejectAsset}
          generationStatus={generationStatus}
        />
      )}

      {/* Non-visual Rejection Modal */}
      {rejectionState?.open && (
        <NonVisualRejectionModal
          char={char}
          reason={rejectionState.reason}
          icon={rejectionState.icon}
          onClose={() => setRejectionState(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [characters, setCharacters] = useState<any[]>([]);
  const [visualBible, setVisualBible] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [filterDept, setFilterDept] = useState<'all' | 'visual' | 'nonvisual'>('visual');

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/projects/${projectId}/characters`).then(r => r.json()),
      fetch(`/api/v1/projects/${projectId}/visual-bible/latest`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([chars, vb]) => {
      setCharacters(Array.isArray(chars) ? chars : []);
      setVisualBible(vb);
      setLoading(false);
    });
  }, [projectId]);

  const addCharacter = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`/api/v1/projects/${projectId}/characters`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() })
    });
    if (res.ok) {
      const char = await res.json();
      setCharacters(p => [...p, char]);
      setNewName(""); setShowAdd(false);
    }
  };

  const deleteCharacter = async (id: string) => {
    await fetch(`/api/v1/projects/${projectId}/characters/${id}`, { method: "DELETE" });
    setCharacters(p => p.filter(c => c.id !== id));
  };

  const updateCharacter = (id: string, data: any) => {
    setCharacters(p => p.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const filtered = characters.filter(c => {
    if (filterDept === 'all') return true;
    const isVis = classifyEntity(c).isVisual;
    return filterDept === 'visual' ? isVis : !isVis;
  });

  const visualCount = characters.filter(c => classifyEntity(c).isVisual).length;
  const nonVisualCount = characters.filter(c => !classifyEntity(c).isVisual).length;

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Character Manager...
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Character Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build entity profiles and generate contextual reference images using Visual Bible enrichment.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-red-600 hover:bg-red-500 text-white gap-2">
          <Plus className="h-4 w-4" /> New Character
        </Button>
      </div>

      {/* Visual Bible Status */}
      {visualBible ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Visual Bible is active — prompts will be enriched with style, lighting, and character data from the approved Visual Bible.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>No Visual Bible found. Prompts will use character metadata only. For best results, generate and approve the Visual Bible first.</span>
        </div>
      )}

      {/* Add Character */}
      {showAdd && (
        <div className="flex gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <Input
            autoFocus placeholder="Character name..."
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addCharacter(); if (e.key === "Escape") setShowAdd(false); }}
          />
          <Button onClick={addCharacter} className="bg-red-600 hover:bg-red-500"><Check className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {/* Filter Tabs */}
      {characters.length > 0 && (
        <div className="flex items-center gap-2">
          {([
            ['all', 'All Entities', characters.length],
            ['visual', 'Visual (Can Generate)', visualCount],
            ['nonvisual', 'Non-Visual (Audio)', nonVisualCount],
          ] as [string, string, number][]).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilterDept(key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterDept === key ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterDept === key ? 'bg-red-500/40' : 'bg-slate-300/60'}`}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">
            {characters.length === 0 ? "No characters yet." : `No ${filterDept === 'nonvisual' ? 'non-visual' : 'visual'} entities.`}
          </p>
          <p className="text-xs mt-1">
            {characters.length === 0 ? "Add characters from the script breakdown or create them manually." : "Try switching to a different filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 auto-rows-max">
          {filtered.map(char => (
            <CharacterCard
              key={char.id}
              char={char}
              projectId={projectId}
              visualBible={visualBible}
              onUpdate={updateCharacter}
              onDelete={deleteCharacter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
