import prisma from "@/lib/prisma";

export interface GraphNode {
  id: string;
  type: string; // 'Project', 'Scene', 'Shot', 'Asset', 'Memory', etc.
  label: string;
  metadata?: any;
  edges: GraphEdge[];
}

export interface GraphEdge {
  targetId: string;
  targetType: string;
  targetLabel: string;
  relationship: string; // 'contains', 'uses', 'generated'
}

export class GraphEngine {
  /**
   * Universal search across all creative entities in a project
   */
  static async universalSearch(projectId: string, query: string) {
    if (!query) return [];

    const searchQuery = query.toLowerCase();
    const results: any[] = [];

    // Search Memories
    const memories = await prisma.productionCreativeMemory.findMany({
      where: {
        project_id: projectId,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      }
    });
    memories.forEach(m => results.push({ id: m.id, type: m.type, label: m.name }));

    // Search Scenes
    const storyboard = await prisma.productionStoryboard.findUnique({
      where: { project_id: projectId },
      include: { scenes: true }
    });
    
    if (storyboard) {
      storyboard.scenes.forEach(scene => {
        if (
          scene.title.toLowerCase().includes(searchQuery) ||
          scene.description?.toLowerCase().includes(searchQuery)
        ) {
          results.push({ id: scene.id, type: "Scene", label: `Scene ${scene.scene_number}: ${scene.title}` });
        }
      });
    }

    return results;
  }

  /**
   * Explores the full web of relationships starting from a specific node
   */
  static async getRelatedNodes(entityType: string, entityId: string): Promise<GraphNode | null> {
    
    if (entityType === "Memory") {
      const mem = await prisma.productionCreativeMemory.findUnique({
        where: { id: entityId },
        include: { shots: { include: { scene: true } } }
      });
      if (!mem) return null;

      const edges: GraphEdge[] = mem.shots.map(shot => ({
        targetId: shot.id,
        targetType: "Shot",
        targetLabel: `Shot ${shot.shot_number}`,
        relationship: "appears_in"
      }));

      // Also link the scenes indirectly
      const uniqueScenes = Array.from(new Set(mem.shots.map(s => s.scene_id)));
      uniqueScenes.forEach(sceneId => {
        const scene = mem.shots.find(s => s.scene_id === sceneId)?.scene;
        if (scene) {
          edges.push({
            targetId: scene.id,
            targetType: "Scene",
            targetLabel: `Scene ${scene.scene_number}: ${scene.title}`,
            relationship: "appears_in"
          });
        }
      });

      return {
        id: mem.id,
        type: mem.type,
        label: mem.name,
        metadata: { description: mem.description },
        edges
      };
    }

    if (entityType === "Shot") {
      const shot = await prisma.productionShot.findUnique({
        where: { id: entityId },
        include: { creative_memories: true, generated_assets: true }
      });
      if (!shot) return null;

      const edges: GraphEdge[] = [];
      shot.creative_memories.forEach(mem => {
        edges.push({
          targetId: mem.id,
          targetType: mem.type, // 'Character', etc.
          targetLabel: mem.name,
          relationship: "uses"
        });
      });
      
      shot.generated_assets.forEach(asset => {
        edges.push({
          targetId: asset.id,
          targetType: "Asset",
          targetLabel: `Asset ${asset.type}`,
          relationship: "generated"
        });
      });

      return {
        id: shot.id,
        type: "Shot",
        label: `Shot ${shot.shot_number}`,
        edges
      };
    }

    return null;
  }

  /**
   * Fetches the chronological timeline of creative events
   */
  static async getCreativeTimeline(projectId: string) {
    return prisma.productionTimelineEvent.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true, email: true } }
      }
    });
  }

  /**
   * Generates overall production statistics
   */
  static async getStatistics(projectId: string) {
    const memoryCount = await prisma.productionCreativeMemory.count({ where: { project_id: projectId } });
    const jobCount = await prisma.productionAIJob.count({ where: { project_id: projectId } });
    const assetCount = await prisma.productionAsset.count({ where: { project_id: projectId } });
    const approvedAssets = await prisma.productionAssetVersion.count({ where: { asset: { project_id: projectId }, status: "Approved" } });

    return {
      memoryCount,
      jobCount,
      assetCount,
      approvalRate: assetCount > 0 ? (approvedAssets / assetCount) * 100 : 0
    };
  }
}
