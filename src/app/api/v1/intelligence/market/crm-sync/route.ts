import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Profile
    const { data: profile } = await supabase
      .from('User')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company association found' }, { status: 403 });
    }
    const companyId = profile.company_id;

    // 3. Parse input
    const body = await request.json();
    const leadId = body.leadId;

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    // 4. Find MarketLead
    const lead = await prisma.marketLead.findFirst({
      where: { id: leadId, company_id: companyId }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found or unauthorized' }, { status: 404 });
    }

    if (lead.is_synced) {
      return NextResponse.json({ error: 'Lead is already synced to CRM' }, { status: 400 });
    }

    // 5. Create Prospect in CRM
    const newProspect = await prisma.prospect.create({
      data: {
        company_id: companyId,
        company_name: lead.company_name,
        contact_person: "TBD", // Requires enrichment or manual entry later
        email: lead.contact_email || null,
        phone: null,
        stage: "new_lead",
        deal_value: lead.estimated_budget,
        notes: `AI Generated Sync.\nIndustry: ${lead.industry}\nNeeded: ${lead.services_needed}\nWeaknesses: ${lead.marketing_quality}`,
        assignee_id: user.id, // Auto-assign to the person who synced it
      }
    });

    // 6. Update MarketLead as synced
    await prisma.marketLead.update({
      where: { id: lead.id },
      data: {
        is_synced: true,
        synced_prospect_id: newProspect.id,
      }
    });

    // 7. Create Alert
    await prisma.marketAlert.create({
      data: {
        company_id: companyId,
        type: 'sync',
        message: `${lead.company_name} synced to CRM Prospect by ${user.id}`, // Better to use user name if available
      }
    });

    return NextResponse.json({
      success: true,
      prospect: newProspect,
      message: 'Successfully synced lead to CRM Pipeline',
    });

  } catch (error: any) {
    console.error('[Market CRM Sync API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync to CRM' },
      { status: 500 }
    );
  }
}
