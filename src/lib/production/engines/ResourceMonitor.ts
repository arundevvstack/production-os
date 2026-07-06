import prisma from "@/lib/prisma";

export class ResourceMonitor {
  /**
   * Tracks total assets generated (images/video approximations) for quota monitoring.
   */
  static async getProjectUsage(projectId: string) {
    const assets = await prisma.productionAsset.findMany({
      where: { project_id: projectId },
      include: { ProductionAssetVersion: true }
    });

    let imageCount = 0;
    let videoCount = 0; // Approximating 1 video asset = 5 seconds

    assets.forEach(asset => {
       if (asset.type === 'Image' || asset.type === 'Storyboard' || asset.type === 'Visual Bible') {
          imageCount += asset.ProductionAssetVersion.length;
       } else if (asset.type === 'Video') {
          videoCount += asset.ProductionAssetVersion.length;
       }
    });

    return {
      image_count: imageCount,
      video_minutes: (videoCount * 5) / 60,
      total_generations: imageCount + videoCount
    };
  }
}
