"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Cloud, 
  Search, 
  CheckCircle2, 
  Download, 
  Filter, 
  TrendingUp, 
  Loader2, 
  IndianRupee, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  Briefcase, 
  Building2,
  Share2,
  Mail,
  MessageSquare,
  Copy,
  MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function InvoicesPage() {
  const { profile, isLoading: isTenantLoading, companyId, company } = useTenant();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);

  // Invoice State
  const [newInvoice, setNewInvoice] = useState({
    client_name: "",
    client_id: "",
    project_id: "",
    project_name: "",
    project_ref: "",
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    total: "",
    hsn_sac: "9983",
    gst_type: "Intra-state", // Intra-state (CGST/SGST) or Inter-state (IGST)
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // 1. Fetch Invoices from Supabase
  const { data: invoices, isLoading: isInvoicesLoading } = useSupabaseCollection('Invoice', {
    orderBy: { created_at: 'desc' }
  });

  // 2. Fetch Leads from Supabase
  const { data: leads } = useSupabaseCollection('Lead', {
    orderBy: { company_name: 'asc' }
  });

  // 3. Fetch Projects from Supabase
  const { data: projects } = useSupabaseCollection('Project', {
    orderBy: { project_name: 'asc' }
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newInvoice.client_name) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a client.",
      });
      return;
    }

    setIsSubmitting(true);
    
    const amount = parseFloat(newInvoice.total) || 0;
    
    // --- GST LOGIC ENGINE ---
    const gstRate = 0.18;
    const totalGst = amount * gstRate;
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (newInvoice.gst_type === "Intra-state") {
      cgst = totalGst / 2;
      sgst = totalGst / 2;
    } else if (newInvoice.gst_type === "Inter-state") {
      igst = totalGst;
    }
    // "Export" or "Exempt" would have 0 GST.
    
    const totalWithGst = amount + cgst + sgst + igst;

    const generatedId = typeof window !== 'undefined' && window.crypto?.randomUUID 
      ? window.crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const { error } = await supabase.from('Invoice').insert({
      id: generatedId,
      company_id: companyId,
      invoice_number: newInvoice.invoice_number,
      client_name: newInvoice.client_name,
      client_id: newInvoice.client_id || null,
      project_id: (!newInvoice.project_id || newInvoice.project_id === 'none') ? null : newInvoice.project_id,
      project_name: newInvoice.project_name || null,
      project_ref: newInvoice.project_ref || null,
      subtotal: amount,
      gst_amount: cgst + sgst + igst,
      // Pending SQL Migration:
      // cgst_amount: cgst,
      // sgst_amount: sgst,
      // igst_amount: igst,
      // tax_type: newInvoice.gst_type,
      // hsn_sac: newInvoice.hsn_sac,
      total: totalWithGst,
      payment_status: 'unpaid',
      issue_date: newInvoice.issue_date ? new Date(newInvoice.issue_date).toISOString() : null,
      due_date: newInvoice.due_date ? new Date(newInvoice.due_date).toISOString() : null,
      line_items: [
        {
          description: `${newInvoice.project_name || 'General Production'} Services`,
          unit_price: amount,
          quantity: 1,
          total: amount
        }
      ],
    });

    if (error) {
      console.error("Failed to generate invoice:", error);
      toast({
        variant: "destructive",
        title: "Invoice Generation Failed",
        description: error.message || "A database error occurred.",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Invoice Generated",
      description: `Billing for ${newInvoice.client_name} has been created.`,
    });

    setNewInvoice({ 
      client_name: "", 
      client_id: "",
      project_id: "",
      project_name: "",
      project_ref: "",
      invoice_number: `INV-${Date.now().toString().slice(-6)}`, 
      total: "", 
      hsn_sac: "9983",
      gst_type: "Intra-state",
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!companyId || !invoiceToDelete) return;
    await supabase.from('Invoice').delete().eq('id', invoiceToDelete.id);
    toast({ title: "Invoice Removed", description: "The billing record has been deleted." });
    setInvoiceToDelete(null);
  };

  const handleShareWhatsApp = (inv: any) => {
    const shareUrl = `${window.location.origin}/invoices/${inv.id}`;
    const text = encodeURIComponent(`Hi, please find your invoice ${inv.invoice_number} from ${company?.name || 'DP Media'} here: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = (inv: any) => {
    const shareUrl = `${window.location.origin}/invoices/${inv.id}`;
    const subject = encodeURIComponent(`Invoice ${inv.invoice_number} from ${company?.name || 'DP Media'}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find your invoice ${inv.invoice_number} for the amount of ₹${inv.total.toLocaleString()} attached via the secure link below.\n\nLink: ${shareUrl}\n\nBest regards,\n${profile?.fullName || 'Finance Team'}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = (inv: any) => {
    const shareUrl = `${window.location.origin}/invoices/${inv.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Link Copied", description: "Invoice link ready for distribution." });
    });
  };

  if (isTenantLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOutstanding = invoices?.reduce((sum, inv) => inv.payment_status !== 'paid' ? sum + (inv.total || 0) : sum, 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Invoice and Quote</h1>
          <p className="text-muted-foreground">Automated invoicing and real-time financial synchronization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Cloud className="h-4 w-4" /> Sync Settings
          </Button>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[10px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Issue New Invoice
                </DialogTitle>
                <DialogDescription>
                  Capture the billing details for your client production.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Select 
                    value={newInvoice.client_id} 
                    onValueChange={(val) => {
                      const lead = leads?.find(l => l.id === val);
                      setNewInvoice({ ...newInvoice, client_id: val, client_name: lead?.company_name || "" });
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No clients found.</div>
                      ) : (
                        leads?.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.company_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Production Project (Optional)</Label>
                  <Select 
                    value={newInvoice.project_id} 
                    onValueChange={(val) => {
                      const proj = projects?.find(p => p.id === val);
                      const lead = leads?.find(l => l.company_name === proj?.client_name);
                      setNewInvoice({ 
                        ...newInvoice, 
                        project_id: val,
                        project_name: proj?.project_name || "",
                        project_ref: proj?.project_ref || "",
                        client_name: proj?.client_name || newInvoice.client_name,
                        client_id: lead?.id || newInvoice.client_id,
                        total: proj?.budget ? proj.budget.toString() : newInvoice.total
                      });
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Link to project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (General Billing)</SelectItem>
                      {projects?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No active projects found.</div>
                      ) : (
                        projects?.map((proj) => (
                          <SelectItem key={proj.id} value={proj.id}>
                            {proj.project_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invNum">Invoice #</Label>
                    <Input id="invNum" value={newInvoice.invoice_number} disabled className="rounded-xl bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tot">Base Amount (₹)</Label>
                    <Input 
                      id="tot" 
                      type="number"
                      placeholder="12000" 
                      value={newInvoice.total}
                      onChange={(e) => setNewInvoice({...newInvoice, total: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iss">Issue Date</Label>
                    <Input 
                      id="iss" 
                      type="date"
                      value={newInvoice.issue_date}
                      onChange={(e) => setNewInvoice({...newInvoice, issue_date: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">Due Date</Label>
                    <Input 
                      id="due" 
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstType">Tax Jurisdiction</Label>
                    <Select 
                      value={newInvoice.gst_type} 
                      onValueChange={(val) => setNewInvoice({...newInvoice, gst_type: val})}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Tax Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intra-state">Intra-state (CGST + SGST)</SelectItem>
                        <SelectItem value="Inter-state">Inter-state (IGST)</SelectItem>
                        <SelectItem value="Export">Export / SEZ (0%)</SelectItem>
                        <SelectItem value="Exempt">GST Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsn">HSN / SAC Code</Label>
                    <Input 
                      id="hsn" 
                      value={newInvoice.hsn_sac}
                      onChange={(e) => setNewInvoice({...newInvoice, hsn_sac: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{(parseFloat(newInvoice.total) || 0).toLocaleString()}</span>
                  </div>
                  {newInvoice.gst_type === "Intra-state" && (
                    <>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>CGST (9%):</span>
                        <span>₹{((parseFloat(newInvoice.total) || 0) * 0.09).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>SGST (9%):</span>
                        <span>₹{((parseFloat(newInvoice.total) || 0) * 0.09).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {newInvoice.gst_type === "Inter-state" && (
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>IGST (18%):</span>
                      <span>₹{((parseFloat(newInvoice.total) || 0) * 0.18).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-1.5 mt-1">
                    <span>Total Payable:</span>
                    <span>
                      ₹{
                        newInvoice.gst_type === "Export" || newInvoice.gst_type === "Exempt" 
                        ? (parseFloat(newInvoice.total) || 0).toLocaleString()
                        : ((parseFloat(newInvoice.total) || 0) * 1.18).toLocaleString()
                      }
                    </span>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Finalize & Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Outstanding</p>
            <h4 className="text-2xl font-bold font-headline">₹{totalOutstanding.toLocaleString()}</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <TrendingUp className="h-3 w-3" /> Real-time tracking
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-accent">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Active Invoices</p>
            <h4 className="text-2xl font-bold font-headline">{invoices?.length || 0}</h4>
            <p className="mt-2 text-[10px] text-muted-foreground font-bold">In the billing queue</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Paid to Date</p>
            <h4 className="text-2xl font-bold font-headline">
              ₹{invoices?.reduce((sum, inv) => inv.payment_status === 'paid' ? sum + (inv.total || 0) : sum, 0).toLocaleString()}
            </h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <CheckCircle2 className="h-3 w-3" /> Fully reconciled
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Cloud Sync</p>
            <h4 className="text-2xl font-bold font-headline">Ready</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
              <Cloud className="h-3 w-3" /> Drive/Sheets enabled
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b bg-white">
          <div>
            <CardTitle className="text-xl font-headline">Recent Billing Activity</CardTitle>
            <CardDescription>Real-time line item synchronization across your production ledger.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice #" className="pl-9 h-10 rounded-xl" />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Invoice #</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Context</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Due Date</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right font-bold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">No invoices generated yet.</td>
                  </tr>
                ) : (
                  invoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-primary">{inv.invoice_number}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">{new Date(inv.created_at?.toDate?.() || inv.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold text-sm leading-none">{inv.client_name}</span>
                          </div>
                          {inv.project_name && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3 w-3 text-primary/60" />
                              <span className="text-[10px] text-muted-foreground font-bold">{inv.project_name}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs font-medium">{inv.due_date}</td>
                      <td className="p-4 font-bold">₹{(inv.total || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold py-0.5">
                          {inv.payment_status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-56">
                              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2">Distribute Invoice</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleShareWhatsApp(inv)} className="gap-2 py-2 cursor-pointer">
                                <MessageSquare className="h-4 w-4 text-emerald-500" /> Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareEmail(inv)} className="gap-2 py-2 cursor-pointer">
                                <Mail className="h-4 w-4 text-primary" /> Send via Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCopyLink(inv)} className="gap-2 py-2 cursor-pointer">
                                <Copy className="h-4 w-4 text-slate-500" /> Copy Access Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setInvoiceToDelete(inv)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* STABLE DELETE DIALOG */}
      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent className="rounded-[10px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove invoice {invoiceToDelete?.invoice_number} from your production ledger. This action cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}