import prisma from "@/lib/prisma";

export interface ProductionHealth {
  overall_score: number;
  metrics: {
    script: number;
    breakdown: number;
    visual_bible: number;
    storyboard: number;
    scenes: number;
    shots: number;
    prompts: number;
    generation: number;
    reviews: number;
    editing: number;
    delivery: number;
  };
}

export class ProductionHealthEngine {
  static async evaluateProject(projectId: string): Promise<ProductionHealth> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionAsset: true,
        ProductionAIJob: true,
        ProductionStoryboard: {
           include: {
              ProductionScene: {
                 include: {
                    ProductionShot: true
                 }
              }
           }
        }
      }
    });

    if (!project) throw new Error("Project not found");

    // Simplified deterministic scoring for Enterprise prototype
    
    // 1. Script & Breakdown (Assume 100 if we have scenes)
    // 1. Script & Breakdown
    const scenesArr = project.ProductionStoryboard?.ProductionScene || [];
    const script = scenesArr.length > 0 ? 100 : 0;
    const breakdown = scenesArr.length > 0 ? 100 : 0;
    
    // 2. Planning
    const visual_bible = project.ProductionAsset.some(a => a.type === 'Visual Bible') ? 100 : 0;
    const storyboard = project.ProductionAsset.some(a => a.type === 'Storyboard') ? 100 : 0;
    
    // 3. Coverage
    const scenes = scenesArr.length > 0 ? 100 : 0;
    
    let totalShotsCount = 0;
    scenesArr.forEach(scene => {
      totalShotsCount += scene.ProductionShot.length;
    });
    
    const shots = totalShotsCount > 0 ? 100 : 0;
    
    // Simplification for prototype: assume prompts track directly with shots
    let prompts = totalShotsCount > 0 ? 100 : 0;

    // 4. Production
    let generation = 0;
    let reviews = 0;
    let editing = 0;
    let delivery = 0;

    const totalAssets = project.ProductionAsset.length;
    if (totalAssets > 0) {
      const pendingReview = project.ProductionAsset.filter(a => a.status === 'Pending Review').length;
      const approved = project.ProductionAsset.filter(a => a.status === 'Approved').length;
      const rejected = project.ProductionAsset.filter(a => a.status === 'Rejected').length;
      
      generation = 100; // If assets exist, generation happened
      reviews = Math.round(((approved + rejected) / totalAssets) * 100);
      editing = Math.round((approved / totalAssets) * 100); // Simplification: Editing is tied to approval rate
      delivery = editing; // Delivery readiness tracks editing progress
    }

    const metrics = {
      script,
      breakdown,
      visual_bible,
      storyboard,
      scenes,
      shots,
      prompts,
      generation,
      reviews,
      editing,
      delivery
    };

    const overall_score = Math.round(
      Object.values(metrics).reduce((a, b) => a + b, 0) / Object.values(metrics).length
    );

    return {
      overall_score,
      metrics
    };
  }
}
