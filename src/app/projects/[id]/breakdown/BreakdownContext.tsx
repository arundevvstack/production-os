"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Users, MapPin, Package, Shirt, Accessibility, Sparkles, Volume2, Car, Camera, ClipboardList } from 'lucide-react';

export const CATEGORY_GROUPS = [
  {
    name: 'Cast & Characters',
    icon: Users,
    categories: [
      { id: 'Characters', label: 'All Characters' },
      { id: 'Crowd', label: 'Crowd' },
      { id: 'Extras', label: 'Extras' },
      { id: 'Children', label: 'Children' },
    ]
  },
  {
    name: 'Locations',
    icon: MapPin,
    categories: [
      { id: 'Locations', label: 'All Locations' },
    ]
  },
  {
    name: 'Props & Dressing',
    icon: Package,
    categories: [
      { id: 'Props', label: 'All Props' },
      { id: 'Hero Props', label: 'Hero Props' },
      { id: 'Set Dressing', label: 'Set Dressing' },
      { id: 'Furniture', label: 'Furniture' },
      { id: 'Food', label: 'Food' },
      { id: 'Documents', label: 'Documents' },
      { id: 'Graphics', label: 'Graphics' },
      { id: 'Weapons', label: 'Weapons' },
      { id: 'SpecialEquipment', label: 'Special Equipment' },
    ]
  },
  {
    name: 'Wardrobe',
    icon: Shirt,
    categories: [
      { id: 'Costumes', label: 'All Wardrobe' },
      { id: 'Wardrobe', label: 'Wardrobe' },
      { id: 'Makeups', label: 'Makeup' },
      { id: 'Hair', label: 'Hair' },
    ]
  },
  {
    name: 'Vehicles',
    icon: Car,
    categories: [
      { id: 'Vehicles', label: 'Vehicles' },
    ]
  },
  {
    name: 'Animals',
    icon: Accessibility,
    categories: [
      { id: 'Animals', label: 'Animals' },
    ]
  },
  {
    name: 'Camera',
    icon: Camera,
    categories: [
      { id: 'Cameras', label: 'All Cameras' },
      { id: 'Camera Equipment', label: 'Camera Equipment' },
      { id: 'Lenses', label: 'Lenses' },
      { id: 'Drone', label: 'Drone' },
    ]
  },
  {
    name: 'Lighting',
    icon: Sparkles,
    categories: [
      { id: 'Lightings', label: 'All Lighting' },
      { id: 'Grip', label: 'Grip' },
    ]
  },
  {
    name: 'Continuity',
    icon: ClipboardList,
    categories: [
      { id: 'Continuities', label: 'All Continuity' },
      { id: 'Action Elements', label: 'Action Elements' },
      { id: 'Safety', label: 'Safety' },
    ]
  },
  {
    name: 'VFX',
    icon: Sparkles,
    categories: [
      { id: 'VFXs', label: 'All VFX' },
      { id: 'Practical FX', label: 'Practical FX' },
      { id: 'CG', label: 'CG' },
      { id: 'Fire', label: 'Fire' },
      { id: 'Smoke', label: 'Smoke' },
      { id: 'Rain', label: 'Rain' },
      { id: 'Dust', label: 'Dust' },
      { id: 'Fog', label: 'Fog' },
      { id: 'Blood FX', label: 'Blood FX' },
      { id: 'Weather', label: 'Weather' },
      { id: 'Environment FX', label: 'Environment FX' },
    ]
  },
  {
    name: 'SFX',
    icon: Volume2,
    categories: [
      { id: 'SFXs', label: 'All SFX' },
      { id: 'Ambient Sound', label: 'Ambient Sound' },
      { id: 'Background Sound', label: 'Background Sound' },
      { id: 'Dialogue Notes', label: 'Dialogue Notes' },
    ]
  },
  {
    name: 'Music',
    icon: Volume2,
    categories: [
      { id: 'Music', label: 'All Music' },
      { id: 'Background Music', label: 'Background Music' },
      { id: 'Score', label: 'Score' },
      { id: 'Songs', label: 'Songs' },
    ]
  },
  {
    name: 'Production Notes',
    icon: ClipboardList,
    categories: [
      { id: 'Production Notes', label: 'Production Notes' },
    ]
  }
];

interface BreakdownState {
  script: any;
  allItems: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  categories: any[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleSelection: (id: string) => void;
  updateStatus: (ids: string[], status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: Record<string, string[]>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  sortOption: string;
  setSortOption: (sort: string) => void;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  filteredItems: any[];
  needsReviewItems: any[];
  approvedItems: any[];
  filterCategories: { id: string, label: string, options: string[] }[];
}

const BreakdownContext = createContext<BreakdownState | undefined>(undefined);

export function BreakdownProvider({ script, children }: { script: any, children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('Characters');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortOption, setSortOption] = useState<string>('name_asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [localOverrides, setLocalOverrides] = useState<Record<string, { status?: string }>>({});

  const allItems = useMemo(() => {
    const rawItems = [
      ...(script.Characters || []),
      ...(script.Locations || []),
      ...(script.Props || []),
      ...(script.Costumes || []),
      ...(script.Makeups || []),
      ...(script.Vehicles || []),
      ...(script.Animals || []),
      ...(script.VFXs || []),
      ...(script.Audios || []),
      ...(script.Music || []),
      ...(script.Lightings || []),
      ...(script.Cameras || []),
      ...(script.Continuities || [])
    ];
    return rawItems.map(item => {
      const override = localOverrides[item.id];
      if (override) {
        return { ...item, ...override };
      }
      return item;
    });
  }, [script, localOverrides]);

  const needsReviewItems = useMemo(() => {
    return allItems.filter(i => {
      if (i.metadata?.latin_name && i.name && i.name.toLowerCase() !== i.metadata.latin_name.toLowerCase()) {
        if (!i.metadata.validation) {
           i.metadata.validation = {};
        }
        i.metadata.validation.needs_review = true;
        if (!i.metadata.validation.reason) i.metadata.validation.reason = "Spelling mismatch detected between original text and transliteration.";
      }
      return i.metadata?.validation?.needs_review && i.status !== 'Approved';
    });
  }, [allItems]);

  const approvedItems = useMemo(() => {
    return allItems.filter(i => i.status === 'Approved');
  }, [allItems]);

  const categories = useMemo(() => {
    return CATEGORY_GROUPS.map(group => {
      const activeCategories = group.categories.map(cat => {
        let count = 0;
        switch(cat.id) {
          case 'Characters': count = (script.Characters || []).length; break;
          case 'Crowd': count = (script.Characters || []).filter((c: any) => c.importance === 'Crowd').length; break;
          case 'Extras': count = (script.Characters || []).filter((c: any) => c.importance === 'Extras').length; break;
          case 'Stunts': count = (script.Characters || []).filter((c: any) => c.importance === 'Stunts' || c.metadata?.role === 'Stunts').length; break;
          case 'Children': count = (script.Characters || []).filter((c: any) => c.metadata?.role === 'Child' || c.metadata?.role === 'Children').length; break;
          case 'Locations': count = (script.Locations || []).length; break;
          case 'Props': count = (script.Props || []).length; break;
          case 'Hero Props': count = (script.Props || []).filter((p: any) => p.metadata?.hero === true || p.category === 'Hero Prop').length; break;
          case 'Set Dressing': count = (script.Props || []).filter((p: any) => p.category === 'Set Dressing').length; break;
          case 'Furniture': count = (script.Props || []).filter((p: any) => p.category === 'Furniture').length; break;
          case 'Food': count = (script.Props || []).filter((p: any) => p.category === 'Food').length; break;
          case 'Documents': count = (script.Props || []).filter((p: any) => p.category === 'Document' || p.category === 'Documents').length; break;
          case 'Graphics': count = (script.Props || []).filter((p: any) => p.category === 'Graphic' || p.category === 'Graphics').length; break;
          case 'Weapons': count = (script.Props || []).filter((p: any) => p.category === 'Weapon' || p.category === 'Weapons').length; break;
          case 'SpecialEquipment': count = (script.Props || []).filter((p: any) => p.category === 'Special Equipment').length; break;
          case 'Costumes': count = (script.Costumes || []).length; break;
          case 'Wardrobe': count = (script.Costumes || []).filter((c: any) => c.category === 'Wardrobe').length; break;
          case 'Makeups': count = (script.Makeups || []).length; break;
          case 'Hair': count = (script.Makeups || []).filter((m: any) => m.category === 'Hair').length; break;
          case 'Vehicles': count = (script.Vehicles || []).length; break;
          case 'Animals': count = (script.Animals || []).length; break;
          case 'VFXs': count = (script.VFXs || []).length; break;
          case 'Practical FX': count = (script.VFXs || []).filter((v: any) => v.metadata?.type === 'Practical').length; break;
          case 'CG': count = (script.VFXs || []).filter((v: any) => v.metadata?.type === 'CG').length; break;
          case 'Environment FX': count = (script.VFXs || []).filter((v: any) => v.metadata?.type === 'Environment').length; break;
          case 'Fire': count = (script.VFXs || []).filter((v: any) => v.name?.toLowerCase().includes('fire')).length; break;
          case 'Smoke': count = (script.VFXs || []).filter((v: any) => v.name?.toLowerCase().includes('smoke')).length; break;
          case 'Rain': count = (script.VFXs || []).filter((v: any) => v.name?.toLowerCase().includes('rain')).length; break;
          case 'Dust': count = (script.VFXs || []).filter((v: any) => v.name?.toLowerCase().includes('dust')).length; break;
          case 'Fog': count = (script.VFXs || []).filter((v: any) => v.name?.toLowerCase().includes('fog')).length; break;
          case 'Blood FX': count = (script.VFXs || []).filter((v: any) => v.name?.toLowerCase().includes('blood')).length; break;
          case 'Weather': count = (script.VFXs || []).filter((v: any) => v.category?.toLowerCase() === 'weather').length; break;
          case 'SFXs': count = (script.Audios || []).length; break;
          case 'Ambient Sound': count = (script.Audios || []).filter((a: any) => a.category === 'Ambient').length; break;
          case 'Background Sound': count = (script.Audios || []).filter((a: any) => a.category === 'Background').length; break;
          case 'Dialogue Notes': count = (script.Audios || []).filter((a: any) => a.category === 'Dialogue').length; break;
          case 'Music': count = (script.Music || []).length; break;
          case 'Background Music': count = (script.Music || []).filter((m: any) => m.category === 'Background Music').length; break;
          case 'Score': count = (script.Music || []).filter((m: any) => m.category === 'Score').length; break;
          case 'Songs': count = (script.Music || []).filter((m: any) => m.category === 'Song').length; break;
          case 'Cameras': count = (script.Cameras || []).length; break;
          case 'Camera Equipment': count = (script.Cameras || []).filter((c: any) => c.category === 'Equipment').length; break;
          case 'Lenses': count = (script.Cameras || []).filter((c: any) => c.category === 'Lens').length; break;
          case 'Lightings': count = (script.Lightings || []).length; break;
          case 'Grip': count = (script.Lightings || []).filter((l: any) => l.category === 'Grip').length; break;
          case 'Continuities': count = (script.Continuities || []).length; break;
          case 'Action Elements': count = (script.Continuities || []).filter((c: any) => c.category === 'Action Element').length; break;
          case 'Drone': count = (script.Cameras || []).filter((c: any) => c.category === 'Drone').length; break;
          case 'Safety': count = (script.Continuities || []).filter((c: any) => c.category === 'Safety').length; break;
          case 'Production Notes': count = (script.Continuities || []).filter((c: any) => c.category === 'Production Note').length; break;
        }
        return { ...cat, count };
      }).filter(c => c.count > 0);
      return { ...group, categories: activeCategories };
    }).filter(group => group.categories.length > 0);
  }, [allItems]);

  const items = useMemo(() => {
    switch(activeTab) {
      case 'Characters': return allItems.filter((c: any) => (script.Characters || []).some((sc: any) => sc.id === c.id));
      case 'Crowd': return allItems.filter((c: any) => c.importance === 'Crowd' && (script.Characters || []).some((sc: any) => sc.id === c.id));
      case 'Extras': return allItems.filter((c: any) => c.importance === 'Extras' && (script.Characters || []).some((sc: any) => sc.id === c.id));
      case 'Stunts': return allItems.filter((c: any) => (c.importance === 'Stunts' || c.metadata?.role === 'Stunts') && (script.Characters || []).some((sc: any) => sc.id === c.id));
      case 'Children': return allItems.filter((c: any) => (c.metadata?.role === 'Child' || c.metadata?.role === 'Children') && (script.Characters || []).some((sc: any) => sc.id === c.id));
      case 'Locations': return allItems.filter((c: any) => (script.Locations || []).some((sc: any) => sc.id === c.id));
      case 'Props': return allItems.filter((c: any) => (script.Props || []).some((sc: any) => sc.id === c.id));
      case 'Hero Props': return allItems.filter((p: any) => (p.metadata?.hero === true || p.category === 'Hero Prop') && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Set Dressing': return allItems.filter((p: any) => p.category === 'Set Dressing' && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Furniture': return allItems.filter((p: any) => p.category === 'Furniture' && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Food': return allItems.filter((p: any) => p.category === 'Food' && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Documents': return allItems.filter((p: any) => (p.category === 'Document' || p.category === 'Documents') && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Graphics': return allItems.filter((p: any) => (p.category === 'Graphic' || p.category === 'Graphics') && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Weapons': return allItems.filter((p: any) => (p.category === 'Weapon' || p.category === 'Weapons') && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'SpecialEquipment': return allItems.filter((p: any) => p.category === 'Special Equipment' && (script.Props || []).some((sc: any) => sc.id === p.id));
      case 'Costumes': return allItems.filter((c: any) => (script.Costumes || []).some((sc: any) => sc.id === c.id));
      case 'Wardrobe': return allItems.filter((c: any) => c.category === 'Wardrobe' && (script.Costumes || []).some((sc: any) => sc.id === c.id));
      case 'Makeups': return allItems.filter((m: any) => (script.Makeups || []).some((sc: any) => sc.id === m.id));
      case 'Hair': return allItems.filter((m: any) => m.category === 'Hair' && (script.Makeups || []).some((sc: any) => sc.id === m.id));
      case 'Vehicles': return allItems.filter((v: any) => (script.Vehicles || []).some((sc: any) => sc.id === v.id));
      case 'Animals': return allItems.filter((a: any) => (script.Animals || []).some((sc: any) => sc.id === a.id));
      case 'VFXs': return allItems.filter((v: any) => (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Practical FX': return allItems.filter((v: any) => v.metadata?.type === 'Practical' && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'CG': return allItems.filter((v: any) => v.metadata?.type === 'CG' && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Environment FX': return allItems.filter((v: any) => v.metadata?.type === 'Environment' && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Fire': return allItems.filter((v: any) => v.name?.toLowerCase().includes('fire') && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Smoke': return allItems.filter((v: any) => v.name?.toLowerCase().includes('smoke') && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Rain': return allItems.filter((v: any) => v.name?.toLowerCase().includes('rain') && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Dust': return allItems.filter((v: any) => v.name?.toLowerCase().includes('dust') && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Fog': return allItems.filter((v: any) => v.name?.toLowerCase().includes('fog') && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Blood FX': return allItems.filter((v: any) => v.name?.toLowerCase().includes('blood') && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'Weather': return allItems.filter((v: any) => v.category?.toLowerCase() === 'weather' && (script.VFXs || []).some((sc: any) => sc.id === v.id));
      case 'SFXs': return allItems.filter((a: any) => (script.Audios || []).some((sc: any) => sc.id === a.id));
      case 'Ambient Sound': return allItems.filter((a: any) => a.category === 'Ambient' && (script.Audios || []).some((sc: any) => sc.id === a.id));
      case 'Background Sound': return allItems.filter((a: any) => a.category === 'Background' && (script.Audios || []).some((sc: any) => sc.id === a.id));
      case 'Dialogue Notes': return allItems.filter((a: any) => a.category === 'Dialogue' && (script.Audios || []).some((sc: any) => sc.id === a.id));
      case 'Music': return allItems.filter((m: any) => (script.Music || []).some((sc: any) => sc.id === m.id));
      case 'Background Music': return allItems.filter((m: any) => m.category === 'Background Music' && (script.Music || []).some((sc: any) => sc.id === m.id));
      case 'Score': return allItems.filter((m: any) => m.category === 'Score' && (script.Music || []).some((sc: any) => sc.id === m.id));
      case 'Songs': return allItems.filter((m: any) => m.category === 'Song' && (script.Music || []).some((sc: any) => sc.id === m.id));
      case 'Cameras': return allItems.filter((c: any) => (script.Cameras || []).some((sc: any) => sc.id === c.id));
      case 'Camera Equipment': return allItems.filter((c: any) => c.category === 'Equipment' && (script.Cameras || []).some((sc: any) => sc.id === c.id));
      case 'Lenses': return allItems.filter((c: any) => c.category === 'Lens' && (script.Cameras || []).some((sc: any) => sc.id === c.id));
      case 'Drone': return allItems.filter((c: any) => c.category === 'Drone' && (script.Cameras || []).some((sc: any) => sc.id === c.id));
      case 'Lightings': return allItems.filter((l: any) => (script.Lightings || []).some((sc: any) => sc.id === l.id));
      case 'Grip': return allItems.filter((l: any) => l.category === 'Grip' && (script.Lightings || []).some((sc: any) => sc.id === l.id));
      case 'Continuities': return allItems.filter((c: any) => (script.Continuities || []).some((sc: any) => sc.id === c.id));
      case 'Action Elements': return allItems.filter((c: any) => c.category === 'Action Element' && (script.Continuities || []).some((sc: any) => sc.id === c.id));
      case 'Safety': return allItems.filter((c: any) => c.category === 'Safety' && (script.Continuities || []).some((sc: any) => sc.id === c.id));
      case 'Production Notes': return allItems.filter((c: any) => c.category === 'Production Note' && (script.Continuities || []).some((sc: any) => sc.id === c.id));
      default: return [];
    }
  }, [activeTab, allItems, script]);

  const filteredItems = useMemo(() => {
    let result = items;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i: any) => {
        const nameMatch = i.name && i.name.toLowerCase().includes(q);
        const descMatch = i.description && i.description.toLowerCase().includes(q);
        const latinMatch = i.metadata?.latin_name && i.metadata.latin_name.toLowerCase().includes(q);
        const aliasMatch = i.metadata?.aliases && i.metadata.aliases.some((a: string) => a.toLowerCase().includes(q));
        const tagsMatch = i.metadata?.tags && i.metadata.tags.some((t: string) => t.toLowerCase().includes(q));
        return nameMatch || descMatch || latinMatch || aliasMatch || tagsMatch;
      });
    }

    if (Object.keys(activeFilters).length > 0) {
      result = result.filter((i: any) => {
        let pass = true;
        for (const [cat, opts] of Object.entries(activeFilters)) {
          if (opts.length === 0) continue;
          let categoryPass = false;
          const validation = i.metadata?.validation || {};
          const conf = Math.round((validation.confidence_score || 1.0) * 100);
          
          if (cat === 'status') {
            if (opts.includes('Needs Review') && validation.needs_review) categoryPass = true;
            if (opts.includes('Approved') && i.status === 'Approved') categoryPass = true;
            if (opts.includes('Rejected') && i.status === 'Rejected') categoryPass = true;
            if (opts.includes('Draft') && (!i.status || i.status === 'Draft')) categoryPass = true;
          } else if (cat === 'confidence') {
            if (opts.includes('High (>85%)') && conf > 85) categoryPass = true;
            if (opts.includes('Medium (60-85%)') && conf >= 60 && conf <= 85) categoryPass = true;
            if (opts.includes('Low (<60%)') && conf < 60) categoryPass = true;
          } else if (cat === 'importance') {
            if (opts.includes(i.importance) || opts.includes(i.metadata?.role)) categoryPass = true;
          } else if (cat === 'gender') {
            if (opts.includes(i.metadata?.gender || i.gender)) categoryPass = true;
          } else if (cat === 'type') {
            if (opts.includes(i.type)) categoryPass = true;
          } else if (cat === 'time') {
            if (opts.includes(i.time_of_day)) categoryPass = true;
          } else {
            categoryPass = true; 
          }
          pass = pass && categoryPass;
        }
        return pass;
      });
    }

    result = [...result].sort((a, b) => {
      if (sortOption === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortOption === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortOption === 'status') return (a.status || '').localeCompare(b.status || '');
      return 0;
    });

    return result;
  }, [items, searchQuery, activeFilters, sortOption]);

  const filterCategories = useMemo(() => {
    return [
      { id: 'department', label: 'Department', options: CATEGORY_GROUPS.map(g => g.name) },
      { id: 'status', label: 'Approval Status', options: ['Needs Review', 'Approved', 'Rejected', 'Draft'] },
      { id: 'confidence', label: 'AI Confidence', options: ['High (>85%)', 'Medium (60-85%)', 'Low (<60%)'] },
      { id: 'language', label: 'Language', options: ['Original', 'Translated', 'Mixed'] },
      { id: 'duplicates', label: 'Duplicates', options: ['Has Duplicates', 'Unique'] }
    ];
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateStatus = (ids: string[], status: string) => {
    setLocalOverrides(prev => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = { ...(next[id] || {}), status };
      }
      return next;
    });
    // Do not clear selection automatically so the inspector stays open
  };

  return (
    <BreakdownContext.Provider value={{
      script, allItems, activeTab, setActiveTab, categories,
      selectedIds, setSelectedIds, toggleSelection, updateStatus,
      searchQuery, setSearchQuery, activeFilters, setActiveFilters,
      sortOption, setSortOption, viewMode, setViewMode,
      filteredItems, needsReviewItems, approvedItems, filterCategories
    }}>
      {children}
    </BreakdownContext.Provider>
  );
}

export function useBreakdown() {
  const context = useContext(BreakdownContext);
  if (context === undefined) {
    throw new Error('useBreakdown must be used within a BreakdownProvider');
  }
  return context;
}
