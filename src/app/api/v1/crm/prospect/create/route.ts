import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { prospectService } from '@/services/prospect.service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Forbidden: Tenant company association missing.' }, { status: 403 });
    }

    // Role-based permission guard
    const isAuthorized =
      profile.role_id === 'SUPER_ADMIN' ||
      profile.role_id === 'ADMIN' ||
      profile.role_id === 'MANAGER' ||
      profile.role_id === 'MARKETING_SALES';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create prospects.' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.company_name) {
      return NextResponse.json({ error: 'Validation Error: company_name is required.' }, { status: 400 });
    }

    const prospect = await prospectService.create({
      company_id: profile.company_id,
      company_name: body.company_name,
      contact_person: body.contact_person,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      service_vertical: body.service_vertical,
      sub_vertical: body.sub_vertical,
      industry: body.industry,
      deal_value: parseFloat(body.deal_value) || 0,
      stage: body.stage || 'new_lead',
      notes: body.notes,
      assignee_id: body.assignee_id,
    });

    return NextResponse.json({ data: prospect }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in crm/prospect/create:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
