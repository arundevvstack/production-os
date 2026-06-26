import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('ProductionReference')) {
  // Phase 2 updates
  schema = schema.replace(
    /model ProductionScene {[\s\S]*?shots\s+ProductionShot\[\]\n}/,
    (match) => {
      return match.replace(
        'notes           String?',
        'notes           String?\n  mood            String?\n  objective       String?'
      ).replace(
        'shots           ProductionShot[]',
        'shots           ProductionShot[]\n  references      ProductionReference[]\n  assets          ProductionAssetPlaceholder[]'
      );
    }
  );

  schema = schema.replace(
    /model ProductionShot {[\s\S]*?prompt_sets\s+ProductionPromptSet\[\]\n}/,
    (match) => {
      return match.replace(
        'prompt_sets     ProductionPromptSet[]',
        'prompt_sets     ProductionPromptSet[]\n  assets          ProductionAssetPlaceholder[]'
      );
    }
  );

  const phase2Models = `
model ProductionReference {
  id              String   @id @default(uuid())
  scene_id        String
  title           String
  type            String   // Image, Video, PDF, Moodboard, Link
  uploader_id     String?
  thumbnail_url   String?
  url             String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  scene           ProductionScene @relation(fields: [scene_id], references: [id], onDelete: Cascade)
}

model ProductionAssetPlaceholder {
  id              String   @id @default(uuid())
  scene_id        String?
  shot_id         String?
  type            String   // Image, Video, Voice, Music, SFX, Character, Background
  status          String   @default("Pending")
  version         Int      @default(1)
  notes           String?
  assigned_to     String?
  future_ai_job_id String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  scene           ProductionScene? @relation(fields: [scene_id], references: [id], onDelete: Cascade)
  shot            ProductionShot?  @relation(fields: [shot_id], references: [id], onDelete: Cascade)
}
`;
  schema += phase2Models;
}

if (!schema.includes('ProductionAIProvider')) {
  // Phase 3 updates
  schema = schema.replace(
    /model Project {[\s\S]*?campaigns\s+Campaign\[\]\n}/,
    (match) => {
      return match.replace(
        'campaigns         Campaign[]',
        'campaigns         Campaign[]\n  production_assets ProductionAsset[]\n  production_ai_jobs ProductionAIJob[]'
      );
    }
  );

  schema = schema.replace(
    /model ProductionScene {[\s\S]*?assets\s+ProductionAssetPlaceholder\[\]\n}/,
    (match) => {
      return match.replace(
        'assets          ProductionAssetPlaceholder[]',
        'assets          ProductionAssetPlaceholder[]\n  generated_assets ProductionAsset[]\n  ai_jobs         ProductionAIJob[]'
      );
    }
  );

  schema = schema.replace(
    /model ProductionShot {[\s\S]*?assets\s+ProductionAssetPlaceholder\[\]\n}/,
    (match) => {
      return match.replace(
        'assets          ProductionAssetPlaceholder[]',
        'assets          ProductionAssetPlaceholder[]\n  generated_assets ProductionAsset[]\n  ai_jobs         ProductionAIJob[]'
      );
    }
  );

  schema = schema.replace(
    /model ProductionPromptSet {[\s\S]*?completion_pct\s+Int\s+@default\(0\)\n}/,
    (match) => {
      return match.replace(
        'completion_pct  Int      @default(0)',
        'completion_pct  Int      @default(0)\n  generated_assets ProductionAsset[]\n  ai_jobs         ProductionAIJob[]'
      );
    }
  );

  const phase3Models = `
model ProductionAIProvider {
  id              String   @id @default(uuid())
  name            String   @unique
  category        String
  is_enabled      Boolean  @default(true)
  supported_asset_types String[]
  supported_models String[]
  capabilities    Json?
  api_endpoint    String?
  auth_type       String
  status          String   @default("active")
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  jobs            ProductionAIJob[]
}

model ProductionAIJob {
  id              String   @id @default(uuid())
  project_id      String
  scene_id        String?
  shot_id         String?
  prompt_set_id   String?
  provider_id     String
  asset_type      String
  model_name      String
  status          String   @default("Queued")
  priority        String   @default("Normal")
  created_by      String
  started_at      DateTime?
  completed_at    DateTime?
  error_message   String?
  external_job_id String?
  metadata        Json?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  scene           ProductionScene? @relation(fields: [scene_id], references: [id], onDelete: SetNull)
  shot            ProductionShot?  @relation(fields: [shot_id], references: [id], onDelete: SetNull)
  prompt_set      ProductionPromptSet? @relation(fields: [prompt_set_id], references: [id], onDelete: SetNull)
  provider        ProductionAIProvider @relation(fields: [provider_id], references: [id])
  
  asset_versions  ProductionAssetVersion[]
}

model ProductionAsset {
  id              String   @id @default(uuid())
  project_id      String
  scene_id        String?
  shot_id         String?
  prompt_set_id   String?
  creator_id      String?
  type            String
  status          String   @default("Active")
  tags            String[]
  current_version_id String?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  scene           ProductionScene? @relation(fields: [scene_id], references: [id], onDelete: SetNull)
  shot            ProductionShot?  @relation(fields: [shot_id], references: [id], onDelete: SetNull)
  prompt_set      ProductionPromptSet? @relation(fields: [prompt_set_id], references: [id], onDelete: SetNull)

  versions        ProductionAssetVersion[]
}

model ProductionAssetVersion {
  id              String   @id @default(uuid())
  asset_id        String
  job_id          String?
  version_number  Int
  provider_id     String?
  model_name      String?
  prompt_snapshot Json?
  file_url        String?
  thumbnail_url   String?
  metadata        Json?
  notes           String?
  status          String   @default("Ready")
  is_current      Boolean  @default(true)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  asset           ProductionAsset @relation(fields: [asset_id], references: [id], onDelete: Cascade)
  job             ProductionAIJob? @relation(fields: [job_id], references: [id], onDelete: SetNull)
}
`;
  schema += phase3Models;
}

fs.writeFileSync(schemaPath, schema);
console.log("Appended Phase 2 and Phase 3 models to schema.prisma");
