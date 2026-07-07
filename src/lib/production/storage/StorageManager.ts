import fs from "fs";
import path from "path";

export interface StorageAdapter {
  upload(buffer: Buffer, filename: string, contentType: string): Promise<string>;
  getPublicUrl(filepath: string): string;
}

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir = path.resolve(process.cwd(), "storage");

  constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const fullPath = path.join(this.baseDir, filename);
    fs.writeFileSync(fullPath, buffer);
    // Returns the relative URL path to access it
    return `/api/v1/storage/${filename}`;
  }

  getPublicUrl(filepath: string): string {
    // If it's already an absolute URL or api path, just return it
    if (filepath.startsWith("http") || filepath.startsWith("/api")) {
      return filepath;
    }
    return `/api/v1/storage/${filepath}`;
  }
}

export class StorageManager {
  private static instance: StorageAdapter;

  static getAdapter(): StorageAdapter {
    if (!this.instance) {
      // Future: check process.env.STORAGE_PROVIDER === 'supabase' to return SupabaseStorageAdapter
      this.instance = new LocalStorageAdapter();
    }
    return this.instance;
  }
}
