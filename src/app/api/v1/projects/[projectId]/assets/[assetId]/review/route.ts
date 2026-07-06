import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const body = await request.json();
    
    // Validate request
    if (!body.versionId || !body.decision || !body.scores) {
      return NextResponse.json({ error: "Missing review fields (versionId, decision, scores)" }, { status: 400 });
    }

    // Determine target status
    const decisionStatus = body.decision; // "Approved", "Rejected", "Needs Revision"
    
    const version = await prisma.productionAssetVersion.findUnique({
      where: { id: body.versionId, asset_id: assetId }
    });

    if (!version) {
      return NextResponse.json({ error: "Asset version not found" }, { status: 404 });
    }

    // Merge human review into metadata
    const currentMetadata = (version.metadata as Record<string, any>) || {};
    const newMetadata = {
      ...currentMetadata,
      human_review: {
        ...body.scores,
        decision: decisionStatus,
        notes: body.notes || "",
        reviewed_at: new Date().toISOString(),
        reviewer_id: "system_user" // Mock auth context
      }
    };

    // Update version
    const updatedVersion = await prisma.productionAssetVersion.update({
      where: { id: body.versionId },
      data: {
        metadata: newMetadata,
        status: decisionStatus,
        updated_at: new Date()
      }
    });

    // Update master asset status
    await prisma.productionAsset.update({
      where: { id: assetId },
      data: {
        status: decisionStatus,
        updated_at: new Date()
      }
    });

    return NextResponse.json(updatedVersion);
  } catch (error: any) {
    console.error("Asset Review POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
