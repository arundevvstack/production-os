import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

const newModels = `
// --------------------------------------------------
// DP PRODUCTION OS: V1.1 STABILIZATION SPRINT MODELS
// --------------------------------------------------

model ProductionComment {
  id              String   @id @default(uuid())
  content         String
  author_id       String
  resolved        Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  // Polymorphic-style relations
  project_id      String?
  script_id       String?
  storyboard_id   String?
  scene_id        String?
  shot_id         String?
  prompt_set_id   String?
  parent_id       String?
}

model ProductionAttachment {
  id              String   @id @default(uuid())
  file_name       String
  file_type       String
  file_size       Int
  url             String
  uploader_id     String
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project_id      String?
  script_id       String?
  scene_id        String?
  shot_id         String?
  prompt_set_id   String?
}

model ProductionChecklist {
  id              String   @id @default(uuid())
  title           String
  project_id      String
  target_type     String   // 'script', 'storyboard', 'shot_list', 'prompts'
  target_id       String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  items           ProductionChecklistItem[]
}

model ProductionChecklistItem {
  id              String   @id @default(uuid())
  checklist_id    String
  content         String
  is_completed    Boolean  @default(false)
  is_required     Boolean  @default(true)
  completed_by    String?
  completed_at    DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  checklist       ProductionChecklist @relation(fields: [checklist_id], references: [id], onDelete: Cascade)
}

model ProductionActivityEvent {
  id              String   @id @default(uuid())
  project_id      String
  event_type      String
  description     String
  actor_id        String
  metadata        Json?
  created_at      DateTime @default(now())
}

model ProductionWorkflowTemplate {
  id              String   @id @default(uuid())
  name            String
  description     String?
  is_default      Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  stages          ProductionWorkflowStage[]
}

model ProductionWorkflowStage {
  id              String   @id @default(uuid())
  template_id     String
  name            String
  order_index     Int
  required_role   String?
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  template        ProductionWorkflowTemplate @relation(fields: [template_id], references: [id], onDelete: Cascade)
  dependencies    ProductionWorkflowDependency[] @relation("StageDependencies")
  dependent_on    ProductionWorkflowDependency[] @relation("DependsOnStage")
}

model ProductionWorkflowDependency {
  id              String   @id @default(uuid())
  stage_id        String
  depends_on_id   String
  created_at      DateTime @default(now())

  stage           ProductionWorkflowStage @relation("StageDependencies", fields: [stage_id], references: [id], onDelete: Cascade)
  depends_on      ProductionWorkflowStage @relation("DependsOnStage", fields: [depends_on_id], references: [id], onDelete: Cascade)
}
`;

const currentContent = fs.readFileSync(schemaPath, 'utf8');
if (!currentContent.includes('ProductionComment')) {
  fs.appendFileSync(schemaPath, newModels);
  console.log('Appended models to schema.prisma');
} else {
  console.log('Models already exist in schema.prisma');
}
