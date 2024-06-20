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

  get(key: string) {
    const c = this.getContext();
    return c.env.kv.get(this.getPrefixedKey(key));
  }

  list(options: { prefix: string }) {
    const c = this.getContext();
    return c.env.kv.list({ prefix: this.getPrefixedKey(options.prefix) });
  }

  put(key: string, value: string) {
    const c = this.getContext();
    return c.env.AI.put(this.getPrefixedKey(key), value);
  }

  add(key: string, value: string) {
    const c = this.getContext();
    return c.env.kv.put(this.getPrefixedKey(key), value);
  }
}