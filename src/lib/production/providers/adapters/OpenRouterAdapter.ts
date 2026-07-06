import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse, GenerationOptions } from "../ProviderAdapterInterface";

export class OpenRouterAdapter implements ProviderAdapterInterface {
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<ProviderModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        capabilities: ["chat"]
      }));
    } catch (e) {
      return [];
    }
  }

  async submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    try {
      const payload = {
        model: model,
        messages: [{ role: "user", content: prompt }],
        ...options
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://media-os.local',
          'X-Title': 'DP Production OS'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content || "";

      return {
        textContent,
        metadata: {
          provider: "OpenRouter",
          model: model,
          durationMs: Date.now() - startTime,
          usage: data.usage,
          raw_response: data
        }
      };
    } catch (e: any) {
      throw new Error(`OpenRouter Adapter failed: ${e.message}`);
    }
  }

  // ---- Required Interface Methods (Stubs for Unsupported) ----
  
  async generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateImage not supported by OpenRouter (Text only).");
  }
  
  async generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVideo not supported by OpenRouter (Text only).");
  }
  
  async generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateAudio not supported by OpenRouter (Text only).");
  }
  
  async generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVoice not supported by OpenRouter (Text only).");
  }
  
  async generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    // Generate storyboard via prompt
    const prompt = `Create a storyboard for the following script:\n\n${scriptContent}`;
    return this.submitJob(apiKey, model, prompt, options);
  }
  
  async generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVariation not supported by OpenRouter (Text only).");
  }
  
  async upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("upscale not supported by OpenRouter.");
  }
  
  async extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("extend not supported by OpenRouter.");
  }
  
  async cancelJob(apiKey: string, externalJobId: string): Promise<boolean> {
    throw new Error("cancelJob not supported by OpenRouter.");
  }
  
  async checkStatus(apiKey: string, externalJobId: string): Promise<{ status: "running" | "completed" | "failed"; progress?: number; result?: NormalizedProviderResponse; error?: string; }> {
    throw new Error("checkStatus not supported by OpenRouter.");
  }
}
