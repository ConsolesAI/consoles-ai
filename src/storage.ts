import { Context } from "hono";

export class FS {
  private getContext: () => Context;
  private bucketName: string;
  private apiKey: string;

  constructor(getContext: () => Context, bucketName: string, apiKey: string) {
    this.getContext = getContext;
    this.bucketName = bucketName;
    this.apiKey = apiKey;
  }

  private getContextOrThrow(): Context {
    const context = this.getContext();
    if (!context) {
      throw new Error("No context available");
    }
    return context;
  }

  private getFullPath(key: string): string {
    return key.startsWith('/') ? key.slice(1) : key;
  }

  async createBucket() {
    try {
      const response = await fetch(`https://api.consoles.ai/v1/fs/${this.bucketName}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (response.ok && (await response.json()) === false) {
        await fetch(`https://api.consoles.ai/v1/fs/new/${this.bucketName}`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });
      }
    } catch (error) {
      console.error("Error creating bucket:", error);
    }
  }

  async get(key: string) {
    const c = this.getContextOrThrow();
    return await c.env.r2.get(this.getFullPath(key));
  }

  async list(options: { prefix: string }) {
    const c = this.getContextOrThrow();
    return await c.env.r2.list({
      ...options,
      prefix: this.getFullPath(options.prefix),
    });
  }

  async put(key: string, value: ReadableStream | ArrayBuffer | string) {
    const c = this.getContextOrThrow();
    return await c.env.r2.put(this.getFullPath(key), value);
  }

  async delete(key: string) {
    const c = this.getContextOrThrow();
    return await c.env.r2.delete(this.getFullPath(key));
  }

  async createDirectory(directoryPath: string) {
    // R2 doesn't create directories, but we can emulate it by using directory prefixes
    await this.put(`${this.getFullPath(directoryPath).replace(/\/$/, '')}/`, '');
  }
}
