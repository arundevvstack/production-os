# DP Creative OS — Database Schema

The platform relies on PostgreSQL, managed via Prisma ORM.

## Schema Conventions
- All models use UUIDs for `id`.
- Foreign keys are strictly maintained with explicit `@relation` fields.
- Cascading deletes are enforced on `project_id` and `scene_id` dependencies to prevent orphaned records.

## Core Models

### 1. Project & Workflow
- **`Project`**: The root container.
- **`ProductionStoryboard`**: Linked 1:1 to Project. Contains Scenes.
- **`ProductionScene`**: Represents a physical block of the story. Contains Shots.
- **`ProductionShot`**: Represents a single camera angle. The core atomic unit for AI generation.
- **`ProductionShotRequirement`**: Extracted data (VFX, Casting) linked to a shot.

### 2. Generation & AI
- **`ProductionPromptSet`**: Contains the physical image/video prompt strings. Linked to Shot.
- **`ProductionAIJob`**: Represents an active API request to an external provider (OpenRouter).
- **`ProductionAsset`**: The returned media (Image/Video).
- **`ProductionAssetVersion`**: Handles versioning, approvals, and reviews for an Asset.

### 3. Creative Intelligence
- **`ProductionCreativeMemory`**: Profiles representing Characters, Brands, and Styles.
- **`_ProductionShotToCreativeMemory`**: An implicit many-to-many join table allowing memories to be attached to shots.
- **`ProductionTimelineEvent`**: A ledger that records every action (CREATED, APPROVED, GENERATED) across the system.

## Prisma Configuration
- **Provider**: `postgresql`
- **URL**: Uses Supabase connection pooling.

To update the database after schema changes:
```bash
npx prisma db push
npx prisma generate
```
