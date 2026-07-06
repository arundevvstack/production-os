import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse, GenerationOptions } from "../ProviderAdapterInterface";

export class FluxAdapter implements ProviderAdapterInterface {
  private readonly baseUrl = 'https://api.bfl.ml/v1';

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      // BFL API currently doesn't have a simple /models or /me endpoint, 
      // but testing a simple prompt for validation or assuming true if format matches.
      return apiKey.length > 20;
    } catch {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<ProviderModel[]> {
    return [
      { id: "flux-pro-1.1", name: "Flux Pro 1.1", capabilities: ["image"] },
      { id: "flux-dev", name: "Flux Dev", capabilities: ["image"] }
    ];
  }

  async generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const payload = {
      prompt: prompt,
      width: 1024,
      height: 1024,
      ...options
    };

    const endpoint = model.includes('pro') ? 'flux-pro-1.1' : 'flux-dev';
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'x-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    // BFL returns an async task ID
    return {
      metadata: {
        provider: "Flux",
        model: model,
        durationMs: Date.now() - startTime,
        raw_response: data // { id: "task_id" }
      }
    };
  }
  
  async generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVideo not supported by Flux.");
  }
  
  async generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateAudio not supported by Flux.");
  }
  
  async generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVoice not supported by Flux.");
  }
  
  async generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateStoryboard natively not supported, use prompts.");
  }
  
  async generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVariation currently requires specific image2image endpoint.");
  }
  
  async upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("upscale not supported.");
  }
  
  async extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("extend not supported.");
  }
  
  async cancelJob(apiKey: string, externalJobId: string): Promise<boolean> {
    throw new Error("cancelJob not natively supported by BFL API.");
  }
  
  async checkStatus(apiKey: string, externalJobId: string): Promise<{ status: "running" | "completed" | "failed"; progress?: number; result?: NormalizedProviderResponse; error?: string; }> {
    const response = await fetch(`${this.baseUrl}/get_result?id=${externalJobId}`, {
      method: 'GET',
      headers: { 'x-key': apiKey }
    });
    
    if (!response.ok) throw new Error("Failed to check status.");
    const data = await response.json();
    
    if (data.status === 'Ready') {
      return {
        status: 'completed',
        progress: 100,
        result: {
          assetUrl: data.result.sample, // URL to the generated image
          metadata: { provider: "Flux", model: "flux", durationMs: 0, raw_response: data }
        }
      };
    } else if (data.status === 'Error') {
      return { status: 'failed', error: data.error || 'Unknown error' };
    }
    
    return { status: 'running', progress: 50 };
  }

  async submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse> {
    throw new Error("submitJob (Text completion) not supported by Flux API.");
  }
}
