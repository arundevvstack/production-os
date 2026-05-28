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

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});

    if (dbUser?.role_id !== 'SUPER_ADMIN' && dbUser?.role_id !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    if (!dbUser.company_id) {
        return NextResponse.json({ error: 'Tenant context missing.' }, { status: 400 });
    }

    const body = await req.json();
    const { url, events, secret } = body;

    if (!url || !events || !secret) {
      return NextResponse.json({ error: 'Missing required parameters (url, events, secret)' }, { status: 400 });
    }

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        company_id: dbUser.company_id,
        url,
        events, // Array of event strings, e.g., ["project.created", "stage.transitioned"]
        secret
      }
    });

    return NextResponse.json({ success: true, data: webhook });

  } catch (error: any) {
    console.error("Webhook Registration Error:", error);
    return NextResponse.json({ error: error.message || "Failed to register webhook" }, { status: 500 });
  }
}
