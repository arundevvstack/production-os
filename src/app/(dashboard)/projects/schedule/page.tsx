"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Loader2, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Trash2, 
  Wrench, 
  Laptop, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Settings,
  CalendarCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ProductionSchedulePage() {
  const { profile, companyId, roleId, isSuperAdmin, isLoading: isTenantLoading } = useTenant();
  
  // Dialog States
  const [isNewResourceOpen, setIsNewResourceOpen] = useState(false);
  const [isBookResourceOpen, setIsBookResourceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [newResource, setNewResource] = useState({
    name: "",
    type: "Camera",
    status: "available",
    maintenance_status: "good"
  });

  const [newBooking, setNewBooking] = useState({
    resource_id: "",
    project_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  // Supabase Collection Hooks
  const { data: resources, isLoading: isResourcesLoading } = useSupabaseCollection('Resource', {
    where: { company_id: companyId },
    orderBy: { name: 'asc' }
  });

  const { data: bookings, isLoading: isBookingsLoading } = useSupabaseCollection('Booking', {
    where: { company_id: companyId },
    orderBy: { start_date: 'asc' }
  });

  const { data: projects } = useSupabaseCollection('Project', {
    where: { company_id: companyId },
    orderBy: { project_name: 'asc' }
  });

  // --- DERIVED UTILIZATION CALCULATIONS ---
  const utilizationStats = useMemo(() => {
    if (!resources) return { total: 0, booked: 0, maintenance: 0, rate: 0 };
    const total = resources.length;
    const booked = resources.filter(r => r.status === 'booked').length;
    const maintenance = resources.filter(r => r.maintenance_status !== 'good').length;
    const rate = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { total, booked, maintenance, rate };
  }, [resources]);

  // --- CONFLICT & OVERBOOKING DETECTION ENGINE ---
  const detectConflict = (resourceId: string, startStr: string, endStr: string): { conflict: boolean; details?: string } => {
    if (!bookings || bookings.length === 0) return { conflict: false };

    const newStart = new Date(startStr);
    const newEnd = new Date(endStr);

    const overlap = bookings.find(b => {
      if (b.resource_id !== resourceId || b.status !== 'confirmed') return false;
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      // Date range overlap check: (StartA <= EndB && EndA >= StartB)
      return (newStart <= bEnd && newEnd >= bStart);
    });

    if (overlap) {
      const linkedProject = projects?.find(p => p.id === overlap.project_id);
      return { 
        conflict: true, 
        details: `Conflict detected! Reservation overlaps with Project "${linkedProject?.project_name || 'Active Production'}" from ${new Date(overlap.start_date).toLocaleDateString()} to ${new Date(overlap.end_date).toLocaleDateString()}.`
      };
    }

    return { conflict: false };
  };

  // --- ACTIONS ---
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newResource.name) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('Resource').insert({
        company_id: companyId,
        name: newResource.name,
        type: newResource.type,
        status: newResource.status,
        maintenance_status: newResource.maintenance_status
      });

      if (error) throw error;

      toast({ title: "Resource Added", description: `"${newResource.name}" registered in inventory pool.` });
      setIsNewResourceOpen(false);
      setNewResource({ name: "", type: "Camera", status: "available", maintenance_status: "good" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newBooking.resource_id || !newBooking.project_id) return;
    
    // Check conflicts first
    const check = detectConflict(newBooking.resource_id, newBooking.start_date, newBooking.end_date);
    if (check.conflict) {
      toast({
        variant: "destructive",
        title: "Overbooking Blocked",
        description: check.details,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insert reservation log
      const { error: bookingError } = await supabase.from('Booking').insert({
        company_id: companyId,
        resource_id: newBooking.resource_id,
        project_id: newBooking.project_id,
        start_date: new Date(newBooking.start_date).toISOString(),
        end_date: new Date(newBooking.end_date).toISOString(),
        status: 'confirmed'
      });

      if (bookingError) throw bookingError;

      // 2. Mark resource as Booked
      await supabase.from('Resource').update({ status: 'booked' }).eq('id', newBooking.resource_id);

      // 3. Log Activity
      const selectedResource = resources?.find(r => r.id === newBooking.resource_id);
      const selectedProject = projects?.find(p => p.id === newBooking.project_id);
      await supabase.from('ActivityLog').insert({
        company_id: companyId,
        user_id: profile?.id || 'system',
        user_name: profile?.fullName || 'Manager',
        action: 'RESOURCE_BOOKED',
        details: `Reserved resource "${selectedResource?.name}" for Project "${selectedProject?.project_name}".`
      });

      toast({ title: "Resource Reserved", description: "Scheduling lock applied successfully." });
      setIsBookResourceOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Booking Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseResource = async (bookingId: string, resourceId: string) => {
    try {
      // 1. Terminate Reservation
      const { error } = await supabase.from('Booking').delete().eq('id', bookingId);
      if (error) throw error;

      // 2. Set Resource Available
      await supabase.from('Resource').update({ status: 'available' }).eq('id', resourceId);

      toast({ title: "Gear Released", description: "Resource returned to pool inventory." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Release Failed", description: err.message });
    }
  };

  const isLoading = isTenantLoading || isResourcesLoading || isBookingsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
              Fleet & <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-rose-500 to-orange-500">Resource Planner</span>
            </h1>
            <Badge className="bg-slate-900 text-white border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1">
              Realtime Engine
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-2">Manage production spaces, Cine equipment, and creative crews without overbookings.</p>
        </div>
        <div className="flex items-center gap-3">
          {(roleId === 'SUPER_ADMIN' || roleId === 'MANAGER' || isSuperAdmin) && (
            <>
              <Button variant="outline" className="rounded-[10px] border-slate-200 bg-white shadow-sm font-bold text-xs h-12" onClick={() => setIsNewResourceOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Register Item
              </Button>
              <Button className="rounded-[10px] shadow-lg shadow-primary/20 font-bold text-xs h-12 gap-2" onClick={() => setIsBookResourceOpen(true)}>
                <CalendarCheck className="h-4 w-4" /> Book Resource
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Utilization Heatmaps / Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        <Card className="premium-card bg-white shadow-xl border-none rounded-[10px] p-8 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Utilization index</p>
            <div className="h-1 w-8 bg-primary rounded-full"></div>
          </div>
          <div className="py-6 space-y-2">
            <h2 className="text-5xl font-black text-primary tracking-tight">{utilizationStats.rate}%</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Gear Allocations</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${utilizationStats.rate}%` }}></div>
          </div>
        </Card>

        <Card className="premium-card bg-white shadow-xl border-none rounded-[10px] p-8 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inventory Pool</p>
            <div className="h-1 w-8 bg-indigo-500 rounded-full"></div>
          </div>
          <div className="py-6">
            <h2 className="text-5xl font-black text-slate-800 tracking-tight">{utilizationStats.total}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Assets</p>
          </div>
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Fleet Registered
          </p>
        </Card>

        <Card className="premium-card bg-white shadow-xl border-none rounded-[10px] p-8 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Servicing & Maintenance</p>
            <div className="h-1 w-8 bg-amber-500 rounded-full"></div>
          </div>
          <div className="py-6">
            <h2 className="text-5xl font-black text-amber-500 tracking-tight">{utilizationStats.maintenance}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active servicing tickets</p>
          </div>
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> Scheduled checks
          </p>
        </Card>

        <Card className="premium-card bg-slate-900 text-white shadow-xl border-none rounded-[10px] p-8 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Conflict Shield</p>
            <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
          </div>
          <div className="py-6">
            <h2 className="text-4xl font-black text-emerald-400 tracking-tight leading-none">Blocked</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Double-booking blocks active</p>
          </div>
          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Enforced at db layer
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
        {/* Bookings Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" /> Active Timeline
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed reservations</span>
          </div>

          <div className="space-y-4">
            {bookings?.length === 0 ? (
              <Card className="border-2 border-dashed flex flex-col items-center justify-center p-24 text-muted-foreground bg-white rounded-[10px]">
                <CalendarIcon className="h-12 w-12 mb-4 opacity-15" />
                <p className="font-bold text-sm uppercase tracking-widest text-slate-400">No scheduled gear reservations.</p>
                <Button variant="link" className="mt-2 text-primary font-bold text-xs" onClick={() => setIsBookResourceOpen(true)}>Book first item</Button>
              </Card>
            ) : (
              bookings?.map((booking) => {
                const linkedResource = resources?.find(r => r.id === booking.resource_id);
                const linkedProject = projects?.find(p => p.id === booking.project_id);
                return (
                  <Card key={booking.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden rounded-[10px] bg-white">
                    <div className="flex flex-col sm:flex-row">
                      <div className="bg-slate-50 p-6 sm:w-48 flex flex-col justify-center items-center text-center border-r border-slate-100">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">
                          Timeline range
                        </span>
                        <h4 className="font-bold text-sm text-slate-700 leading-tight">
                          {new Date(booking.start_date).toLocaleDateString()}
                        </h4>
                        <span className="text-[10px] text-slate-400 my-1">to</span>
                        <h4 className="font-bold text-sm text-slate-700 leading-tight">
                          {new Date(booking.end_date).toLocaleDateString()}
                        </h4>
                      </div>
                      <div className="flex-1 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
                              {linkedResource?.type === 'Space' ? <MapPin className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            </span>
                            <h4 className="font-black text-lg text-slate-800">{linkedResource?.name || 'Unknown gear'}</h4>
                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase tracking-wider">
                              {linkedResource?.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pl-1">
                            <Laptop className="h-4 w-4 text-slate-400" />
                            Assigned Project: <span className="font-bold text-slate-700">{linkedProject?.project_name || 'Active Campaign'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl"
                            onClick={() => handleReleaseResource(booking.id, booking.resource_id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Resource Pool List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Sliders className="h-6 w-6 text-indigo-500" /> Resource Pool
          </h3>

          <Card className="border-none shadow-xl rounded-[10px] bg-white overflow-hidden p-6">
            <div className="divide-y divide-slate-100">
              {resources?.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic">No registered assets.</div>
              ) : (
                resources?.map((res) => (
                  <div key={res.id} className="py-4 flex items-center justify-between group">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{res.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{res.type} • Status: {res.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-lg border-none shadow-sm",
                        res.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'
                      )}>
                        {res.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Dialog: Add Resource */}
      <Dialog open={isNewResourceOpen} onOpenChange={setIsNewResourceOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Register New Asset
            </DialogTitle>
            <DialogDescription>Add cameras, studios, drones, or crew members to the pool.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateResource} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource Name</Label>
              <Input placeholder="e.g. RED V-Raptor 8K Camera" value={newResource.name} onChange={(e) => setNewResource({...newResource, name: e.target.value})} required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={newResource.type} onValueChange={(val) => setNewResource({...newResource, type: val})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["Camera", "Drone", "Lighting", "Studio", "Editor", "Vehicle", "Audio", "Render System", "Space"].map(type => (
                    <SelectItem key={type} value={type} className="rounded-lg m-1">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Book Resource */}
      <Dialog open={isBookResourceOpen} onOpenChange={setIsBookResourceOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Schedule Reservation
            </DialogTitle>
            <DialogDescription>Reserve gear or space. Overlapping bookings will be blocked automatically.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookResource} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Resource</Label>
              <Select value={newBooking.resource_id} onValueChange={(val) => setNewBooking({...newBooking, resource_id: val})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {resources?.filter(r => r.maintenance_status === 'good').map(r => (
                    <SelectItem key={r.id} value={r.id} className="rounded-lg m-1">{r.name} ({r.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attributed Project</Label>
              <Select value={newBooking.project_id} onValueChange={(val) => setNewBooking({...newBooking, project_id: val})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg m-1">{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={newBooking.start_date} onChange={(e) => setNewBooking({...newBooking, start_date: e.target.value})} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={newBooking.end_date} onChange={(e) => setNewBooking({...newBooking, end_date: e.target.value})} required className="rounded-xl" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Approve Reservation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
