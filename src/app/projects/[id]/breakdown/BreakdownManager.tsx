"use client";
import React, { useState, useEffect } from 'react';
import { FileSearch, Sparkles, AlertTriangle, CheckCircle2, Filter, LayoutGrid, List } from 'lucide-react';
import { EmptyState } from '@/components/production/design-system/EmptyState';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/components/production/workspace/WorkspaceContext';
import { ContextNavigation } from './components/ContextNavigation';
import { EntityInspectorPanel } from './components/EntityInspectorPanel';
import { EnterpriseDataTable } from './components/EnterpriseDataTable';
import { AdvancedFilterDrawer } from './components/AdvancedFilterDrawer';
import { useBreakdown } from './BreakdownContext';

export function BreakdownManager({ script, projectId }: { script: any; projectId: string }) {
  const { 
    setKpi, setBulkActions, setInspectorContent 
  } = useWorkspace();

  const {
    allItems, activeTab, setActiveTab, categories,
    selectedIds, setSelectedIds, toggleSelection,
    searchQuery, setSearchQuery, activeFilters, setActiveFilters,
    sortOption, setSortOption, viewMode, setViewMode,
    filteredItems, needsReviewItems, approvedItems, filterCategories,
    updateStatus
  } = useBreakdown();

  const [isAiQualityOpen, setIsAiQualityOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleFilterChange = (categoryId: string, option: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (!next[categoryId]) next[categoryId] = [];
      if (next[categoryId].includes(option)) {
        next[categoryId] = next[categoryId].filter(o => o !== option);
      } else {
        next[categoryId] = [...next[categoryId], option];
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (filteredItems.length > 0 && selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i: any) => i.id)));
    }
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus([id], status);
  };

  const handleBulkApprove = () => {
    if (selectedIds.size > 0) {
      updateStatus(Array.from(selectedIds), 'Approved');
    } else {
      updateStatus(filteredItems.map(i => i.id), 'Approved');
    }
  };

  useEffect(() => {
    setKpi({
      characters: (script.Characters || []).length,
      locations: (script.Locations || []).length,
      props: (script.Props || []).length,
      needsReview: needsReviewItems.length,
      duplicates: 0
    });

    setBulkActions(
      <>
        <button onClick={handleBulkApprove} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-xs font-bold text-white transition-colors">Approve Selected</button>
        <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-white transition-colors">Merge</button>
        <button onClick={() => {
          if (selectedIds.size > 0) updateStatus(Array.from(selectedIds), 'Rejected');
        }} className="px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded text-xs font-bold transition-colors">Reject</button>
      </>
    );
  }, [script, needsReviewItems.length, setKpi, setBulkActions, selectedIds]);

  useEffect(() => {
    if (selectedIds.size === 1) {
      setInspectorContent(
        <EntityInspectorPanel 
          entityId={Array.from(selectedIds)[0]} 
          items={allItems} 
          onClose={() => { setSelectedIds(new Set()); setInspectorContent(null); }}
          onUpdateStatus={handleUpdateStatus}
        />
      );
    } else {
      setInspectorContent(null);
    }
  }, [selectedIds, allItems, setInspectorContent]);

  const activeFilterCount = Object.values(activeFilters).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden px-8 pt-6 pb-2 w-full">
      <AdvancedFilterDrawer 
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        categories={filterCategories}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setActiveFilters({})}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden bg-white">
        
        {/* LEFT PANEL: Context Navigation */}
        <ContextNavigation />

        {/* CENTER PANEL: Main Working Area */}
        <div className="flex-1 w-full min-w-0 h-full flex flex-col border-r border-slate-200">
          {filteredItems.length === 0 && !searchQuery && activeFilterCount === 0 ? (
            <EmptyState 
              icon={<FileSearch className="w-12 h-12 text-slate-300" />}
              title={`No ${activeTab} Found`}
              description={`The AI did not extract any ${activeTab.toLowerCase()} from the script. You can manually add them or re-run the extraction.`}
              action={<Button className="bg-red-600 hover:bg-red-500">Run AI Extraction</Button>}
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState 
              icon={<FileSearch className="w-12 h-12 text-slate-300" />}
              title="No results match your filters"
              description="Adjust your search query or filters to find what you're looking for."
              action={<Button variant="outline" onClick={() => {setSearchQuery(''); setActiveFilters({});}}>Clear all filters</Button>}
            />
          ) : (
            <div className="flex flex-col h-full">
              {/* Action Bar for Sort & Filter */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                  {viewMode === 'grid' && (
                    <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                        id="selectAllGrid"
                      />
                      <label htmlFor="selectAllGrid" className="text-xs font-bold text-slate-500 cursor-pointer">Select All</label>
                    </div>
                  )}
                  <div className="text-sm font-semibold text-slate-800">{filteredItems.length} {activeTab}</div>
                  
                  {filteredItems.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleBulkApprove()} 
                      className="h-7 ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 gap-1 px-2"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Approve {selectedIds.size > 0 ? 'Selected' : 'All'}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium cursor-pointer"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                    <option value="status">Status</option>
                  </select>
                  
                  <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                    <button onClick={() => setViewMode('table')} className={`p-1 rounded text-slate-500 transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-red-600 font-bold' : 'hover:bg-slate-200'}`}>
                      <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`p-1 rounded text-slate-500 transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-red-600 font-bold' : 'hover:bg-slate-200'}`}>
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsFilterDrawerOpen(true)} 
                    className="h-8 text-xs font-semibold text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100 gap-1.5 px-3"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-1 bg-red-100 text-red-700 px-1.5 rounded-full text-[10px] font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enterprise Table Rendering */}
              {viewMode === 'table' ? (
                <EnterpriseDataTable />
              ) : (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item: any) => {
                      const isSelected = selectedIds.has(item.id);
                      const conf = Math.round(((item.metadata?.validation?.confidence_score) || 1.0) * 100);
                      const needsReview = item.metadata?.validation?.needs_review;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleSelection(item.id)}
                          className={`relative flex flex-col bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${isSelected ? 'border-red-500 ring-1 ring-red-500 shadow-sm' : 'border-slate-200'}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-2">
                               {isSelected && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                               <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</h4>
                             </div>
                             {needsReview && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                          </div>
                          
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed flex-1">{item.description}</p>
                          )}
                          
                          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.category || item.importance || item.type || 'Generic'}</span>
                            <div className="flex gap-2">
                              {conf < 100 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${conf > 85 ? 'bg-emerald-100 text-emerald-700' : conf > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{conf}%</span>}
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : item.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{item.status || 'Draft'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isAiQualityOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsAiQualityOpen(false)} />
            <div className="relative w-full max-w-sm h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-800">AI Quality Panel</h4>
                </div>
                <button onClick={() => setIsAiQualityOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  The Intelligence Engine has flagged some extracted entities for review. Ensure accurate spelling and mapping before proceeding.
                </p>

                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Needs Review</span>
                      <span className="text-xs font-bold bg-amber-200 text-amber-800 px-1.5 rounded">{needsReviewItems.length}</span>
                    </div>
                    <p className="text-[10px] text-amber-700/80 mb-3">Entities flagged for Unicode mismatches or AI guessing.</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {needsReviewItems.map((issue: any) => (
                        <div key={issue.id} className="text-xs bg-white p-2 rounded-md border border-amber-100 shadow-sm">
                          <div className="font-bold text-slate-800 truncate">{issue.name}</div>
                          {issue.metadata?.latin_name && <div className="text-slate-500 truncate text-[11px] mt-0.5">Transliteration: {issue.metadata.latin_name}</div>}
                          <div className="text-amber-600 font-medium truncate mt-1 text-[11px]">{issue.metadata?.validation?.reason}</div>
                        </div>
                      ))}
                      {needsReviewItems.length === 0 && <div className="text-xs text-slate-500 italic">No items need review.</div>}
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 bg-white text-amber-700 border-amber-200 hover:bg-amber-100" onClick={() => { handleFilterChange('status', 'Needs Review'); setIsAiQualityOpen(false); }}>Filter Needs Review</Button>
                  </div>
                  
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>
                      <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-1.5 rounded">{approvedItems.length}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700/80">Entities that perfectly match script context.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
