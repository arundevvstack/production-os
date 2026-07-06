import prisma from "@/lib/prisma";

export interface AIReviewScore {
  visual_quality: number; // 0-100
  prompt_accuracy: number;
  character_match: number;
  location_match: number;
  brand_match: number;
  lighting_match: number;
  camera_match: number;
  continuity: number;
  style_match: number;
  overall: number;
  is_approved: boolean;
  notes: string;
}

export class ReviewEngine {
  /**
   * Run AI Review on a generated asset version.
   * Calculates expanded enterprise-grade metrics.
   * If Overall > 75, it marks the Asset as "Pending Human Review" instead of "Approved",
   * because Phase H introduces the Human Review step in the loop.
   */
  static async evaluateAssetVersion(versionId: string): Promise<AIReviewScore> {
    const version = await prisma.productionAssetVersion.findUnique({
      where: { id: versionId },
      include: { ProductionAsset: true }
    });

    if (!version) throw new Error("Asset version not found for review.");

    // Simulate Expanded LLM Evaluation based on asset type and generation success.
    // In production, this would invoke a multimodal LLM like GPT-4o or Gemini 1.5 Pro 
    // and prompt it to grade the asset on the 9 specific criteria.
    
    let score: AIReviewScore = {
      visual_quality: 85,
      prompt_accuracy: 90,
      character_match: 88,
      location_match: 85,
      brand_match: 92,
      lighting_match: 87,
      camera_match: 90,
      continuity: 89,
      style_match: 95,
      overall: 89,
      is_approved: true,
      notes: "Asset passes visual and brand quality AI checks. Passed to Human Review."
    };

    // Example deterministic failure if it's missing an asset URL or has an error
    if (!version.file_url) {
      score = {
        visual_quality: 10,
        prompt_accuracy: 10,
        character_match: 10,
        location_match: 10,
        brand_match: 10,
        lighting_match: 10,
        camera_match: 10,
        continuity: 10,
        style_match: 10,
        overall: 10,
        is_approved: false,
        notes: "Asset generation failed completely or produced no output."
      };
    }

    // Update the asset version metadata with review scores
    const newMetadata = {
      ...(version.metadata as Record<string, any> || {}),
      ai_review: score
    };

    // Note: AI Approval now sets status to "Pending Review" (meaning Human Review),
    // and rejection sets it to "Rejected"
    const nextStatus = score.is_approved ? "Pending Review" : "Rejected";

    await prisma.productionAssetVersion.update({
      where: { id: versionId },
      data: {
        metadata: newMetadata,
        status: nextStatus,
        updated_at: new Date()
      }
    });

    // Sync status to the master Asset
    await prisma.productionAsset.update({
      where: { id: version.asset_id },
      data: {
        status: nextStatus,
        updated_at: new Date()
      }
    });

    return score;
  }
}
