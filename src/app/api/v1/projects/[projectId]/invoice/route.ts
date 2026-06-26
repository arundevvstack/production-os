import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;
    const body = await req.json();
    const amount = body.amount; // Total invoice amount
    const description = body.description || "Project Milestone Billing";

    const project = await prisma.project.findUnique({
      where: { id: projectId, company_id: companyId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate Invoice Number
    const count = await prisma.invoice.count({ where: { company_id: companyId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate GST (assuming 18% standard)
    const gstAmount = amount * 0.18;
    const total = amount + gstAmount;

    const lineItems = [
      {
        description: `${project.project_name} - ${description}`,
        amount: amount
      }
    ];

    const invoice = await prisma.invoice.create({
      data: {
        company_id: companyId,
        project_id: projectId,
        client_id: project.client_id,
        invoice_number: invoiceNumber,
        subtotal: amount,
        gst_amount: gstAmount,
        total: total,
        payment_status: "Pending",
        issue_date: new Date(),
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        line_items: lineItems
      }
    });

    return NextResponse.json({ success: true, invoice });

  } catch (error: any) {
    console.error("Failed to generate invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
