# DP Creative OS — Provider Framework

The Provider Framework is the abstraction layer separating the Generation Studio UI from the specific external AI generation services (OpenAI, Anthropic, Midjourney, Runway, etc.).

## Architecture

```
Generation Studio (Client) 
  -> Job Engine (API Route) 
    -> Job Dispatcher (Server Service) 
      -> Provider Adapter (Vendor Specific)
        -> Asset Library (Postgres)
```

## Creating a new Provider

To add a new AI provider, you must create a class that implements the `AIProvider` interface.

### Step 1: Create the Adapter
Create a new file in `src/lib/production/providers/` (e.g., `RunwayProvider.ts`).

```typescript
import { AIProvider, AIProviderConfig, AIGenerationResult } from "./AIProvider";

export class RunwayProvider implements AIProvider {
  id = "Runway";
  name = "Runway Gen-3 Alpha";

  async generate(prompt: string, config: AIProviderConfig): Promise<AIGenerationResult> {
    // 1. Format the request for Runway's API
    // 2. Execute fetch()
    // 3. Return the standardized AIGenerationResult
    return {
      status: 'completed',
      assetUrl: 'https://runwayml.com/generated-video.mp4',
      providerId: this.id,
      modelUsed: config.modelName,
      cost: 0.05
    };
  }
}
```

### Step 2: Register the Provider
Open `src/lib/production/providers/JobDispatcher.ts` and add your new provider to the `providers` map.

```typescript
import { RunwayProvider } from "./RunwayProvider";

const providers = new Map<string, AIProvider>();
providers.set("OpenRouter", new OpenRouterProvider());
providers.set("Runway", new RunwayProvider());
```

Now, any AI Job dispatched with `providerId = "Runway"` will automatically be routed to your new adapter.
