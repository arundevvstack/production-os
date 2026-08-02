import prisma from "@/lib/prisma";
import { ProductionPackageSchema, ProductionPackageType } from "./types";

export class IntelligenceEngine {
  
  static async generatePackageForShot(shotId: string): Promise<ProductionPackageType> {
    const shot = await prisma.productionShot.findUnique({
      where: { id: shotId },
      include: {
        ProductionScene: {
          include: {
            ProductionStoryboard: {
              include: {
                Project: true,
                ProductionScript: true
              }
            }
          }
        },
        Versions: {
          orderBy: { version_number: 'desc' },
          take: 1
        }
      }
    });

    if (!shot || !shot.ProductionScene) {
      throw new Error(`Shot ${shotId} not found or missing scene.`);
    }

    const scene = shot.ProductionScene;
    const storyboard = scene.ProductionStoryboard;
    const project = storyboard.Project;
    const script = storyboard.ProductionScript;
    const shotVersion = (shot.Versions[0] || {}) as any;

    // Security: Verify the shot belongs to the requested project (if we had projectId in this method, 
    // but generatePackageForShot doesn't take projectId. We can check it in synchronizePackage).
    // Actually, let's just make sure we are scoping characters and locations correctly.

    // To prevent AI context leak, we only include characters and locations that are actually 
    // referenced in the scene or shot description/blocking.
    const contextText = `${scene.title} ${scene.description || ''} ${shotVersion.character_blocking || ''} ${shotVersion.environment || ''} ${shotVersion.dialogue || ''}`.toLowerCase();

    // Fetch Characters and filter
    const allCharacters = await prisma.productionCharacter.findMany({
      where: { project_id: project.id }
    });
    const characters = allCharacters.filter(c => contextText.includes(c.name.toLowerCase()));

    // Fetch Locations and filter
    const allLocations = await prisma.productionLocation.findMany({
      where: { project_id: project.id }
    });
    const locations = allLocations.filter(l => contextText.includes(l.name.toLowerCase()));

    // Fetch Visual Bible
    const visualBible = await prisma.productionVisualBible.findFirst({
      where: { project_id: project.id },
      include: {
        Versions: {
          orderBy: { version_number: 'desc' },
          take: 1
        }
      }
    });

    const vbVersion = (visualBible?.Versions[0] || {}) as any;

    const rawData = {
      project: {
        id: project.id,
        name: project.project_name
      },
      script: {
        id: script?.id,
        content: script?.content
      },
      scene: {
        id: scene.id,
        scene_number: scene.scene_number,
        title: scene.title,
        description: scene.description,
        time_of_day: null,
        scene_type: null,
        mood: scene.mood
      },
      shot: {
        id: shot.id,
        shot_number: shot.shot_number,
        shot_type: shotVersion.shot_type,
        camera_angle: shotVersion.camera_angle,
        lens: shotVersion.lens,
        movement: shotVersion.movement,
        lighting: shotVersion.lighting,
        character_blocking: shotVersion.character_blocking
      },
      visualBible: {
        style_bible: vbVersion.style_bible,
        character_bible: vbVersion.character_bible,
        location_bible: vbVersion.location_bible,
        lighting_bible: vbVersion.lighting_bible
      },
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        reference_image_url: c.reference_image_url,
        outfit: null
      })),
      locations: locations.map(l => ({
        id: l.id,
        name: l.name,
        description: l.description
      })),
      continuity: []
    };

    const validatedData = ProductionPackageSchema.parse(rawData);

    return validatedData;
  }

  static async synchronizePackage(shotId: string, projectId: string) {
    try {
      const authCheck = await prisma.productionShot.findUnique({
        where: { id: shotId },
        include: { ProductionScene: { include: { ProductionStoryboard: true } } }
      });
      
      if (authCheck?.ProductionScene?.ProductionStoryboard?.project_id !== projectId) {
        throw new Error("Unauthorized: Shot does not belong to the specified project.");
      }

      const packageData = await this.generatePackageForShot(shotId);
      
      let prodPackage = await prisma.productionPackage.findUnique({
        where: { shot_id: shotId }
      });

      if (!prodPackage) {
        prodPackage = await prisma.productionPackage.create({
          data: {
            project_id: projectId,
            shot_id: shotId,
            status: "Generated"
          }
        });
      }

      await prisma.productionPackageVersion.create({
        data: {
          package_id: prodPackage.id,
          compiled_data: packageData,
          status: "Active"
        }
      });
      
      return prodPackage;
    } catch (e) {
      console.error("Failed to synchronize package for shot", shotId, e);
      throw e;
    }
  }

}
