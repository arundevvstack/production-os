
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  CreditCard, 
  Banknote,
  Search,
  MoreVertical,
  Loader2,
  TrendingUp,
  History,
  Sparkles,
  Receipt,
  FileCheck,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  BrainCircuit,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Briefcase,
  PieChart,
  Target,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Cpu,
  Trash2,
  X,
  Filter,
  ListTree
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameMonth } from "date-fns";
import { consultAIAccountant, type AIAccountantOutput } from "@/ai/flows/ai-accountant-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const PRODUCTION_CATEGORIES_MAP: Record<string, string[]> = {
  "Talent & Crew": [
    "Lead Actor", "Supporting Actor", "Director", "DOP", "Editor", 
    "Gaffer", "Makeup Artist", "Stylist", "Production Manager", "Runner"
  ],
  "Equipment Rental": [
    "Camera Body", "Lenses", "Lighting Kit", "Grip Gear", "Sound Recorder", 
    "Drone", "Monitor", "Data Storage"
  ],
  "Location & Studio": [
    "Studio Floor", "Outdoor Permit", "Private Property", "Set Design", "Location Scouting"
  ],
  "Post-Production": [
    "Assembly Edit", "Color Grading", "Sound Mix", "VFX/CGI", "Music Licensing", "Subtitles"
  ],
  "Logistics & Travel": [
    "Airfare", "Local Transport", "Accommodation", "Shipping/Freight"
  ],
  "Catering & Craft": [
    "On-set Meals", "Snacks/Coffee", "Crew Dinner"
  ],
  "Marketing & PR": [
    "Social Media Ads", "PR Distribution", "Printing/Posters", "Event Launch"
  ],
  "General Overhead": [
    "Office Rent", "Electricity/Net", "Software Subscriptions", "Legal/CA Fees"
  ],
  "Software & Tools": [
    "Adobe CC", "DaVinci Resolve", "Project Mgmt Tools", "Cloud Storage"
  ],
  "Other": ["Misc", "Contingency"]
};

export default function AccountsPage() {
  const { companyId, isLoading: isTenantLoading, company, roleId, isSuperAdmin } = useTenant();
  
  // Strict page-level permission guard (Phase 3)
  const isAuthorized = roleId === 'SUPER_ADMIN' || roleId === 'ACCOUNTS' || isSuperAdmin;
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddAccountOpen, setIsAddOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Deletion State
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);

  // AI State
  const [isAIResultOpen, setIsAIResultOpen] = useState(false);
  const [aiAdvice, setAIAdvice] = useState<AIAccountantOutput | null>(null);
  const [isConsultingAI, setIsConsultingAI] = useState(false);

  // Form State
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "Bank",
    balance: "",
    account_number: "",
    bank_name: ""
  });

  const [newExpense, setNewExpense] = useState({
    category: "Talent & Crew",
    sub_category: "Director",
    description: "",
    amount: "",
    gst_amount: "",
    tax_type: "None",
    vendor_name: "",
    date: new Date().toISOString().split('T')[0],
    account_id: "",
    project_id: "none",
    status: "Pending",
    approval_status: "Pending"
  });

  // 1. Fetch BankAccounts from Supabase (filtered by company)
  const { data: accounts, isLoading: isAccountsLoading, refetch: refetchAccounts } = useSupabaseCollection('BankAccount', {
    where: companyId ? { company_id: companyId } : undefined,
    orderBy: { created_at: 'desc' }
  });

  const [isSeeding, setIsSeeding] = useState(false);
  const handleSeedDemoAccounts = async () => {
    if (!companyId || isSeeding) return;
    setIsSeeding(true);
    try {
      const demoAccounts = [
        { company_id: companyId, name: "Main Operating Account", type: "Bank", balance: 1450000, account_number: "XXXX-1234", bank_name: "HDFC Bank" },
        { company_id: companyId, name: "Tax Reserve", type: "Bank", balance: 320000, account_number: "XXXX-5678", bank_name: "ICICI Bank" },
      ];
      const { error } = await supabase.from('BankAccount').insert(demoAccounts);
      if (error) throw error;
      toast({ title: "Accounts Synced", description: "Default organizational accounts registered." });
      refetchAccounts();
    } catch(e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Sync Failed", description: e.message || "Could not seed default accounts." });
    } finally {
      setIsSeeding(false);
    }
  };

  // 2. Fetch Expenses from Supabase (filtered by company)
  const { data: expenses, isLoading: isExpensesLoading, refetch: refetchExpenses } = useSupabaseCollection('Expense', {
    where: companyId ? { company_id: companyId } : undefined,
    orderBy: { date: 'desc' }
  });

  // 3. Fetch Invoices for GST calculation from Supabase (filtered by company)
  const { data: invoices, isLoading: isInvoicesLoading } = useSupabaseCollection('Invoice', {
    where: companyId ? { company_id: companyId } : undefined,
    orderBy: { issue_date: 'desc' }
  });

  // 4. Fetch Filing Records from Supabase (filtered by company)
  const { data: filings } = useSupabaseCollection('GSTFiling', {
    where: companyId ? { company_id: companyId } : undefined,
    orderBy: { submitted_at: 'desc' }
  });

  // 5. Fetch Projects for Expense Attribution from Supabase (filtered by company)
  const { data: projects } = useSupabaseCollection('Project', {
    where: companyId ? { company_id: companyId } : undefined,
    orderBy: { project_name: 'asc' }
  });

  // --- DERIVED CALCULATIONS ---

  const totalLiquidity = useMemo(() => {
    return accounts?.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0) || 0;
  }, [accounts]);

  const totalExpensesMonth = useMemo(() => {
    if (!expenses) return 0;
    const now = new Date();
    return expenses
      .filter(e => isSameMonth(new Date(e.date), now))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (projectFilter === 'all') return expenses;
    if (projectFilter === 'overhead') return expenses.filter(e => !e.project_id || e.project_id === 'none');
    return expenses.filter(e => e.project_id === projectFilter);
  }, [expenses, projectFilter]);

  const gstStats = useMemo(() => {
    if (!invoices) return { output: 0, periods: [] };
    
    const aggregatedData: Record<string, any> = {};
    let totalOutput = 0;

    invoices.forEach(inv => {
      const date = new Date(inv.issue_date);
      let periodKey = format(date, 'MMM yyyy');

      const amount = inv.gst_amount || 0;
      totalOutput += amount;

      if (!aggregatedData[periodKey]) {
        const existingFiling = filings?.find(f => f.period === periodKey);
        aggregatedData[periodKey] = {
          period: periodKey,
          output: 0,
          status: existingFiling ? 'Filed' : 'Pending',
          arn: existingFiling?.arn_number || null,
          count: 0
        };
      }
      aggregatedData[periodKey].output += amount;
      aggregatedData[periodKey].count += 1;
    });

    return {
      output: totalOutput,
      periods: Object.values(aggregatedData).sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
    };
  }, [invoices, filings]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newAccount.name) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('BankAccount').insert({
        company_id: companyId,
        name: newAccount.name,
        type: newAccount.type,
        balance: parseFloat(newAccount.balance) || 0,
        account_number: newAccount.account_number || null,
        bank_name: newAccount.bank_name || null
      });

      if (error) throw error;

      toast({ title: "Account Registered", description: `${newAccount.name} added to the vault.` });
      setNewAccount({ name: "", type: "Bank", balance: "", account_number: "", bank_name: "" });
      setIsAddOpen(false);
      refetchAccounts();
    } catch(err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newExpense.description || !newExpense.amount) return;

    setIsSubmitting(true);
    try {
      const amountVal = parseFloat(newExpense.amount) || 0;
      const { error } = await supabase.from('Expense').insert({
        company_id: companyId,
        category: newExpense.category,
        sub_category: newExpense.sub_category,
        description: newExpense.description,
        amount: amountVal,
        date: newExpense.date,
        status: newExpense.status,
        account_id: newExpense.account_id === 'none' ? null : newExpense.account_id,
        project_id: newExpense.project_id === 'none' ? null : newExpense.project_id,
        notes: `Vendor: ${newExpense.vendor_name} | Tax Type: ${newExpense.tax_type} | GST Amount: ${newExpense.gst_amount} | Approval: ${newExpense.approval_status}`,
      });

      if (error) throw error;

      // Update bank account balance if account is selected and status is 'Paid'
      if (newExpense.account_id && newExpense.account_id !== 'none' && newExpense.status === 'Paid') {
        const selectedAcc = accounts?.find(a => a.id === newExpense.account_id);
        if (selectedAcc) {
          const newBalance = (parseFloat(selectedAcc.balance) || 0) - amountVal;
          const { error: balanceErr } = await supabase
            .from('BankAccount')
            .update({ balance: newBalance })
            .eq('id', newExpense.account_id);
          if (balanceErr) console.error("Balance update failed:", balanceErr.message);
        }
      }

      toast({ title: "Expense Recorded", description: `${newExpense.category} cost has been added to ledger.` });
      setNewExpense({ category: "Talent & Crew", sub_category: "Director", description: "", amount: "", gst_amount: "", tax_type: "None", vendor_name: "", date: new Date().toISOString().split('T')[0], account_id: "", project_id: "none", status: "Pending", approval_status: "Pending" });
      setIsLogExpenseOpen(false);
      refetchExpenses();
      refetchAccounts();
    } catch(err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Recording Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!companyId || !accountToDelete) return;
    try {
      const { error } = await supabase
        .from('BankAccount')
        .delete()
        .eq('id', accountToDelete.id)
        .eq('company_id', companyId);

      if (error) throw error;

      toast({ title: "Vault Decommissioned", description: `"${accountToDelete.name}" has been removed.` });
      refetchAccounts();
    } catch(err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    } finally {
      setAccountToDelete(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (!companyId || !expenseToDelete) return;
    const { error } = await supabase
      .from('Expense')
      .delete()
      .eq('id', expenseToDelete.id)
      .eq('company_id', companyId);

    if (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } else {
      toast({ title: "Expense Purged", description: "Record removed from ledger." });
      refetchExpenses();
    }
    setExpenseToDelete(null);
  };

  const handleConsultAI = async () => {
    if (!company || isConsultingAI) return;

    setIsConsultingAI(true);
    try {
      const pendingPeriods = gstStats.periods.filter(m => m.status === 'Pending').map(m => m.period);
      const advice = await consultAIAccountant({
        companyName: company.name || "DP Studio",
        totalLiquidity,
        totalGstOutput: gstStats.output,
        pendingPeriods,
        billingVelocity: invoices?.length && invoices.length > 5 ? "High volume production billing" : "Stable periodic billing"
      });
      setAIAdvice(advice);
      setIsAIResultOpen(true);
    } catch (error) {
      console.error("AI Consultant failed:", error);
      toast({ variant: "destructive", title: "AI Offline", description: "Our AI accountant is taking a short break." });
    } finally {
      setIsConsultingAI(false);
    }
  };

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-6 font-body">
        <div className="p-4 bg-accent/10 rounded-full text-accent shadow-xl shadow-rose-100/50">
          <Lock className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground tracking-tight">Security Clearance Blocked</h2>
          <p className="text-muted-foreground font-medium max-w-sm">You do not possess the required credentials to access the organizational finance vaults.</p>
        </div>
        <Link href="/dashboard">
          <Button className="rounded-xl h-11 px-6 font-bold gap-2">
             Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (isAccountsLoading || isExpensesLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Accounts & <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">Finance</span>
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#de3b3b] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <ShieldCheck className="h-3 w-3" /> SECURED
            </div>
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2 mt-2">
            <Cpu className="h-3.5 w-3.5" /> AUTOMATED FINANCIAL MANAGEMENT
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-end">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-transparent h-10 gap-6 w-full justify-start p-0">
              {['overview', 'expenses', 'gst'].map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab} 
                  className="rounded-full px-5 py-2 h-auto text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-[#db3131] data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-muted-foreground hover:text-foreground border border-transparent"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex gap-3 w-full sm:w-auto">
            {activeTab === 'overview' && (
              <Button onClick={() => setIsAddOpen(true)} className="h-10 px-6 rounded-md bg-[#d93030] hover:bg-[#c22b2b] text-white text-[11px] font-bold shadow-md shadow-red-900/10 transition-all w-full sm:w-auto border-b-[3px] border-black/20 active:border-b-0 active:translate-y-[3px]">
                <Plus className="h-4 w-4 mr-1.5" /> Add Account
              </Button>
            )}
            {activeTab === 'expenses' && (
              <Button onClick={() => setIsLogExpenseOpen(true)} className="h-10 px-6 rounded-md bg-[#d93030] hover:bg-[#c22b2b] text-white text-[11px] font-bold shadow-md shadow-red-900/10 transition-all w-full sm:w-auto border-b-[3px] border-black/20 active:border-b-0 active:translate-y-[3px]">
                <Plus className="h-4 w-4 mr-1.5" /> Add Expense
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
            
            <Card className="bg-white dark:bg-slate-900 text-foreground rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 relative group">
              <div className="absolute top-8 right-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Wallet className="h-20 w-20" />
              </div>
              <CardContent className="p-7 space-y-6 relative z-10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Total Balance</p>
                  <h2 className="text-5xl font-black tracking-tight text-foreground">₹{totalLiquidity.toLocaleString()}</h2>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-3">
                    <TrendingUp className="h-3 w-3" /> Live Updates Active
                  </p>
                </div>
                <div className="pt-6">
                  <div className="inline-flex items-center px-4 py-1.5 bg-white dark:bg-slate-800 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-foreground shadow-sm">
                    Secure System
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 text-foreground rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
              <CardContent className="p-7 flex flex-col h-full justify-between">
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-6">Monthly Spending</p>
                   <div className="space-y-3">
                     <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-foreground">Total Expenses</span>
                       <span className="text-2xl font-black text-foreground">₹{totalExpensesMonth.toLocaleString()}</span>
                     </div>
                     <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-slate-200 dark:bg-slate-700 rounded-full transition-all duration-1000" 
                         style={{ width: `${Math.min((totalExpensesMonth / (totalLiquidity || 1)) * 100, 100)}%` }} 
                       ></div>
                     </div>
                   </div>
                </div>
                <div className="pt-8">
                  <div className="inline-flex items-center px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest leading-none">
                      Budget Usage: {((totalExpensesMonth / (totalLiquidity || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 text-foreground rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 relative group">
              <CardContent className="p-7 flex flex-col h-full justify-between relative z-10">
                <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                  <Cpu className="h-20 w-20" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">Remaining Balance</p>
                  <h3 className="text-4xl font-black tracking-tight text-foreground">₹{(totalLiquidity - totalExpensesMonth).toLocaleString()}</h3>
                </div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-[150px] pt-8">
                  Available funds for the current billing cycle.
                </p>
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2 mt-8">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-500">
                    <Building2 className="h-4 w-4" />
                   </div>
                   Connected Accounts
                </h3>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{accounts?.length || 0} Accounts</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {accounts?.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No active accounts found</p>
                    <div className="flex justify-center gap-4 mt-6">
                      <Button className="h-9 px-5 rounded-md bg-white border border-slate-200 text-foreground hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest shadow-sm" onClick={() => setIsAddOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Account
                      </Button>
                      <Button variant="ghost" className="h-9 px-5 rounded-md text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-slate-50" onClick={handleSeedDemoAccounts} disabled={isSeeding}>
                        {isSeeding ? "Syncing..." : "Seed Default"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  accounts?.map((acc) => (
                    <Card key={acc.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className="h-10 w-10 rounded-xl bg-[#2b2b2b] text-white flex items-center justify-center shadow-md">
                            {acc.type === 'Bank' ? <Building2 className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-5 rounded-full border-2 border-slate-200 flex items-center p-0.5 opacity-50"></div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-50">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="text-red-600 font-bold cursor-pointer" onClick={() => setAccountToDelete(acc)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="space-y-1 mb-6">
                          <h4 className="font-bold text-xl tracking-tight text-foreground">{acc.name}</h4>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {acc.bank_name || 'BUSINESS RESERVE'}
                          </p>
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Available Balance</p>
                          <p className="text-2xl font-black text-foreground tracking-tight">₹{Number(acc.balance).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-500">
                  <History className="h-4 w-4" />
                </div>
                Financial Pulse
              </h3>
              <Card className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-[300px]">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  {(!expenses || expenses.length === 0) ? (
                    <div className="text-center flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
                        <History className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Zero operational movements.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto custom-scrollbar">
                      {expenses?.slice(0, 8).map((ex) => (
                        <div key={ex.id} className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{ex.description}</p>
                            <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.1em] mt-0.5">{ex.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-red-500">-₹{ex.amount?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 px-2">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-white dark:bg-slate-900 rounded-[10px] overflow-hidden border-border shadow-xl">
                <CardHeader className="bg-white/5 dark:bg-slate-900/5 border-b border-border px-10 py-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter text-foreground">Expense History</CardTitle>
                      <CardDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Full list of all business transactions.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                          <SelectTrigger className="pl-12 w-[220px] rounded-[10px] h-12 text-[10px] font-black uppercase tracking-widest bg-white/5 dark:bg-slate-900/5 border-border text-white focus:ring-primary/20 shadow-xl backdrop-blur-xl">
                            <SelectValue placeholder="Filter by Unit" />
                          </SelectTrigger>
                          <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                            <SelectItem value="all" className="text-xs font-bold rounded-xl m-1">All Expenses</SelectItem>
                            <SelectItem value="overhead" className="text-xs font-bold rounded-xl m-1">General Overhead</SelectItem>
                            {projects?.map(p => (
                              <SelectItem key={p.id} value={p.id} className="text-xs font-bold rounded-xl m-1">{p.project_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" className="h-12 px-6 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white hover:bg-white/10 dark:bg-slate-900/10 font-black text-[10px] uppercase tracking-widest shadow-xl gap-3 transition-all active:scale-95">
                        <Download className="h-4 w-4 text-foreground" /> Download Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm min-w-[850px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-10 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Timestamp</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Classification</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Description</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Attribution</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Amount</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                          <th className="px-10 py-5 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredExpenses?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-10 py-32 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 italic">No operational movements detected.</td>
                          </tr>
                        ) : (
                          filteredExpenses?.map((ex) => {
                            const linkedProject = projects?.find(p => p.id === ex.project_id);
                            return (
                              <tr key={ex.id} className="hover:bg-muted transition-all group">
                                <td className="px-10 py-8 text-muted-foreground font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{format(new Date(ex.date), 'MMM dd, yyyy')}</td>
                                <td className="px-8 py-8">
                                  <div className="flex flex-col gap-2">
                                    <Badge className="bg-primary text-white border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 w-fit rounded-lg shadow-lg shadow-primary/20">{ex.category}</Badge>
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] ml-1">{ex.sub_category}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-8 font-black text-white text-base tracking-tighter">{ex.description}</td>
                                <td className="px-8 py-8">
                                  {linkedProject ? (
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border bg-white/5 dark:bg-slate-900/5 text-white py-1.5 px-4 rounded-full truncate max-w-[150px]">
                                      {linkedProject.project_name}
                                    </Badge>
                                  ) : (
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">General Ops</span>
                                  )}
                                </td>
                                <td className="px-8 py-8 font-black text-accent text-xl tracking-tighter whitespace-nowrap">₹{ex.amount?.toLocaleString()}</td>
                                <td className="px-8 py-8">
                                  <div className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border shadow-xl backdrop-blur-md",
                                    ex.status === 'Paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-accent/10 text-accent border-accent/20"
                                  )}>
                                    <div className={cn("h-2 w-2 rounded-full", ex.status === 'Paid' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-accent shadow-[0_0_8px_rgba(251,191,36,0.5)]")}></div>
                                    {ex.status}
                                  </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-12 w-12 rounded-[10px] text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                    onClick={() => setExpenseToDelete(ex)}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="bg-white dark:bg-slate-900 rounded-[10px] border-border shadow-xl">
                <CardHeader className="p-10">
                  <CardTitle className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-4">
                    <PieChart className="h-8 w-8 text-foreground" /> Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  {Object.keys(PRODUCTION_CATEGORIES_MAP).slice(0, 6).map(cat => {
                    const catTotal = expenses?.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                    const perc = totalExpensesMonth > 0 ? (catTotal / totalExpensesMonth) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-3.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">{cat}</span>
                          <span className="text-sm font-black text-foreground tracking-tighter">₹{catTotal.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 dark:bg-slate-900/5 rounded-full overflow-hidden p-0.5">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(220,38,38,0.5)]" style={{ width: `${perc}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 rounded-[10px] text-foreground overflow-hidden shadow-xl relative border-border">
                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                   <BrainCircuit className="h-40 w-40" />
                </div>
                <CardContent className="p-12 space-y-10 relative z-10">
                  <div className="h-16 w-16 rounded-[10px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                    <Zap className="h-8 w-8 text-white fill-current" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-4xl font-black tracking-tighter leading-none">AI Business <br/>Advice</h4>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[200px]">
                      Smart analysis of your spending and tax records.
                    </p>
                  </div>
                  <Button className="w-full rounded-[10px] h-14 bg-white dark:bg-slate-900 text-foreground hover:bg-muted font-black text-xs uppercase tracking-[0.2em] gap-3 shadow-2xl active:scale-95 transition-all" onClick={handleConsultAI} disabled={isConsultingAI}>
                    {isConsultingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : "Get AI Advice"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* GST TAB */}
        <TabsContent value="gst" className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 px-2">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-slate-900 rounded-[10px] border-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                  <CardContent className="p-10">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">GST Total</p>
                    <div className="space-y-2">
                       <h4 className="text-4xl font-black tracking-tighter text-foreground">₹{gstStats.output.toLocaleString()}</h4>
                       <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-3">
                         <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)] block"></span> Connected
                       </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 rounded-[10px] border-border shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400/20" />
                  <CardContent className="p-10">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">ITC Projection</p>
                    <div className="space-y-2">
                      <h4 className="text-4xl font-black tracking-tighter text-foreground">₹{(totalExpensesMonth * 0.18).toLocaleString()}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Calculated Threshold</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 rounded-[10px] border-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-45 transition-transform duration-1000">
                    <Zap className="h-20 w-20 fill-current" />
                  </div>
                  <CardContent className="p-10">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-3">Net GST Due</p>
                    <div className="space-y-2">
                      <h4 className="text-4xl font-black tracking-tighter text-foreground">₹{Math.max(0, gstStats.output - (totalExpensesMonth * 0.18)).toLocaleString()}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">After ITC deduction</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="premium-card rounded-[10px] overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border-none shadow-premium">
                <CardHeader className="bg-white/40 dark:bg-slate-900/40 border-b border-white dark:border-slate-800 px-10 py-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black tracking-tight text-foreground">Compliance Intelligence</CardTitle>
                      <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Direct Handshake protocol active.</CardDescription>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-4 py-2 bg-emerald-50 rounded-[10px] border border-emerald-100 flex items-center gap-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Portal Authorized</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-10 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Fiscal Period</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Aggregated Output</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Compliance Logic</th>
                          <th className="px-10 py-5 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {gstStats.periods.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-10 py-32 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 italic">No fiscal movements generated.</td>
                          </tr>
                        ) : (
                          gstStats.periods.map((m, idx) => (
                            <tr key={idx} className="hover:bg-muted transition-all group">
                              <td className="px-10 py-8 font-black text-white text-lg tracking-tighter">{m.period}</td>
                              <td className="px-8 py-8">
                                <span className="font-black text-xl text-foreground tracking-tighter">₹{m.output.toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-8">
                                <Badge className={cn(
                                  "text-[10px] uppercase font-black tracking-widest px-5 py-2 rounded-full border-none shadow-lg backdrop-blur-md",
                                  m.status === 'Filed' ? 'bg-white/10 dark:bg-slate-900/10 text-white' : 'bg-primary/20 text-foreground'
                                )}>
                                  {m.status}
                                </Badge>
                              </td>
                              <td className="px-10 py-8 text-right">
                                <Button className="h-12 px-8 rounded-[10px] bg-white/5 dark:bg-slate-900/5 hover:bg-white dark:bg-slate-900 text-foreground hover:text-foreground border border-border font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl transition-all active:scale-95">
                                  <Zap className="h-4 w-4 fill-current" /> File Return
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="premium-card rounded-[10px] bg-accent text-white border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                   <Globe className="h-32 w-32" />
                </div>
                <CardContent className="p-10 space-y-8 relative z-10">
                  <div className="h-14 w-14 rounded-[10px] bg-white/10 dark:bg-slate-900/10 flex items-center justify-center backdrop-blur-xl border border-white/20 dark:border-slate-700/20">
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-black tracking-tight leading-tight">Bulk Filing <br/>Ready</h4>
                    <p className="text-sm font-medium text-foreground/50 leading-relaxed">
                      You have <strong>{gstStats.periods.filter(m => m.status === 'Pending').length}</strong> pending filings ready for submission.
                    </p>
                  </div>
                  <Button className="w-full h-14 rounded-[10px] bg-white dark:bg-slate-900 text-accent hover:bg-accent/10 font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                    Submit All Pending
                  </Button>
                </CardContent>
              </Card>

              <Card className="premium-card rounded-[10px] bg-primary text-white p-10 space-y-8 border-none shadow-2xl">
                <div className="h-16 w-16 rounded-[10px] bg-white/5 dark:bg-slate-900/5 flex items-center justify-center border border-border">
                  <Cpu className="h-8 w-8 text-foreground" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black tracking-tight">Compliance <br/>Checker</h4>
                  <p className="text-sm font-medium text-muted-foreground">Checks your bank records against tax filings for accuracy.</p>
                </div>
                <div className="space-y-3">
                   {['GSTR-1 Verification', 'GSTR-3B Audit'].map(item => (
                     <Button key={item} variant="outline" className="w-full h-12 bg-white/5 dark:bg-slate-900/5 border-border text-white hover:bg-white/10 dark:bg-slate-900/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest text-left justify-start px-6 gap-3 group transition-all">
                       <ShieldCheck className="h-4 w-4 text-foreground opacity-50 group-hover:opacity-100" />
                       {item}
                     </Button>
                   ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}

      {/* Register Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[10px] border-border bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-xl">
          <div className="bg-primary p-10 text-foreground relative overflow-hidden border-b border-border">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
               <Building2 className="h-32 w-32" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-4xl font-black tracking-tighter flex items-center gap-4">
                <div className="h-12 w-12 rounded-[10px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                Add Account
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-3">
                Enter your banking or cash details
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleAddAccount} className="p-10 space-y-8">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Account Name</Label>
              <Input 
                placeholder="e.g. HDFC Bank, Office Cash..." 
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                required
                className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl focus:ring-primary/20 font-bold placeholder:text-muted-foreground/80"
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Account Type</Label>
                <Select value={newAccount.type} onValueChange={(val) => setNewAccount({...newAccount, type: val})}>
                  <SelectTrigger className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                    <SelectItem value="Bank" className="text-xs font-bold rounded-xl m-1">Bank Account</SelectItem>
                    <SelectItem value="Cash" className="text-xs font-bold rounded-xl m-1">Petty Cash / Cash</SelectItem>
                    <SelectItem value="Credit" className="text-xs font-bold rounded-xl m-1">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Opening Balance</Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                  required
                  className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-black placeholder:text-muted-foreground/80"
                />
              </div>
            </div>

            {newAccount.type === 'Bank' && (
              <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Bank Name</Label>
                  <Input 
                    placeholder="e.g. HDFC Bank, ICICI Bank..." 
                    value={newAccount.bank_name}
                    onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                    required
                    className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl focus:ring-primary/20 font-bold placeholder:text-muted-foreground/80"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Account Number</Label>
                  <Input 
                    placeholder="e.g. XXXX-1234" 
                    value={newAccount.account_number}
                    onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})}
                    required
                    className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl focus:ring-primary/20 font-bold placeholder:text-muted-foreground/80"
                  />
                </div>
              </div>
            )}
            
            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-white dark:bg-slate-900 text-foreground hover:bg-muted font-black rounded-[10px] shadow-2xl active:scale-95 transition-all mt-4 text-xs uppercase tracking-[0.2em]">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Expense Dialog */}
      <Dialog open={isLogExpenseOpen} onOpenChange={setIsLogExpenseOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[10px] border-border bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-xl">
          <div className="bg-primary p-10 text-foreground relative overflow-hidden border-b border-border">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
               <Receipt className="h-32 w-32" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-4">
                <div className="h-12 w-12 rounded-[10px] bg-white/20 dark:bg-slate-900/20 flex items-center justify-center shadow-2xl backdrop-blur-3xl border border-white/20 dark:border-slate-700/20">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                Add Expense
              </DialogTitle>
              <DialogDescription className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] mt-3">
                Record a vendor payment or operational cost.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleLogExpense} className="p-10 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Category</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(val) => {
                    const subs = PRODUCTION_CATEGORIES_MAP[val] || [];
                    setNewExpense({...newExpense, category: val, sub_category: subs[0] || ""});
                  }}
                >
                  <SelectTrigger className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                    {Object.keys(PRODUCTION_CATEGORIES_MAP).map(cat => (
                      <SelectItem key={cat} value={cat} className="text-xs font-bold rounded-xl m-1">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Sub-Category</Label>
                <Select 
                  key={newExpense.category}
                  value={newExpense.sub_category} 
                  onValueChange={(val) => setNewExpense({...newExpense, sub_category: val})}
                >
                  <SelectTrigger className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                    {(PRODUCTION_CATEGORIES_MAP[newExpense.category] || []).map(sub => (
                      <SelectItem key={sub} value={sub} className="text-xs font-bold rounded-xl m-1">{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Vendor / Payee</Label>
              <Input 
                placeholder="e.g. Sony Rentals Pvt Ltd" 
                value={newExpense.vendor_name}
                onChange={(e) => setNewExpense({...newExpense, vendor_name: e.target.value})}
                required
                className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold placeholder:text-muted-foreground/80"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Description</Label>
              <Input 
                placeholder="e.g. Lead Actor Travel - Mumbai Shift" 
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                required
                className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold placeholder:text-muted-foreground/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Expense Amount</Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={newExpense.amount}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0;
                    setNewExpense({
                      ...newExpense, 
                      amount: e.target.value,
                      gst_amount: newExpense.tax_type !== "None" ? (amt * 0.18).toFixed(2) : ""
                    });
                  }}
                  required
                  className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-black placeholder:text-muted-foreground/80"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Timestamp</Label>
                <Input 
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  required
                  className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold placeholder:text-muted-foreground/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">GST / Tax Type</Label>
                <Select 
                  value={newExpense.tax_type} 
                  onValueChange={(val) => {
                    const amt = parseFloat(newExpense.amount) || 0;
                    setNewExpense({
                      ...newExpense, 
                      tax_type: val,
                      gst_amount: val !== "None" ? (amt * 0.18).toFixed(2) : ""
                    });
                  }}
                >
                  <SelectTrigger className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                    <SelectItem value="None" className="text-xs font-bold rounded-xl m-1">No Tax / Unregistered</SelectItem>
                    <SelectItem value="Intra-state" className="text-xs font-bold rounded-xl m-1">Intra-state (CGST + SGST)</SelectItem>
                    <SelectItem value="Inter-state" className="text-xs font-bold rounded-xl m-1">Inter-state (IGST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">GST Amount Paid</Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={newExpense.gst_amount}
                  onChange={(e) => setNewExpense({...newExpense, gst_amount: e.target.value})}
                  disabled={newExpense.tax_type === "None"}
                  className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-black placeholder:text-muted-foreground/80 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Account Paid From</Label>
              <Select value={newExpense.account_id} onValueChange={(val) => setNewExpense({...newExpense, account_id: val})}>
                <SelectTrigger className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                  <SelectItem value="none" className="text-xs font-bold rounded-xl m-1">Select Account (Optional)</SelectItem>
                  {accounts?.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="text-xs font-bold rounded-xl m-1">
                      {acc.name} (Balance: ₹{Number(acc.balance).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Project Link (Optional)</Label>
              <Select value={newExpense.project_id} onValueChange={(val) => setNewExpense({...newExpense, project_id: val})}>
                <SelectTrigger className="h-14 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 text-white shadow-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border text-white">
                  <SelectItem value="none" className="text-xs font-bold rounded-xl m-1">General Operating Expense</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-bold rounded-xl m-1">{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black rounded-[10px] shadow-2xl shadow-primary/20 active:scale-95 transition-all mt-4 text-xs uppercase tracking-[0.2em]">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Expense"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Result Dialog */}
      <Dialog open={isAIResultOpen} onOpenChange={setIsAIResultOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[10px] border-border bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-xl">
          <div className="bg-accent p-12 text-foreground relative overflow-hidden border-b border-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-30"></div>
            <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12">
               <BrainCircuit className="h-48 w-48" />
            </div>
            <DialogHeader className="relative z-10">
              <div className="h-16 w-16 rounded-[10px] bg-accent flex items-center justify-center mb-8 shadow-2xl shadow-accent/40 border border-border">
                <Zap className="h-8 w-8 text-white fill-current" />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter">AI Business Insights</DialogTitle>
              <DialogDescription className="text-indigo-300 font-black uppercase tracking-[0.3em] text-[10px] mt-4">
                Analysis of your financial health
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] bg-muted/50">
            <div className="p-12 space-y-12 pb-24">
              {aiAdvice && (
                <>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 rounded-[10px] bg-white/5 dark:bg-slate-900/5 border border-border space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Projected Health</p>
                       <p className="text-4xl font-black text-foreground tracking-tighter capitalize">{aiAdvice.summary.split('.')[0]}</p>
                    </div>
                    <div className="p-8 rounded-[10px] bg-white/5 dark:bg-slate-900/5 border border-border space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Action Items</p>
                       <p className="text-4xl font-black text-emerald-400 tracking-tighter">{aiAdvice.recommendations.length} Tasks</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4 ml-2">
                       <Target className="h-5 w-5 text-foreground" /> Tactical Directives
                    </h4>
                    <div className="space-y-5">
                      {aiAdvice.recommendations?.map((rec, i) => (
                        <div key={i} className="p-8 rounded-[10px] bg-white/5 dark:bg-slate-900/5 border border-border shadow-2xl flex gap-8 group hover:border-primary/20 transition-all duration-500">
                          <div className="h-12 w-12 rounded-[10px] bg-primary flex items-center justify-center text-foreground font-black shrink-0 group-hover:bg-primary group-hover:text-foreground transition-all text-sm">0{i+1}</div>
                          <div className="space-y-2 pt-2">
                            <p className="text-xs font-black uppercase tracking-widest text-accent">{rec.category}</p>
                            <p className="text-base font-medium text-slate-300 leading-relaxed">{rec.advice}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter italic">Impact: {rec.impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-12 rounded-[10px] bg-gradient-to-br from-slate-800 to-slate-900 text-foreground space-y-8 relative overflow-hidden border border-border shadow-xl">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                       <Receipt className="h-24 w-24" />
                    </div>
                    <h4 className="text-2xl font-black tracking-tighter flex items-center gap-4">
                      <FileCheck className="h-8 w-8 text-accent" /> GST Compliance Tip
                    </h4>
                    <p className="text-base font-medium text-muted-foreground leading-relaxed">
                      {aiAdvice.filingTip}
                    </p>
                    <div className="flex gap-4 pt-4">
                      <Badge className="bg-white/10 dark:bg-slate-900/10 text-white border border-border py-2 px-5 rounded-[10px] text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Smart Filing</Badge>
                      <Badge className="bg-accent text-white border-none py-2 px-5 rounded-[10px] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20">Authorized</Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-10 bg-white dark:bg-slate-900 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Verified with GSTR Standards
            </div>
            <Button onClick={() => setIsAIResultOpen(false)} className="h-16 px-12 rounded-[10px] bg-white dark:bg-slate-900 text-foreground font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all shadow-xl">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOGS */}
      
      {/* Account Deletion */}
      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border p-12 overflow-hidden relative text-white shadow-xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12">
             <Trash2 className="h-40 w-40" />
          </div>
          <AlertDialogHeader className="relative z-10 space-y-6">
            <div className="h-20 w-20 rounded-[10px] bg-accent/10 flex items-center justify-center text-accent mb-4 shadow-inner">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-4xl font-black tracking-tighter">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-lg leading-relaxed pt-2">
              Are you sure you want to delete <span className="text-foreground font-black">{accountToDelete?.name}</span>? This will remove all associated transaction data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-12 gap-4 relative z-10">
            <AlertDialogCancel className="h-14 px-8 rounded-[10px] bg-white/5 dark:bg-slate-900/5 border-border text-white hover:bg-white/10 dark:bg-slate-900/10 font-black text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => accountToDelete && handleDeleteAccount()} className="h-14 px-10 rounded-[10px] bg-accent hover:bg-accent text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-accent/20 transition-all active:scale-95">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent className="rounded-[10px] bg-white dark:bg-slate-900 border-border p-12 overflow-hidden relative text-white shadow-xl">
          <div className="absolute top-0 right-0 p-12 opacity-5">
             <Receipt className="h-40 w-40" />
          </div>
          <AlertDialogHeader className="relative z-10 space-y-6">
            <div className="h-20 w-20 rounded-[10px] bg-accent/10 flex items-center justify-center text-accent mb-4 shadow-inner">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-4xl font-black tracking-tighter text-foreground">Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-lg leading-relaxed pt-2">
              Are you sure you want to delete this expense record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-12 gap-4 relative z-10">
            <AlertDialogCancel className="h-14 px-8 rounded-[10px] border-border bg-white/5 dark:bg-slate-900/5 font-black uppercase tracking-widest text-[10px] text-white shadow-sm hover:bg-white/10 dark:bg-slate-900/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => expenseToDelete && handleDeleteExpense()} className="h-14 px-10 rounded-[10px] bg-accent hover:bg-accent text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-accent/20 transition-all active:scale-95">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
