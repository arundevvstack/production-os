const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Append new models
const newModels = `
model ProductionGenerationPreset {
  id              String   @id @default(uuid())
  project_id      String
  user_id         String
  name            String
  category        String   // "Portrait", "Landscape", "Instagram", etc.
  parameters      Json
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
}

model ProductionGenerationSession {
  id              String   @id @default(uuid())
  project_id      String
  user_id         String
  started_at      DateTime @default(now())
  ended_at        DateTime?
  total_tokens    Int      @default(0)
  total_cost      Float    @default(0.0)
  providers_used  String[]
  assets_created  Int      @default(0)

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
`;

if (!content.includes('model ProductionGenerationPreset')) {
  content += newModels;
}

// Add relations to User
if (!content.includes('generation_presets ProductionGenerationPreset[]')) {
  content = content.replace(/model User \{[\s\S]*?\}/, match => {
    return match.replace(/\}/, '  generation_presets ProductionGenerationPreset[]\n  generation_sessions ProductionGenerationSession[]\n}');
  });
}

// Add relations to Project
if (!content.includes('generation_presets ProductionGenerationPreset[]')) {
  content = content.replace(/model Project \{[\s\S]*?\}/, match => {
    return match.replace(/\}/, '  generation_presets ProductionGenerationPreset[]\n  generation_sessions ProductionGenerationSession[]\n}');
  });
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Added Studio models to schema!');
