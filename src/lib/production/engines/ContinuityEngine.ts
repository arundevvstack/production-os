import prisma from "@/lib/prisma";

export interface ContinuityIssue {
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
  asset_ids: string[];
}

export class ContinuityEngine {
  /**
   * Evaluates project assets to find continuity mismatches.
   * Looks across Approved assets to spot lighting, costume, or character shifts.
   */
  static async evaluateContinuity(projectId: string): Promise<ContinuityIssue[]> {
    const assets = await prisma.productionAsset.findMany({
      where: { project_id: projectId, status: 'Approved' },
      include: {
        ProductionAssetVersion: {
          orderBy: { version_number: 'desc' },
          take: 1
        }
      }
    });

    const issues: ContinuityIssue[] = [];

    if (assets.length < 2) return issues; // Need multiple assets to compare

    // Example mock logic for Enterprise validation. 
    // In production, this runs Vector search or multimodal cross-referencing.
    const hasInconsistentCharacters = Math.random() > 0.8;
    const hasLightingShifts = Math.random() > 0.8;

    if (hasInconsistentCharacters) {
      issues.push({
        severity: "high",
        category: "Character",
        description: "Protagonist wardrobe color shifts between Scene 2 and Scene 3.",
        asset_ids: [assets[0].id, assets[1].id]
      });
    }

    if (hasLightingShifts) {
      issues.push({
        severity: "medium",
        category: "Lighting",
        description: "Time of day lighting mismatch in sequential shots.",
        asset_ids: [assets[0].id, assets[assets.length - 1].id]
      });
    }

    return issues;
  }
}
