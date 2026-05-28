import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { company_id, name, service_type, payment_terms } = body;

    if (!company_id || !name || !service_type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify user is part of the company and has rights
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
    const isManager = dbUser?.role_id === 'SUPER_ADMIN' || dbUser?.role_id === 'ADMIN' || dbUser?.role_id === 'PROJECT_MANAGER';

    if (!isManager || dbUser?.company_id !== company_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        company_id,
        name,
        service_type,
        payment_terms: payment_terms || 'Net 30'
      }
    });

    return NextResponse.json({ success: true, data: vendor });

  } catch (error: any) {
    console.error("Vendor Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create vendor" }, { status: 500 });
  }
}
