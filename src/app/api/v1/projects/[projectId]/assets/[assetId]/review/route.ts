import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string, assetId: string } }
) {
  try {
    const body = await req.json();
    const { status, notes } = body;

    if (!["Approved", "Rejected", "Needs Regeneration"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedAsset = await prisma.productionAsset.update({
      where: { id: params.assetId },
      data: {
        status,
        notes: notes || null
      }
    });

    return NextResponse.json({ success: true, asset: updatedAsset });
  } catch (error: any) {
    console.error("Asset Review Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
