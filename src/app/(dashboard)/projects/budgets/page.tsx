"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { IndianRupee, Download, Plus, PieChart, Loader2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabaseCollection } from "@/supabase/hooks/use-collection";
import { supabase } from "@/supabase/client";

export default function BudgetsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();

  // 1. Fetch all active projects to compute the allocated budget
  const { data: projects, isLoading: isProjectsLoading } = useSupabaseCollection('Project', {
    where: { company_id: companyId }
  });

  // 2. Fetch all expenses to map actual production spent to date
  const { data: expenses, isLoading: isExpensesLoading } = useSupabaseCollection('Expense', {
    where: { company_id: companyId }
  });

  // --- DERIVE BUDGET SUMMARY INDICATORS ---
  const totalAllocated = useMemo(() => {
    return projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
  }, [projects]);

  const totalSpent = useMemo(() => {
    return expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  }, [expenses]);

  const variance = totalAllocated - totalSpent;

  // --- GROUP EXPENSES DYNAMICALLY BY CATEGORY FOR LINE-ITEM VIEW ---
  const budgetItems = useMemo(() => {
    const defaultAllocations: Record<string, number> = {
      "Talent & Crew": 1200000,
      "Gear Rental": 800000,
      "Catering & Transport": 300000,
      "Studio Space": 500000,
      "Software & Tools": 200000
    };

    const categoriesMap: Record<string, { id: string; category: string; amount: number; actual: number }> = {};

    // Group actual spending
    expenses?.forEach((exp) => {
      const cat = exp.category || "General Operations";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          id: cat,
          category: cat,
          amount: defaultAllocations[cat] || 400000,
          actual: 0
        };
      }
      categoriesMap[cat].actual += (exp.amount || 0);
    });

    // Ensure default allocations are shown even with zero actual expenses
    Object.entries(defaultAllocations).forEach(([cat, alloc]) => {
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          id: cat,
          category: cat,
          amount: alloc,
          actual: 0
        };
      }
    });

    return Object.values(categoriesMap);
  }, [expenses]);

  const isLoading = isTenantLoading || isProjectsLoading || isExpensesLoading;

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-primary">Financial Tracking</h1>
          <p className="text-muted-foreground">Manage production costs and budget allocation across all phases.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button size="sm" className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Line Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2 font-bold uppercase text-[10px]">
              <IndianRupee className="h-3 w-3" /> Total Budget
            </div>
            <div className="text-2xl font-bold font-headline">₹{totalAllocated.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-accent mb-2 font-bold uppercase text-[10px]">
              <PieChart className="h-3 w-3" /> Spent to Date
            </div>
            <div className="text-2xl font-bold font-headline">₹{totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-accent mb-2 font-bold uppercase text-[10px]">
              <Filter className="h-3 w-3" /> Remaining
            </div>
            <div className="text-2xl font-bold font-headline">₹{variance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-[10px]">
        <CardHeader className="bg-white border-b py-4">
          <CardTitle className="text-lg font-headline">Budget Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase">Category</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Allocated</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Actual</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Utilization</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No budget data available for this workspace.</TableCell>
                </TableRow>
              ) : (
                budgetItems.map((item) => {
                  const utilization = item.amount > 0 ? (item.actual / item.amount) * 100 : 0;
                  const isOver = utilization > 100;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">{item.category}</TableCell>
                      <TableCell className="font-mono text-xs">₹{item.amount?.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">₹{item.actual?.toLocaleString() || 0}</TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className={`h-1.5 ${isOver ? 'bg-accent/10' : 'bg-muted'}`}
                          />
                          <span className="text-[10px] font-bold">
                            {Math.round(utilization)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={isOver ? 'destructive' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {isOver ? 'Over' : 'On Track'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
