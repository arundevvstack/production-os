"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  UserPlus, 
  Loader2, 
  MoreHorizontal,
  CheckCircle2, 
  UserCog,
  UserMinus,
  Sparkles,
  Ban,
  UserCheck,
  Building2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const ENTERPRISE_ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full platform configuration, audit logs, billing, and global settings.' },
  { id: 'MANAGER', name: 'Manager', description: 'Assign tasks, create projects, approve workflows, and activate/suspend crew members.' },
  { id: 'EMPLOYEE', name: 'Employee', description: 'View assigned projects and complete tasks. Zero financial or administrative visibility.' },
  { id: 'ACCOUNTS', name: 'Accounts Team', description: 'Access budgets, invoices, expenses, payroll registers, and financial reporting.' },
  { id: 'MARKETING_SALES', name: 'Marketing & Sales', description: 'Access leads, CRM pipelines, client portfolios, and proposals.' }
];

export default function RBACPage() {
  const { companyId, isLoading: isTenantLoading, profile } = useTenant();
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("EMPLOYEE");
  const [selectedDepartment, setSelectedDepartment] = useState("Production");

  const { data: members, isLoading: isUsersLoading, refetch: reloadMembers } = useSupabaseCollection('User');

  const handleUpdateMemberCredentials = async (memberId: string, newRoleId: string, newDept: string) => {
    if (!memberId) return;
    setMutatingId(memberId);
    
    try {
      const { error } = await supabase
        .from('User')
        .update({ 
          role_id: newRoleId,
          department: newDept
        })
        .eq('id', memberId);

      if (error) throw error;

      // Log activity
      await supabase.from('ActivityLog').insert({
        company_id: companyId,
        user_id: profile?.id || 'system',
        user_name: profile?.fullName || 'Manager',
        action: 'USER_ROLE_UPDATED',
        details: `Updated user ID ${memberId} role to ${newRoleId} and department to ${newDept}.`
      });

      toast({ title: "Role Assignment Modified", description: "Crew member credentials updated successfully." });
      reloadMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsChangeRoleOpen(false);
      setEditingMember(null);
      setMutatingId(null);
    }
  };

  const handleUpdateStatus = async (memberId: string, newStatus: 'approved' | 'suspended') => {
    if (!memberId) return;
    
    if (memberId === profile?.id) {
      toast({
        variant: "destructive",
        title: "Action Forbidden",
        description: "You cannot suspend or deactivate your own administrative profile."
      });
      return;
    }

    setMutatingId(memberId);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'approved' && companyId) {
        updateData.company_id = companyId;
      }

      const { error } = await supabase
        .from('User')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;

      // Log activity
      await supabase.from('ActivityLog').insert({
        company_id: companyId,
        user_id: profile?.id || 'system',
        user_name: profile?.fullName || 'Manager',
        action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_APPROVED',
        details: `Updated user ID ${memberId} status to ${newStatus}.`
      });

      toast({ 
        title: newStatus === 'suspended' ? "Access Revoked" : "Crew Activated", 
        description: newStatus === 'suspended' ? "Account session suspended immediately." : "User has been approved and granted login clearance."
      });
      reloadMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Status Update Failed", description: err.message });
    } finally {
      setMutatingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!memberId) return;
    
    if (memberId === profile?.id) {
      toast({ variant: "destructive", title: "Forbidden", description: "You cannot remove your own profile." });
      return;
    }

    setMutatingId(memberId);
    try {
      const { error } = await supabase
        .from('User')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({ title: "Crew Member Removed", description: "Profile has been successfully deleted." });
      reloadMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Removal Failed", description: err.message });
    } finally {
      setMutatingId(null);
    }
  };

  if (isTenantLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-8 w-8 text-foreground" /> Team Access Control
          </h1>
          <p className="text-muted-foreground font-medium">Approve, suspend, and govern organizational credentials and SaaS department permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Users Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-premium rounded-[10px] overflow-hidden bg-white/40 backdrop-blur-2xl">
            <CardHeader className="p-6 border-b border-border">
              <CardTitle className="text-lg font-black text-foreground">Workspace Directory</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Manage pending crew approvals and deactivations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Crew Member</th>
                      <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Department Role</th>
                      <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Security Status</th>
                      <th className="p-4 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members?.map((member) => (
                      <tr key={member.id} className="hover:bg-muted/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-white shadow">
                              <AvatarFallback className="bg-primary/5 text-foreground text-[10px] font-black">
                                {(member.fullName || member.full_name)?.substring(0,2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-black text-sm text-foreground">{member.fullName || member.full_name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider bg-muted text-muted-foreground/80 px-2 py-0.5 rounded-lg">
                              {ENTERPRISE_ROLES.find(r => r.id === member.role_id)?.name || member.role_id}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider pl-1.5 border-l-2 border-primary/20">
                              {member.department || 'Production'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {member.status === 'approved' && (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Active
                            </div>
                          )}
                          {member.status === 'pending' && (
                            <div className="flex items-center gap-1.5 text-accent font-black text-[10px] uppercase tracking-wider">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pending Approval
                            </div>
                          )}
                          {member.status === 'suspended' && (
                            <div className="flex items-center gap-1.5 text-accent font-black text-[10px] uppercase tracking-wider">
                              <Ban className="h-3.5 w-3.5" /> Suspended
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {mutatingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-foreground ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground/80 hover:bg-muted rounded-xl">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-[10px] w-52 p-1.5 font-body">
                                <DropdownMenuItem 
                                  className="gap-2.5 cursor-pointer py-2 rounded-xl font-bold text-muted-foreground/80 text-xs"
                                  onClick={() => {
                                    setEditingMember(member);
                                    setSelectedRole(member.role_id || "EMPLOYEE");
                                    setSelectedDepartment(member.department || "Production");
                                    setIsChangeRoleOpen(true);
                                  }}
                                >
                                  <UserCog className="h-4 w-4 text-muted-foreground" /> Assign Department Role
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="my-1" />

                                {member.status === 'pending' && (
                                  <DropdownMenuItem 
                                    className="gap-2.5 cursor-pointer py-2 rounded-xl font-bold text-emerald-600 text-xs hover:bg-emerald-50"
                                    onClick={() => handleUpdateStatus(member.id, 'approved')}
                                  >
                                    <UserCheck className="h-4 w-4" /> Approve Crew Member
                                  </DropdownMenuItem>
                                )}

                                {member.status === 'approved' && member.id !== profile?.id && (
                                  <DropdownMenuItem 
                                    className="gap-2.5 cursor-pointer py-2 rounded-xl font-bold text-accent text-xs hover:bg-accent/10"
                                    onClick={() => handleUpdateStatus(member.id, 'suspended')}
                                  >
                                    <Ban className="h-4 w-4" /> Suspend Credentials
                                  </DropdownMenuItem>
                                )}

                                {member.status === 'suspended' && (
                                  <DropdownMenuItem 
                                    className="gap-2.5 cursor-pointer py-2 rounded-xl font-bold text-emerald-600 text-xs hover:bg-emerald-50"
                                    onClick={() => handleUpdateStatus(member.id, 'approved')}
                                  >
                                    <UserCheck className="h-4 w-4" /> Re-Activate Crew
                                  </DropdownMenuItem>
                                )}

                                {member.id !== profile?.id && (
                                  <>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem 
                                      className="gap-2.5 cursor-pointer py-2 rounded-xl font-bold text-accent text-xs hover:bg-accent/10"
                                      onClick={() => handleRemoveMember(member.id)}
                                    >
                                      <UserMinus className="h-4 w-4" /> Expel from Office
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Role Matrix */}
        <div className="space-y-6">
          <Card className="border-none shadow-premium rounded-[10px] overflow-hidden bg-primary text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <CardHeader className="p-6 relative z-10">
              <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                <Lock className="h-5 w-5 text-foreground" /> Active Access Matrix
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Standardized SaaS roles automatically enforced at both routing and database triggers.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 relative z-10 pt-0">
              {ENTERPRISE_ROLES.map((role) => (
                <div key={role.id} className="p-4 rounded-[10px] bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase text-slate-300">{role.name}</span>
                    <Badge className="bg-primary/20 text-foreground text-[8px] font-black border-none tracking-widest uppercase">{role.id}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{role.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role & Department Selector Dialog */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[10px] p-6 font-body">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <UserCog className="h-5.5 w-5.5 text-foreground" /> Assign Crew Credentials
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Reassign {editingMember?.fullName || editingMember?.full_name} to a different operational level and department.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Security Clearance</Label>
              <Select 
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger className="rounded-xl h-12 border-border focus:ring-primary/20">
                  <SelectValue placeholder="Select Clearance Level" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] p-1.5 font-body">
                  {ENTERPRISE_ROLES.map(r => (
                    <SelectItem key={r.id} value={r.id} className="py-2.5 rounded-xl text-xs font-bold text-muted-foreground/80 focus:bg-primary/5 focus:text-foreground">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Enterprise Department</Label>
              <Select 
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="rounded-xl h-12 border-border focus:ring-primary/20">
                  <SelectValue placeholder="Select Business Department" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] p-1.5 font-body">
                  <SelectItem value="Production" className="py-2.5 rounded-xl text-xs font-bold text-muted-foreground/80 focus:bg-primary/5 focus:text-foreground">Production & Crew</SelectItem>
                  <SelectItem value="Creative" className="py-2.5 rounded-xl text-xs font-bold text-muted-foreground/80 focus:bg-primary/5 focus:text-foreground">Creative Operations</SelectItem>
                  <SelectItem value="Finance" className="py-2.5 rounded-xl text-xs font-bold text-muted-foreground/80 focus:bg-primary/5 focus:text-foreground">Accounts & Finance</SelectItem>
                  <SelectItem value="Sales & Marketing" className="py-2.5 rounded-xl text-xs font-bold text-muted-foreground/80 focus:bg-primary/5 focus:text-foreground">Sales & Marketing</SelectItem>
                  <SelectItem value="Administration" className="py-2.5 rounded-xl text-xs font-bold text-muted-foreground/80 focus:bg-primary/5 focus:text-foreground">General Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 md:gap-0">
            <Button variant="outline" onClick={() => {
              setIsChangeRoleOpen(false);
              setEditingMember(null);
            }} className="rounded-xl h-11 w-full md:w-auto font-bold border-border">Cancel</Button>
            <Button 
              onClick={() => handleUpdateMemberCredentials(editingMember?.id, selectedRole, selectedDepartment)} 
              className="rounded-xl h-11 w-full md:w-auto font-bold bg-primary hover:bg-primary/95 text-white"
              disabled={mutatingId === editingMember?.id}
            >
              {mutatingId === editingMember?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}