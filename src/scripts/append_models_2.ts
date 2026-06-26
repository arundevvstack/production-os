import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add relations to Project
schema = schema.replace(
  /campaigns\s+Campaign\[\]/,
  `campaigns         Campaign[]
  production_assets ProductionAsset[]
  production_ai_jobs ProductionAIJob[]`
);

// Add relations to ProductionScene
schema = schema.replace(
  /assets\s+ProductionAssetPlaceholder\[\]/,
  `assets          ProductionAssetPlaceholder[]
  generated_assets ProductionAsset[]
  ai_jobs         ProductionAIJob[]`
);

// Add relations to ProductionShot
schema = schema.replace(
  /assets\s+ProductionAssetPlaceholder\[\]/,
  `assets          ProductionAssetPlaceholder[]
  generated_assets ProductionAsset[]
  ai_jobs         ProductionAIJob[]`
);

// Add relations to ProductionPromptSet
schema = schema.replace(
  /assets\s+ProductionAssetPlaceholder\[\]/,
  `assets          ProductionAssetPlaceholder[]
  generated_assets ProductionAsset[]
  ai_jobs         ProductionAIJob[]`
);

const newModels = `
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

if (!schema.includes('ProductionAIProvider')) {
  schema += newModels;
  fs.writeFileSync(schemaPath, schema);
  console.log("Appended new models to schema.prisma");
} else {
  console.log("Models already exist.");
}
