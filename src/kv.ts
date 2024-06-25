import { Context } from "hono";

export class KV {
  private getContext: () => Context;
  private prefix: string;
  private apiKey: string;

  constructor(getContext: () => Context, prefix: string, apiKey: string) {
    this.getContext = getContext;
    this.prefix = prefix;
    this.apiKey = apiKey;
  }

  private getPrefixedKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private getContextOrThrow(): Context {
    const context = this.getContext();
    if (!context) {
      throw new Error("No context available");
    }
    return context;
  }

  async create(space: string) {
    try {
      const response = await fetch(`https://api.consoles.ai/v1/kv/${space}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (response.ok && (await response.json()) === false) {
        await fetch(`https://api.consoles.ai/v1/kv/new/${space}`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });
      }
    } catch (error) {
      console.error("Error checking space existence:", error);
    }
  }

  async get(key: string) {
    const c = this.getContextOrThrow();
    return await c.env.kv.get(this.getPrefixedKey(key));
  }

  async list(options: { prefix: string }) {
    const c = this.getContextOrThrow();
    return await c.env.kv.list({ prefix: this.getPrefixedKey(options.prefix) });
  }

  async put(key: string, value: string) {
    const c = this.getContextOrThrow();
    return await c.env.kv.put(this.getPrefixedKey(key), value);
  }

  async add(key: string, value: string) {
    const c = this.getContextOrThrow();
    return await c.env.kv.put(this.getPrefixedKey(key), value);
  }
}