const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModels = `
model ProductionCreativeMemory {
  id              String   @id @default(uuid())
  project_id      String
  user_id         String
  type            String   // "Character", "Environment", "Brand", "Style", etc.
  name            String
  description     String?
  attributes      Json     // Flexible storage for Age, Gender, Color Palette, etc.
  prompt_snippet  String   // The text injected into the prompt
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  versions        ProductionCreativeMemoryVersion[]
  shots           ProductionShot[] @relation("ShotToMemory")
}

model ProductionCreativeMemoryVersion {
  id                  String   @id @default(uuid())
  memory_id           String
  version_number      Int
  attributes          Json
  prompt_snippet      String
  created_at          DateTime @default(now())
  created_by          String

  memory              ProductionCreativeMemory @relation(fields: [memory_id], references: [id], onDelete: Cascade)
}
`;

if (!content.includes('model ProductionCreativeMemory {')) {
  content += newModels;
}

// Inject relations into User
if (!content.includes('creative_memories ProductionCreativeMemory[]')) {
  content = content.replace('  generation_sessions ProductionGenerationSession[]\n}', '  generation_sessions ProductionGenerationSession[]\n  creative_memories ProductionCreativeMemory[]\n}');
}

// Inject relations into Project
if (!content.includes('creative_memories ProductionCreativeMemory[]')) {
  content = content.replace('  generation_sessions ProductionGenerationSession[]\n}', '  generation_sessions ProductionGenerationSession[]\n  creative_memories ProductionCreativeMemory[]\n}');
}

// Inject relations into ProductionShot
if (!content.includes('creative_memories ProductionCreativeMemory[]')) {
  content = content.replace('  generated_assets ProductionAsset[]\n}', '  generated_assets ProductionAsset[]\n  creative_memories ProductionCreativeMemory[] @relation("ShotToMemory")\n}');
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Creative memory models added!');
