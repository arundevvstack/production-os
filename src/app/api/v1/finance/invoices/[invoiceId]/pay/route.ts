import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.invoiceId;
    const body = await req.json();
    const bankAccountId = body.bank_account_id;

    if (!bankAccountId) {
      return NextResponse.json({ error: "Bank account ID is required" }, { status: 400 });
    }

    // Run within a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the invoice
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId, company_id: companyId }
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.payment_status === "Paid") {
        throw new Error("Invoice is already paid");
      }

      // 2. Fetch the bank account
      const bankAccount = await tx.bankAccount.findUnique({
        where: { id: bankAccountId, company_id: companyId }
      });

      if (!bankAccount) {
        throw new Error("Bank account not found");
      }

      // 3. Update the invoice status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { payment_status: "Paid" }
      });

      // 4. Create a cash flow activity
      const cashFlow = await tx.cashFlowActivity.create({
        data: {
          company_id: companyId,
          bank_account_id: bankAccountId,
          type: "IN",
          amount: invoice.total,
          description: `Payment received for Invoice ${invoice.invoice_number}`,
          reference_id: invoice.id,
          category: "Client Payment",
          date: new Date()
        }
      });

      // 5. Update bank account balance
      const updatedBank = await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: { increment: invoice.total } }
      });

      return { invoice: updatedInvoice, cashFlow, bankAccount: updatedBank };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error("Failed to mark invoice as paid:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
