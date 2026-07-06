import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse, GenerationOptions } from "../ProviderAdapterInterface";

export class RunwayAdapter implements ProviderAdapterInterface {
  private readonly baseUrl = 'https://api.runwayml.com/v1';

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      // Typically /tasks or similar endpoint to check auth
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-09-13' }
      });
      return response.ok || response.status === 400; // 400 means auth passed but bad request
    } catch {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<ProviderModel[]> {
    return [
      { id: "gen3a-turbo", name: "Gen-3 Alpha Turbo", capabilities: ["video"] }
    ];
  }

  async generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateImage not supported by Runway API (Video only).");
  }
  
  async generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const payload = {
      model: model,
      promptText: prompt,
      watermark: false,
      ...options
    };

    const response = await fetch(`${this.baseUrl}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-09-13'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    // Runway returns a Task ID. It's asynchronous.
    return {
      metadata: {
        provider: "Runway",
        model: model,
        durationMs: Date.now() - startTime,
        raw_response: data
      }
    };
  }
  
  async generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateAudio not supported by Runway.");
  }
  
  async generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVoice not supported by Runway.");
  }
  
  async generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateStoryboard not supported.");
  }
  
  async generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVariation not supported.");
  }
  
  async upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("upscale not supported.");
  }
  
  async extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("extend not supported.");
  }
  
  async cancelJob(apiKey: string, externalJobId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/tasks/${externalJobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-09-13' }
    });
    return response.ok;
  }
  
  async checkStatus(apiKey: string, externalJobId: string): Promise<{ status: "running" | "completed" | "failed"; progress?: number; result?: NormalizedProviderResponse; error?: string; }> {
    const response = await fetch(`${this.baseUrl}/tasks/${externalJobId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-09-13' }
    });
    
    if (!response.ok) throw new Error("Failed to check status.");
    const data = await response.json();
    
    if (data.status === 'SUCCEEDED') {
      return {
        status: 'completed',
        progress: 100,
        result: {
          assetUrl: data.output[0],
          metadata: { provider: "Runway", model: "gen3a-turbo", durationMs: 0, raw_response: data }
        }
      };
    } else if (data.status === 'FAILED') {
      return { status: 'failed', error: data.error || 'Unknown error' };
    }
    
    return { status: 'running', progress: data.progress * 100 };
  }

  async submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse> {
    throw new Error("submitJob (Text completion) not supported by Runway API.");
  }
}
