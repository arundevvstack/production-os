import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse, GenerationOptions } from "../ProviderAdapterInterface";

export class LumaAdapter implements ProviderAdapterInterface {
  private readonly baseUrl = 'https://api.lumalabs.ai/dream-machine/v1';

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/generations`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<ProviderModel[]> {
    return [
      { id: "ray-1-6", name: "Luma Ray 1.6", capabilities: ["video"] }
    ];
  }

  async generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateImage not supported by Luma API.");
  }
  
  async generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const payload = {
      prompt: prompt,
      ...options
    };

    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    // Luma returns an ID for async polling
    return {
      metadata: {
        provider: "Luma",
        model: model,
        durationMs: Date.now() - startTime,
        raw_response: data
      }
    };
  }
  
  async generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateAudio not supported.");
  }
  
  async generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVoice not supported.");
  }
  
  async generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateStoryboard not supported.");
  }
  
  async generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVariation not supported natively.");
  }
  
  async upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("upscale not supported.");
  }
  
  async extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("extend not supported.");
  }
  
  async cancelJob(apiKey: string, externalJobId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/generations/${externalJobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  }
  
  async checkStatus(apiKey: string, externalJobId: string): Promise<{ status: "running" | "completed" | "failed"; progress?: number; result?: NormalizedProviderResponse; error?: string; }> {
    const response = await fetch(`${this.baseUrl}/generations/${externalJobId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) throw new Error("Failed to check status.");
    const data = await response.json();
    
    if (data.state === 'completed') {
      return {
        status: 'completed',
        progress: 100,
        result: {
          assetUrl: data.assets?.video,
          metadata: { provider: "Luma", model: "ray-1-6", durationMs: 0, raw_response: data }
        }
      };
    } else if (data.state === 'failed') {
      return { status: 'failed', error: data.failure_reason || 'Unknown error' };
    }
    
    return { status: 'running', progress: 50 };
  }

  async submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse> {
    throw new Error("submitJob (Text completion) not supported by Luma API.");
  }
}
