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
    const { objective_id, proposed_rate, estimated_days } = body;

    if (!objective_id || !proposed_rate || !estimated_days) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});

    if (dbUser?.role_id !== 'TALENT') {
        return NextResponse.json({ error: 'Only TALENT accounts can submit bids.' }, { status: 403 });
    }

    const objective = await prisma.objective.findUnique({
      where: { id: objective_id }
    });

    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    // Optional: Add logic to ensure the objective is actually open for external bidding

    const bid = await prisma.freelancerBid.create({
      data: {
        objective_id,
        freelancer_id: user.id,
        proposed_rate: parseFloat(proposed_rate),
        estimated_days: parseInt(estimated_days, 10),
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, data: bid });

  } catch (error: any) {
    console.error("Bid Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit bid" }, { status: 500 });
  }
}
