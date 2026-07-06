import { ProviderAdapterInterface } from "./ProviderAdapterInterface";
import { OpenRouterAdapter } from "./adapters/OpenRouterAdapter";
import { OpenAIAdapter } from "./adapters/OpenAIAdapter";
import { GeminiAdapter } from "./adapters/GeminiAdapter";
import { RunwayAdapter } from "./adapters/RunwayAdapter";
import { LumaAdapter } from "./adapters/LumaAdapter";
import { FluxAdapter } from "./adapters/FluxAdapter";
import prisma from "@/lib/prisma";
import { CryptoUtils } from "../CryptoUtils";
import crypto from "crypto";

export class ProviderManager {
  
  /**
   * Returns the correct adapter for a given provider name.
   */
  static getAdapter(providerName: string): ProviderAdapterInterface {
    switch (providerName.toLowerCase()) {
      case 'openrouter': return new OpenRouterAdapter();
      case 'openai': return new OpenAIAdapter();
      case 'google genai': 
      case 'gemini': return new GeminiAdapter();
      case 'runway': return new RunwayAdapter();
      case 'luma': return new LumaAdapter();
      case 'flux': return new FluxAdapter();
      default:
        throw new Error(`Provider adapter not found for: ${providerName}`);
    }
  }

  /**
   * Retrieves and decrypts the API key for a specific provider.
   */
  static async getDecryptedCredentials(providerId: string): Promise<string> {
    const provider = await prisma.productionAIProvider.findUnique({ where: { id: providerId } });
    const creds = await prisma.productionProviderCredential.findMany({
      where: {
        provider_id: providerId
      }
    });

    const cred = creds[0];

    if (!cred || !cred.api_key_encrypted) {
      if (provider?.name === "Google GenAI" && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
      }
      throw new Error("No credentials configured for this provider");
    }

    return CryptoUtils.decrypt(cred.api_key_encrypted);
  }

  /**
   * Saves or updates provider credentials. Encrypts the key before saving.
   */
  static async saveCredentials(providerId: string, rawApiKey: string): Promise<void> {
    const encrypted = CryptoUtils.encrypt(rawApiKey);
    
    // First, try validating it via the adapter if we know the provider name
    const providerObj = await prisma.productionAIProvider.findUnique({ where: { id: providerId } });
    if (!providerObj) throw new Error("Provider not found in registry");

    let status = "Offline";
    try {
      const adapter = this.getAdapter(providerObj.name);
      const isValid = await adapter.validateCredentials(rawApiKey);
      status = isValid ? "Online" : "Invalid";
    } catch (e) {
      // If we don't have an adapter yet, we just save it as Offline/Unknown
      status = "Offline";
    }

    const existingCreds = await prisma.productionProviderCredential.findMany({
      where: { provider_id: providerId }
    });

    if (existingCreds.length > 0) {
      await prisma.productionProviderCredential.update({
        where: { id: existingCreds[0].id },
        data: {
          api_key_encrypted: encrypted,
          status,
          last_tested_at: new Date(),
          updated_at: new Date()
        }
      });
    } else {
      await prisma.productionProviderCredential.create({
        data: {
          id: crypto.randomUUID(),
          provider_id: providerId,
          api_key_encrypted: encrypted,
          status,
          last_tested_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  }

  /**
   * List all providers with their current credential status
   */
  static async getProviderStatuses(): Promise<any[]> {
    const providers = await prisma.productionAIProvider.findMany({
      include: {
        ProductionProviderCredential: true
      }
    });

    return providers.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      is_enabled: p.is_enabled,
      status: p.ProductionProviderCredential[0]?.status || "Unconfigured",
      last_tested_at: p.ProductionProviderCredential[0]?.last_tested_at || null
    }));
  }

  /**
   * Used by UI to quickly test an API key before saving
   */
  static async testCredentials(providerName: string, rawApiKey: string): Promise<boolean> {
    const adapter = this.getAdapter(providerName);
    return adapter.validateCredentials(rawApiKey);
  }
}
