import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params specifically for Next.js 15+ if needed, but standard is fine
    const proposalId = params.proposalId;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId, company_id: companyId },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const content = typeof proposal.content === "string" ? JSON.parse(proposal.content) : proposal.content;

    // Calculate budget from line items
    const lineItems = content.line_items || [];
    const budget = lineItems.reduce((acc: number, item: any) => acc + (item.total || 0), 0);

    // Prepare milestones
    const milestones = content.milestones || [];
    const milestoneCreates = milestones.map((m: any) => ({
      title: m.title,
      status: "pending"
    }));

    // Create the project
    const project = await prisma.project.create({
      data: {
        company_id: companyId,
        project_name: proposal.title || "Project from Proposal",
        status: "active",
        budget: budget,
        client_name: content.client || undefined,
        stages: {
          create: [
            { name: "PRE_PRODUCTION", order: 1, status: "pending" },
            { name: "PRODUCTION", order: 2, status: "pending" },
            { name: "POST_PRODUCTION", order: 3, status: "pending" },
            { name: "RELEASE", order: 4, status: "pending" },
          ]
        },
        milestones: {
          create: milestoneCreates
        }
      }
    });

    // Optionally update the proposal status to 'converted'
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "converted" }
    });

    return NextResponse.json({ success: true, project });

  } catch (error: any) {
    console.error("Failed to convert proposal to project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
