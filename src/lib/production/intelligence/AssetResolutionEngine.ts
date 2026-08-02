export type AssetType = 
  | 'Master Portrait' 
  | 'Reference Sheet' 
  | 'Full Body' 
  | 'Action Pose' 
  | 'Expression Sheet' 
  | 'Costume Sheet' 
  | 'Face Reference' 
  | 'Transparent PNG';

export interface ResolutionResult {
  assetUrl: string | null;
  score: number;
  reason: string;
  matchedType: AssetType | null;
}

export class AssetResolutionEngine {
  private static readonly MINIMUM_ACCEPTABLE_SCORE = 70;

  /**
   * Resolves the best available asset for a requested type.
   * Only approved assets are evaluated. Pending or rejected assets are excluded.
   * 
   * @param character The ProductionCharacter entity containing metadata
   * @param requestedType The type of asset required by the workflow
   * @returns ResolutionResult containing the asset URL if a suitable one is found
   */
  static resolveAsset(character: any, requestedType: AssetType): ResolutionResult {
    const metadata = (character.metadata as any) || {};
    const approvedAssets = metadata.assets || {};
    
    // Fast path: Exact match
    if (approvedAssets[requestedType]) {
      this.logDiagnostics(requestedType, requestedType, 100, true, false, 'Exact asset type match');
      return {
        assetUrl: approvedAssets[requestedType],
        score: 100,
        reason: 'Exact match',
        matchedType: requestedType
      };
    }

    // Similarity Scoring for Fallbacks
    let bestMatch: AssetType | null = null;
    let highestScore = 0;

    for (const [availableType, url] of Object.entries(approvedAssets)) {
      if (!url) continue;

      const score = this.calculateMatchScore(requestedType, availableType as AssetType);
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = availableType as AssetType;
      }
    }

    if (bestMatch && highestScore >= this.MINIMUM_ACCEPTABLE_SCORE) {
      this.logDiagnostics(requestedType, bestMatch, highestScore, true, false, 'Similarity threshold met');
      return {
        assetUrl: approvedAssets[bestMatch],
        score: highestScore,
        reason: `Reused ${bestMatch} (Score: ${highestScore})`,
        matchedType: bestMatch
      };
    }

    // No suitable asset found - Generation required
    this.logDiagnostics(
      requestedType, 
      bestMatch || 'None', 
      highestScore, 
      false, 
      true, 
      bestMatch ? 'Similarity threshold not met' : 'No approved assets available'
    );
    
    return {
      assetUrl: null,
      score: highestScore,
      reason: 'No suitable asset found. Generation required.',
      matchedType: null
    };
  }

  /**
   * Evaluates compatibility between two asset types.
   */
  private static calculateMatchScore(requested: AssetType, available: AssetType): number {
    if (requested === available) return 100;

    // Reject incorrect reuse (e.g. Portrait for Action request)
    if (requested === 'Action Pose') {
      // Only Action assets satisfy Action requests
      return 0;
    }

    if (requested === 'Face Reference') {
      // AI Video / Face replacement needs Face Reference or Expression Sheet
      if (available === 'Expression Sheet') return 80;
      if (available === 'Master Portrait') return 60; // Usually rejected if threshold is 70
      return 0;
    }

    if (requested === 'Full Body') {
      if (available === 'Action Pose') return 75; // Might have full body
      if (available === 'Costume Sheet') return 80; // Definitely full body
      if (available === 'Reference Sheet') return 70; // Turnaround has full body
      return 0;
    }

    if (requested === 'Master Portrait') {
      // Visual Bible consumes Master Portrait.
      if (available === 'Face Reference') return 75;
      if (available === 'Expression Sheet') return 70;
      return 0; // Don't use a full body shot as a master portrait fallback
    }

    if (requested === 'Costume Sheet') {
      if (available === 'Full Body') return 75;
      if (available === 'Reference Sheet') return 85;
      return 0;
    }

    return 0;
  }

  private static logDiagnostics(
    requested: AssetType, 
    matched: string, 
    score: number, 
    reused: boolean, 
    generate: boolean, 
    reason: string
  ) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[AssetResolutionEngine] DIAGNOSTICS');
    console.log(`  Requested Asset     : ${requested}`);
    console.log(`  Matched Asset       : ${matched}`);
    console.log(`  Match Score         : ${score}`);
    console.log(`  Reuse Decision      : ${reused ? 'YES' : 'NO'}`);
    console.log(`  Generation Decision : ${generate ? 'YES' : 'NO'}`);
    console.log(`  Reason              : ${reason}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
