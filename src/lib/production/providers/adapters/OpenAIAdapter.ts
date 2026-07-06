import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse, GenerationOptions } from "../ProviderAdapterInterface";

export class OpenAIAdapter implements ProviderAdapterInterface {
  private readonly baseUrl = 'https://api.openai.com/v1';

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
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
      { id: "gpt-4o", name: "GPT-4o", capabilities: ["chat"] },
      { id: "dall-e-3", name: "DALL-E 3", capabilities: ["image"] },
      { id: "tts-1", name: "TTS-1", capabilities: ["voice"] },
    ];
  }

  async generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const payload = {
      model: model,
      prompt: prompt,
      n: 1,
      size: "1024x1024", // Adjust based on options
      ...options
    };

    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    return {
      assetUrl: data.data[0].url,
      metadata: {
        provider: "OpenAI",
        model: model,
        durationMs: Date.now() - startTime,
        raw_response: data
      }
    };
  }
  
  async generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    // OpenAI currently only supports Sora via closed alpha, stubbing it.
    throw new Error("generateVideo not supported by public OpenAI API yet.");
  }
  
  async generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateAudio (SFX/Music) not supported by OpenAI API.");
  }
  
  async generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const payload = {
      model: model,
      input: text,
      voice: "alloy", // default, could map from prompt
      ...options
    };

    // Note: TTS returns a binary audio file. In a real environment, you'd upload this buffer to Storage (Supabase/Firebase)
    // and return the public URL. Here we simulate that flow or return a base64 Data URL.
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    
    // Convert arrayBuffer to base64 for simplicity in prototype, though uploading is better.
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const assetUrl = `data:audio/mp3;base64,${base64}`;
    
    return {
      assetUrl,
      metadata: {
        provider: "OpenAI",
        model: model,
        durationMs: Date.now() - startTime,
      }
    };
  }
  
  async generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    return this.submitJob(apiKey, model, `Generate storyboard descriptions for: ${scriptContent}`);
  }
  
  async generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateVariation requires binary uploads for OpenAI, not fully implemented here.");
  }
  
  async upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("upscale not supported by OpenAI.");
  }
  
  async extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("extend not supported by OpenAI.");
  }
  
  async cancelJob(apiKey: string, externalJobId: string): Promise<boolean> {
    throw new Error("cancelJob not supported by OpenAI synchronous API.");
  }
  
  async checkStatus(apiKey: string, externalJobId: string): Promise<{ status: "running" | "completed" | "failed"; progress?: number; result?: NormalizedProviderResponse; error?: string; }> {
    throw new Error("checkStatus not supported by OpenAI synchronous API.");
  }

  async submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse> {
    const startTime = Date.now();
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }], ...options })
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return {
      textContent: data.choices?.[0]?.message?.content || "",
      metadata: { provider: "OpenAI", model: model, durationMs: Date.now() - startTime, usage: data.usage }
    };
  }
}
