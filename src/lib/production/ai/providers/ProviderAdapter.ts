import { ProviderPayload } from "../GenerationContext";

export abstract class AIProviderAdapter {
  abstract validate(payload: ProviderPayload): boolean;
  abstract generate(payload: ProviderPayload, jobId: string, projectId: string): Promise<{ externalJobId: string; status: string; url?: string }>;
  abstract getStatus(externalJobId: string): Promise<{ status: string; url?: string; error?: string }>;
  abstract cancel(externalJobId: string): Promise<void>;
  abstract estimateCost(payload: ProviderPayload): number;
  abstract supportedFeatures(): string[];
}

export class MockProviderAdapter extends AIProviderAdapter {
  validate(payload: ProviderPayload): boolean {
    return !!payload.prompt;
  }

  async generate(payload: ProviderPayload, jobId: string, projectId: string) {
    console.log(`[MockProvider] Generating with model ${payload.generation_specs?.model}...`);
    return {
      externalJobId: `mock-job-${Date.now()}`,
      status: 'Processing'
    };
  }

  async getStatus(externalJobId: string) {
    const isReady = Math.random() > 0.5;
    if (isReady) {
      return {
        status: 'Completed',
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop'
      };
    }
    return { status: 'Processing' };
  }

  async cancel(externalJobId: string) {
    console.log(`[MockProvider] Cancelled job ${externalJobId}`);
  }

  estimateCost(payload: ProviderPayload): number {
    return 0.01;
  }

  supportedFeatures(): string[] {
    return ["txt2img", "img2img"];
  }
}

export class ProviderRegistry {
  private static providers: Map<string, AIProviderAdapter> = new Map([
    ["mock", new MockProviderAdapter()],
    ["AIGateway", new MockProviderAdapter()], // Fallback for testing
    ["replicate", new MockProviderAdapter()], // Fallback for testing
  ]);

  static register(name: string, adapter: AIProviderAdapter) {
    this.providers.set(name.toLowerCase(), adapter);
  }

  static getAdapter(providerName: string): AIProviderAdapter {
    const adapter = this.providers.get(providerName.toLowerCase());
    if (!adapter) {
      console.warn(`[ProviderRegistry] Provider '${providerName}' not found. Falling back to mock.`);
      return new MockProviderAdapter();
    }
    return adapter;
  }
}
