import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No project IDs provided" }, { status: 400 });
    }

    await prisma.project.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error("Batch delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
