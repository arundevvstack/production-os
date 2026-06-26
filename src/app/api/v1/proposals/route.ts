import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();

    const proposal = await prisma.proposal.create({
      data: {
        company_id: company_id,
        title: body.title,
        proposal_number: body.proposal_number,
        content: body.content,
        status: body.status || "draft",
        prospect_id: body.prospect_id || null,
        requirement_id: body.requirement_id || null
      }
    });

    return NextResponse.json({ proposal });
  } catch (error: any) {
    console.error("Proposal POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const company_id = await getCompanyId();
    if (!company_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const proposals = await prisma.proposal.findMany({
      where: { company_id: company_id },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error("Proposal GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
