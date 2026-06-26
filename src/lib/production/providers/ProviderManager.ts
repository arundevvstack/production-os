import { ProviderAdapterInterface } from "./ProviderAdapterInterface";
import { OpenRouterAdapter } from "./adapters/OpenRouterAdapter";
import prisma from "@/lib/prisma";
import { CryptoUtils } from "../CryptoUtils";

export class ProviderManager {
  
  /**
   * Returns the correct adapter for a given provider name.
   */
  static getAdapter(providerName: string): ProviderAdapterInterface {
    switch (providerName.toLowerCase()) {
      case 'openrouter':
        return new OpenRouterAdapter();
      // Future providers would be registered here:
      // case 'runway': return new RunwayAdapter();
      // case 'midjourney': return new MidjourneyAdapter();
      default:
        throw new Error(`Provider adapter not found for: ${providerName}`);
    }
  }

  /**
   * Retrieves and decrypts the API key for a specific provider and company.
   */
  static async getDecryptedCredentials(companyId: string, providerId: string): Promise<string> {
    const cred = await prisma.productionProviderCredential.findUnique({
      where: {
        company_id_provider_id: {
          company_id: companyId,
          provider_id: providerId
        }
      }
    });

    if (!cred || !cred.api_key_encrypted) {
      throw new Error("No credentials configured for this provider");
    }

    return CryptoUtils.decrypt(cred.api_key_encrypted);
  }

  /**
   * Saves or updates provider credentials. Encrypts the key before saving.
   */
  static async saveCredentials(companyId: string, providerId: string, rawApiKey: string): Promise<void> {
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

    await prisma.productionProviderCredential.upsert({
      where: {
        company_id_provider_id: {
          company_id: companyId,
          provider_id: providerId
        }
      },
      update: {
        api_key_encrypted: encrypted,
        status,
        last_tested_at: new Date()
      },
      create: {
        company_id: companyId,
        provider_id: providerId,
        api_key_encrypted: encrypted,
        status,
        last_tested_at: new Date()
      }
    });
  }

  /**
   * Tests a provider's credentials directly (without saving).
   */
  static async testCredentials(providerName: string, rawApiKey: string): Promise<boolean> {
    const adapter = this.getAdapter(providerName);
    return adapter.validateCredentials(rawApiKey);
  }
}
