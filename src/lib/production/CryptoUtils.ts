import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// For prototype purposes, use a fallback if not provided in env. Do not use this fallback in real production.
const SECRET_KEY = process.env.PROVIDER_ENCRYPTION_KEY || '12345678901234567890123456789012'; 

export class CryptoUtils {
  
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) throw new Error('Invalid encrypted text format');
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedData = parts[2];
      
      const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (e) {
      console.error("Decryption failed:", e);
      throw new Error("Failed to decrypt credentials. The encryption key may have changed.");
    }
  }
}
