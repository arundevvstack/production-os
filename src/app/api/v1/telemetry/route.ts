import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // In production, this might use an API Key instead of standard auth
    // for machine-to-machine telemetry ingestion.
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { metric_type, metric_value, context } = body;

    if (!metric_type || metric_value === undefined) {
      return NextResponse.json({ error: 'Missing metric parameters' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});

    if (!dbUser?.company_id) {
        return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
    }

    const telemetry = await prisma.operationalTelemetry.create({
      data: {
        company_id: dbUser.company_id,
        metric_type,
        metric_value: parseFloat(metric_value),
        context: context || {}
      }
    });

    return NextResponse.json({ success: true, data: telemetry });

  } catch (error: any) {
    console.error("Telemetry Ingestion Error:", error);
    return NextResponse.json({ error: error.message || "Failed to ingest telemetry" }, { status: 500 });
  }
}
