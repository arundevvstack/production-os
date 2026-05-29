
"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Loader2, 
  Building2, 
  Film, 
  Search,
  AlertTriangle,
  History,
  Info,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ArchivesPage() {
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [itemToRestore, setItemToRestore] = useState<any>(null);
  const [localArchives, setLocalArchives] = useState<any[] | null>(null);

  // Fetch Archives from Supabase
  const { data: archives, isLoading: isArchivesLoading, refetch } = useSupabaseCollection('Archive', {
    where: { company_id: companyId },
    orderBy: { archived_at: 'desc' }
  });

  // Sync server data to local state (only when server data changes)
  const effectiveArchives = localArchives ?? archives ?? [];

  // Normalize: each archive row has a 'data' JSON field with the actual record fields
  const normalizedArchives = useMemo(() => {
    return effectiveArchives.map((item: any) => {
      const nested = item.data ?? {};
      return {
        ...nested,
        // Always keep Archive row's own fields as top-level (they take precedence)
        id: item.id,
        company_id: item.company_id,
        archive_type: item.archive_type,
        archived_at: item.archived_at ?? item.created_at,
        // Ensure display name fields are accessible
        company_name: nested.company_name || nested.name || null,
        project_name: nested.project_name || nested.name || null,
      };
    });
  }, [effectiveArchives]);

  const filteredArchives = useMemo(() => {
    return normalizedArchives.filter(item =>
      (item.company_name || item.project_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [normalizedArchives, searchQuery]);

  const clients = useMemo(() => filteredArchives.filter(i => i.archive_type === 'client'), [filteredArchives]);
  const prospects = useMemo(() => filteredArchives.filter(i => i.archive_type === 'prospect' || i.archive_type === 'lead'), [filteredArchives]);
  const projects = useMemo(() => filteredArchives.filter(i => i.archive_type === 'project'), [filteredArchives]);

  const handlePermanentDelete = useCallback(async () => {
    if (!companyId || !itemToDelete) return;

    // Optimistic UI: remove instantly
    setLocalArchives(prev => (prev ?? archives ?? []).filter((a: any) => a.id !== itemToDelete.id));

    const { error } = await supabase.from('Archive').delete().eq('id', itemToDelete.id);

    if (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      // Rollback
      setLocalArchives(null);
      refetch();
    } else {
      toast({
        variant: "destructive",
        title: "Permanent Purge Complete",
        description: "Data has been scrubbed from the workspace vault."
      });
    }
    setItemToDelete(null);
  }, [companyId, itemToDelete, archives, refetch]);

  const handleRestore = useCallback(async () => {
    if (!companyId || !itemToRestore) return;

    const item = itemToRestore;
    let targetTable = 'Project';
    if (item.archive_type === 'client') targetTable = 'Client';
    else if (item.archive_type === 'prospect' || item.archive_type === 'lead') targetTable = 'Prospect';

    // Optimistic UI: remove from archive list
    setLocalArchives(prev => (prev ?? archives ?? []).filter((a: any) => a.id !== item.id));

    // The original data was saved in item.data — re-insert it into the proper table
    const originalData = item.data ?? {};
    // Remove archive-specific and meta fields before restoring
    const { archive_type: _at, archived_at: _aa, ...restorable } = originalData;

    const { error: restoreError } = await supabase.from(targetTable).upsert({
      ...restorable,
    });

    if (restoreError) {
      toast({ variant: "destructive", title: "Restoration Failed", description: restoreError.message });
      // Rollback
      setLocalArchives(null);
      refetch();
      setItemToRestore(null);
      return;
    }

    await supabase.from('Archive').delete().eq('id', item.id);

    toast({
      title: "Record Restored",
      description: `"${item.company_name || item.project_name}" is back in the active workspace.`
    });
    setItemToRestore(null);
  }, [companyId, itemToRestore, archives, refetch]);

  if (isTenantLoading || isArchivesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tighter">Workspace Vault</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Archive className="h-3.5 w-3.5" /> Decommissioned clients and projects for audit or recovery.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault..."
            className="pl-10 h-11 rounded-[10px] bg-white shadow-sm border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-soft bg-accent/10 border border-accent/20 rounded-[10px]">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-accent shadow-sm shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-accent text-sm">Vault Retention Policy</h4>
            <p className="text-xs text-accent/70 leading-relaxed">
              Archived items are retained indefinitely until you choose to <strong>Permanently Delete</strong> them.
              Restoring an item will move it back to its original production or CRM stage.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="bg-white/50 border p-1 rounded-[10px] mb-8 h-auto flex-wrap">
          <TabsTrigger value="clients" className="rounded-xl px-8 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest">
            <Building2 className="h-4 w-4" /> Archived Clients ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="prospects" className="rounded-xl px-8 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest">
            <Users className="h-4 w-4" /> Archived Leads ({prospects.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-xl px-8 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest">
            <Film className="h-4 w-4" /> Archived Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.length === 0 ? (
              <EmptyState icon={Building2} label="No archived clients found." />
            ) : (
              clients.map(item => (
                <ArchiveCard
                  key={item.id}
                  item={item}
                  onRestore={setItemToRestore}
                  onDelete={setItemToDelete}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="prospects" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prospects.length === 0 ? (
              <EmptyState icon={Users} label="No archived leads found." />
            ) : (
              prospects.map(item => (
                <ArchiveCard
                  key={item.id}
                  item={item}
                  onRestore={setItemToRestore}
                  onDelete={setItemToDelete}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
              <EmptyState icon={Film} label="No archived projects found." />
            ) : (
              projects.map(item => (
                <ArchiveCard
                  key={item.id}
                  item={item}
                  onRestore={setItemToRestore}
                  onDelete={setItemToDelete}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* CONFIRMATION DIALOGS */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-[10px] p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-accent/10 rounded-[10px] flex items-center justify-center text-accent mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Confirm Permanent Purge?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-base">
              You are about to permanently delete <strong>{itemToDelete?.company_name || itemToDelete?.project_name}</strong>.
              This action is irreversible and will scrub all associated metadata from your cloud records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-accent hover:bg-accent rounded-xl h-12 font-black uppercase text-xs tracking-widest px-8">
              Scrub Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToRestore} onOpenChange={(open) => !open && setItemToRestore(null)}>
        <AlertDialogContent className="rounded-[10px] p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-emerald-50 rounded-[10px] flex items-center justify-center text-emerald-600 mb-4">
              <RotateCcw className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Restore to Active?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              This will move <strong>{itemToRestore?.company_name || itemToRestore?.project_name}</strong> back into your main workspace operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 font-black uppercase text-xs tracking-widest px-8">
              Confirm Restoration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ArchiveCard({ item, onRestore, onDelete }: { item: any, onRestore: (i: any) => void, onDelete: (i: any) => void }) {
  const displayName = item.company_name || item.project_name || item.name || "Unknown";
  const archivedDate = item.archived_at ? new Date(item.archived_at).toLocaleDateString() : "Unknown date";

  return (
    <Card className="border-none shadow-sm rounded-[10px] overflow-hidden group bg-white hover:shadow-md transition-all">
      <CardHeader className="bg-muted/50 pb-4 px-6 pt-6">
        <div className="flex justify-between items-start">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-muted-foreground shadow-sm">
            {item.archive_type === 'project' ? <Film className="h-5 w-5" /> :
             (item.archive_type === 'prospect' || item.archive_type === 'lead') ? <Users className="h-5 w-5" /> :
             <Building2 className="h-5 w-5" />}
          </div>
          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-border text-muted-foreground">
            {item.archive_type || "Archived"}
          </Badge>
        </div>
        <CardTitle className="text-lg font-bold mt-4 truncate">
          {displayName}
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5 mt-1">
          <History className="h-3 w-3" /> Moved to vault on {archivedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white border-t border-slate-50 flex items-center gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest gap-2"
          onClick={() => onRestore(item)}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl h-10 w-10 text-accent hover:text-accent hover:bg-accent/10"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="col-span-full py-24 text-center bg-white rounded-[10px] border-2 border-dashed text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-4 opacity-10" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
