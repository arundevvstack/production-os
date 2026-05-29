"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Sparkles, User, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedClientSelectorProps {
  companyId: string;
  value?: string;
  onSelect: (clientData: {
    company_name: string;
    industry: string;
    service_vertical: string;
    sub_vertical: string;
    email: string;
    contact_person: string;
    gstin: string;
    billing_address: string;
  }) => void;
  placeholder?: string;
  className?: string;
  showOnboardOption?: boolean;
  onOnboardTrigger?: () => void;
}

export function UnifiedClientSelector({
  companyId,
  value,
  onSelect,
  placeholder = "Search clients & prospects...",
  className,
  showOnboardOption = true,
  onOnboardTrigger
}: UnifiedClientSelectorProps) {
  // Query all relationship entities from Prospect and Client tables
  const { data: leads, isLoading: isLeadsLoading } = useSupabaseCollection('Prospect', {
    where: { company_id: companyId },
    orderBy: { company_name: 'asc' }
  });

  const { data: clients, isLoading: isClientsLoading } = useSupabaseCollection('Client', {
    where: { company_id: companyId },
    orderBy: { name: 'asc' }
  });

  const isLoading = isLeadsLoading || isClientsLoading;

  // Consolidate relationship records by company name without duplication
  const consolidatedClients = useMemo(() => {
    const clientMap: Record<string, {
      company_name: string;
      industry: string;
      service_vertical: string;
      sub_vertical: string;
      email: string;
      contact_person: string;
      gstin: string;
      billing_address: string;
      isPartner: boolean;
      leadsCount: number;
    }> = {};

    if (clients) {
      clients.forEach(c => {
        const name = c.name?.trim();
        if (!name) return;
        clientMap[name] = {
          company_name: name,
          industry: c.industry || "Luxury & Lifestyle",
          service_vertical: c.service_vertical || "General Production",
          sub_vertical: c.sub_vertical || "",
          email: c.email || "",
          contact_person: c.contact_person || "",
          gstin: c.gstin || "",
          billing_address: c.billing_address || "",
          isPartner: true,
          leadsCount: 0
        };
      });
    }

    if (leads) {
      leads.forEach(l => {
        const name = l.company_name?.trim();
        if (!name) return;

        const isCurrentPartner = l.stage === 'client' || l.stage === 'won';
        
        if (!clientMap[name]) {
          clientMap[name] = {
            company_name: name,
            industry: l.industry || "Luxury & Lifestyle",
            service_vertical: l.service_vertical || "General Production",
            sub_vertical: l.sub_vertical || "",
            email: l.email || "",
            contact_person: l.contact_person || "",
            gstin: l.gstin || "",
            billing_address: l.billing_address || "",
            isPartner: isCurrentPartner,
            leadsCount: 1
          };
        } else {
          clientMap[name].leadsCount += 1;
          // Elevate properties to master onboarded values if this record is a confirmed client
          if (isCurrentPartner && !clientMap[name].isPartner) {
            clientMap[name].isPartner = true;
          }
          if (!clientMap[name].gstin && l.gstin) clientMap[name].gstin = l.gstin;
          if (!clientMap[name].billing_address && l.billing_address) clientMap[name].billing_address = l.billing_address;
          if (!clientMap[name].contact_person && l.contact_person) clientMap[name].contact_person = l.contact_person;
          if (!clientMap[name].email && l.email) clientMap[name].email = l.email;
        }
      });
    }

    return Object.values(clientMap).sort((a, b) => a.company_name.localeCompare(b.company_name));
  }, [leads, clients]);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex gap-2 items-center w-full" ref={containerRef}>
      <div className="relative w-full">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between px-3 w-full font-normal shadow-sm", className)}
          onClick={() => setOpen(!open)}
        >
          {value ? (
            <div className="flex items-center gap-2 text-foreground w-[90%] overflow-hidden">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-bold text-foreground truncate">{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm font-normal">{isLoading ? "Loading Registry..." : placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {open && (
          <div className="absolute top-[calc(100%+4px)] left-0 w-full z-[100] bg-white dark:bg-slate-900 rounded-[10px] shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <Command>
            <CommandInput placeholder="Search registry..." className="h-10 text-xs font-medium" />
            <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">No client entities found.</CommandEmpty>
              <CommandGroup>
                {consolidatedClients.map((client) => (
                  <CommandItem
                    key={client.company_name}
                    value={client.company_name}
                    onSelect={() => {
                      onSelect(client);
                      setOpen(false);
                    }}
                    className="text-xs cursor-pointer py-2.5 rounded-xl my-0.5 aria-selected:bg-destructive/10 aria-selected:text-destructive"
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2 overflow-hidden w-[70%]">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-bold text-foreground truncate">{client.company_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={client.isPartner ? "bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black uppercase" : "bg-accent/10 text-accent border border-accent/20 text-[8px] font-black uppercase"}>
                          {client.isPartner ? "Partner" : "Prospect"}
                        </Badge>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
      </div>

      {showOnboardOption && onOnboardTrigger && (
        <button
          type="button"
          onClick={onOnboardTrigger}
          className="h-11 px-4 rounded-[10px] bg-primary text-white hover:bg-primary transition-colors shrink-0 flex items-center justify-center shadow-sm"
          title="Onboard New Partner"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
