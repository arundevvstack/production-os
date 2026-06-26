# DP Creative OS — Core API Reference

All backend interactions should happen via Server Actions where possible. For asynchronous tasks (like AI Generation), we expose REST API routes under `/api/v1/`.

## AI Job Engine API

### `POST /api/v1/projects/[projectId]/jobs/run`
Dispatches a new AI generation job to the Job Engine.

**Payload:**
```json
{
  "sceneId": "uuid",
  "shotId": "uuid",
  "promptSetId": "uuid",
  "providerId": "OpenRouter",
  "modelName": "anthropic/claude-3.5-sonnet:beta",
  "assetType": "Image",
  "prompt": "Cinematic shot of a rainy street..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "COMPLETED",
    "assetUrl": "https://..."
  }
}
```

*Note*: In production, generation can take minutes. Currently, the system waits for the provider to return synchronously. In v2.0, this route will return a `{ status: 'QUEUED', jobId: '...' }` which the client will poll.

## Creative Graph API

The Creative Graph does not have traditional REST endpoints. Instead, it is queried server-side via the `GraphEngine` class.

Example usage inside a Server Component:
```typescript
import { GraphEngine } from "@/lib/production/intelligence/GraphEngine";

// Get universal search results
const results = await GraphEngine.universalSearch(projectId, "Arjun");

// Get Timeline
const events = await GraphEngine.getCreativeTimeline(projectId);
```
