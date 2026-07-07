const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const latestVB = await prisma.productionVisualBibleVersion.findFirst({ orderBy: { created_at: 'desc' } });
  if (latestVB) {
    await prisma.productionVisualBibleVersion.update({
      where: { id: latestVB.id },
      data: {
        style_bible: {
            overall_style: "Cinematic realism with magical realism elements",
            genre: "Narrative Short Film",
            mood: "Inspiring, wonderful, magical",
            color_language: "Deep blues, stark blacks, warm yellows",
            contrast: "High contrast with starlight highlights",
            texture: "Gritty coastal roads, glossy motorcycle, soft starry sky",
            realism_level: "Cinematic",
            rendering_style: "Live-action feel",
            reference_directors: ["Alfonso Cuarón"]
        },
        character_bible: [
            {
              character_name: "Krishna",
              profile: "7 year old child full of wonder",
              visual_description: "Wide-eyed, wind blowing through hair",
              age: "7",
              ethnicity: "Indian",
              body_type: "Child",
              hair: "Dark, windblown",
              skin_tone: "Warm",
              wardrobe_concept: "Casual, comfortable travel clothes"
            },
            {
              character_name: "Father",
              profile: "Caring father driving a motorcycle",
              visual_description: "Focused on the road, protective",
              age: "30s",
              ethnicity: "Indian",
              body_type: "Average",
              hair: "Dark",
              skin_tone: "Warm",
              wardrobe_concept: "Casual jacket for night riding"
            }
        ],
        location_bible: [
            {
              location_name: "Rameswaram Coastal Road",
              architecture: "Open road next to the ocean",
              lighting: "Starlight and warm yellow streetlights",
              weather: "Clear night",
              time_of_day: "Night",
              mood: "Magical and vast",
              color_palette: ["#000033", "#FFD700", "#1A1A1A"],
              textures: ["Asphalt", "Ocean waves", "Metal"]
            }
        ],
        prop_bible: [
            {
              prop_name: "Motorcycle",
              material: "Metal and leather",
              condition: "Well-used",
              brand: "Royal Enfield",
              usage: "Hero vehicle carrying characters"
            }
        ]
      }
    });
    console.log('Fixed Visual Bible');
  }
}
run().finally(() => prisma.$disconnect());
