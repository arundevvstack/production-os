"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface KPI {
  characters?: number;
  locations?: number;
  props?: number;
  needsReview?: number;
  duplicates?: number;
  [key: string]: number | undefined;
}

interface WorkspaceState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  kpi: KPI | null;
  setKpi: (kpi: KPI | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalCount: number;
  setTotalCount: (count: number) => void;
  activeInspectorEntityId: string | null;
  setActiveInspectorEntityId: (id: string | null) => void;
  isAiReviewOpen: boolean;
  setIsAiReviewOpen: (isOpen: boolean) => void;
  bulkActions: ReactNode | null;
  setBulkActions: (actions: ReactNode | null) => void;
  inspectorContent: ReactNode | null;
  setInspectorContent: (content: ReactNode | null) => void;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [activeInspectorEntityId, setActiveInspectorEntityId] = useState<string | null>(null);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [bulkActions, setBulkActions] = useState<ReactNode | null>(null);
  const [inspectorContent, setInspectorContent] = useState<ReactNode | null>(null);

  return (
    <WorkspaceContext.Provider value={{
      searchQuery, setSearchQuery,
      selectedIds, setSelectedIds,
      kpi, setKpi,
      activeTab, setActiveTab,
      totalCount, setTotalCount,
      activeInspectorEntityId, setActiveInspectorEntityId,
      isAiReviewOpen, setIsAiReviewOpen,
      bulkActions, setBulkActions,
      inspectorContent, setInspectorContent
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
