"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GenerateProposalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prospectId = searchParams.get("prospectId");
  
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const [loading, setLoading] = useState(true);
  const [requirement, setRequirement] = useState<any>(null);
  
  const [proposalData, setProposalData] = useState({
    title: "",
    proposal_number: `PRP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    content: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!prospectId) {
      setLoading(false);
      return;
    }
    fetch(`/api/v1/crm/prospect/${prospectId}/requirement`)
      .then(res => res.json())
      .then(resData => {
        if (resData.requirement) {
          setRequirement(resData.requirement);
          // Preload
          const req = resData.requirement;
          const preloadedContent = `
# Client Details
**Company**: ${req.client_details?.company_name || 'N/A'}
**Contact**: ${req.client_details?.contact_person || 'N/A'}

# Project Overview
**Project Name**: ${req.project_details?.project_name || 'N/A'}
**Objective**: ${req.objective || 'N/A'}

# Scope of Work
${req.scope_of_work || 'TBD'}

# Deliverables
${req.deliverables?.length ? req.deliverables.map((d: string) => `- ${d}`).join('\n') : 'TBD'}

# Creative & Technical
**Concept**: ${req.creative_requirements?.concept || 'TBD'}
**Specs**: ${req.technical_specs?.duration || ''} ${req.technical_specs?.resolution || ''}

# Timeline
**Delivery**: ${req.timeline?.delivery_date || 'TBD'}
          `.trim();
          
          setProposalData(prev => ({
            ...prev,
            title: `Proposal for ${req.project_details?.project_name || 'Project'}`,
            content: preloadedContent
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [prospectId]);

  const handleSave = async () => {
    if (!companyId || !prospectId || !requirement) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospectId,
          requirement_id: requirement.id,
          title: proposalData.title,
          proposal_number: proposalData.proposal_number,
          content: proposalData.content,
          status: "draft"
        })
      });
      
      if (!response.ok) throw new Error("Failed to save proposal");
      
      toast({ title: "Proposal Saved", description: "Your proposal is now in draft mode." });
      router.push(`/proposals`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (isTenantLoading || loading) return <div className="p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;

  if (!prospectId) {
    return <div className="p-12 text-center text-muted-foreground">No prospect ID provided. <Button variant="link" onClick={() => router.push('/proposals')}>Go back</Button></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold">Generate Proposal</h1>
          <p className="text-muted-foreground">Preloaded from Requirement Analysis</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" /> Save Draft</Button>
          <Button className="bg-primary text-white font-bold" onClick={handleSave} disabled={saving}><CheckCircle2 className="h-4 w-4 mr-2" /> Save & Continue</Button>
        </div>
      </div>
      
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle>Proposal Content</CardTitle>
          <CardDescription>Edit the generated content before sending it to the client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Proposal Title</Label>
              <Input value={proposalData.title} onChange={e => setProposalData(p => ({...p, title: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Proposal Number</Label>
              <Input value={proposalData.proposal_number} onChange={e => setProposalData(p => ({...p, proposal_number: e.target.value}))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Content (Markdown / Rich Text)</Label>
            <Textarea 
              className="font-mono text-sm min-h-[500px]" 
              value={proposalData.content} 
              onChange={e => setProposalData(p => ({...p, content: e.target.value}))} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GenerateProposalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>}>
      <GenerateProposalContent />
    </Suspense>
  );
}
