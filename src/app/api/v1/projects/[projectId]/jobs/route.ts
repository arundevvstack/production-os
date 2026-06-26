import { NextResponse } from "next/dist/server/web/spec-extension/response";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: params.projectId },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        provider: true
      }
    });
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
