import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string, assetId: string }> }) {
  try {
    const { assetId } = await params;
    await prisma.productionAsset.delete({
      where: { id: assetId }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
