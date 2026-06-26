import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const missingModels = `
model ProductionScript {
  id              String   @id @default(uuid())
  project_id      String   @unique
  version         Int      @default(1)
  content         String?
  comments        Json?
  checklist       Json?
  is_approved     Boolean  @default(false)
  is_locked       Boolean  @default(false)
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  storyboard      ProductionStoryboard?
}

model ProductionStoryboard {
  id              String   @id @default(uuid())
  project_id      String   @unique
  script_id       String   @unique
  is_completed    Boolean  @default(false)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  script          ProductionScript @relation(fields: [script_id], references: [id], onDelete: Cascade)
  scenes          ProductionScene[]
}

model ProductionScene {
  id              String   @id @default(uuid())
  storyboard_id   String
  scene_number    Int
  title           String
  description     String?
  duration        String?
  notes           String?
  mood            String?
  objective       String?
  status          String   @default("draft")
  completion_pct  Int      @default(0)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  storyboard      ProductionStoryboard @relation(fields: [storyboard_id], references: [id], onDelete: Cascade)
  shots           ProductionShot[]
  references      ProductionReference[]
  assets          ProductionAssetPlaceholder[]
  generated_assets ProductionAsset[]
  ai_jobs         ProductionAIJob[]
}

model ProductionShot {
  id              String   @id @default(uuid())
  scene_id        String
  shot_number     Int
  camera          String?
  movement        String?
  lens            String?
  environment     String?
  character       String?
  lighting        String?
  duration        String?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  scene           ProductionScene @relation(fields: [scene_id], references: [id], onDelete: Cascade)
  prompt_sets     ProductionPromptSet[]
  assets          ProductionAssetPlaceholder[]
  generated_assets ProductionAsset[]
  ai_jobs         ProductionAIJob[]
}

model ProductionPromptSet {
  id                  String   @id @default(uuid())
  shot_id             String
  image_prompt        String?
  video_prompt        String?
  character_prompt    String?
  environment_prompt  String?
  camera_prompt       String?
  lighting_prompt     String?
  voice_prompt        String?
  music_prompt        String?
  negative_prompt     String?
  
  version             Int      @default(1)
  status              String   @default("Draft")
  completion_pct      Int      @default(0)

  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  shot                ProductionShot @relation(fields: [shot_id], references: [id], onDelete: Cascade)
  generated_assets    ProductionAsset[]
  ai_jobs             ProductionAIJob[]
}

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

if (!schema.includes('ProductionScript')) {
  // We also need to make sure the Project model has the reverse relations
  schema = schema.replace(
    /model Project {[\s\S]*?campaigns\s+Campaign\[\]\n}/,
    (match) => {
      if (match.includes('production_script')) return match;
      return match.replace(
        'campaigns         Campaign[]',
        'campaigns         Campaign[]\n  production_script ProductionScript?\n  production_storyboard ProductionStoryboard?\n  production_assets ProductionAsset[]\n  production_ai_jobs ProductionAIJob[]'
      );
    }
  );
  
  // We need to add the polymorphic fields back to ProductionComment if they don't exist
  // Oh wait, ProductionComment was added by `append_models.ts` and it DOES have the fields. Let me check.
  // Actually, I just ran `append_models.ts` so ProductionComment is there.
  
  schema += missingModels;
  fs.writeFileSync(schemaPath, schema);
  console.log("Restored Phase 1, Phase 2, and Phase 3 models successfully.");
} else {
  console.log("ProductionScript already exists.");
}
