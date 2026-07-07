import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.type || !body.payload) {
      return NextResponse.json({ error: "Missing type or payload" }, { status: 400 });
    }

    // Save report to ProductionLog
    const logEntry = await prisma.productionLog.create({
      data: {
        id: "rep_" + Date.now(),
        project_id: projectId,
        type: body.type, // e.g. "Executive_Report", "Daily_Summary"
        date: new Date(),
        content: body.payload
      }
    });

    return NextResponse.json(logEntry, { status: 201 });
  } catch (error: any) {
    console.error("Reports POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
