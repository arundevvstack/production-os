import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse } from "../ProviderAdapterInterface";

export class OpenRouterAdapter implements ProviderAdapterInterface {
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      // Make a lightweight request to the models endpoint
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
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
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch models");
      const data = await response.json();
      
      return data.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        capabilities: ["chat"]
      }));
    } catch (e) {
      console.error("OpenRouterAdapter listModels error:", e);
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
          'HTTP-Referer': 'https://media-os.local', // OpenRouter requires this optionally
          'X-Title': 'DP Production OS'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

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

  async submitStreamingJob(apiKey: string, model: string, prompt: string, systemPrompt?: string, options?: any): Promise<ReadableStream> {
    const payload = {
      model: model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      stream: true,
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

    if (!response.ok || !response.body) {
      throw new Error(`OpenRouter API streaming error: ${response.statusText}`);
    }

    return response.body;
  }
}
