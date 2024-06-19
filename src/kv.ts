export class KV {
  private storage: Record<string, string>;

  constructor() {
    this.storage = {};
  }

  async new(space: string, apiKey?: string) {
    if (!apiKey) {
      return 'API key is missing. Please provide a ConsolesAI API key.';
    }
    const response = await fetch('https://api.consoles.ai/kv/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ space })
    });

    if (!response.ok) {
      throw new Error(`Failed to create new KV Space: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }



  async get(key: string, space: string): Promise<string | null> {
    return this.storage[key] || null;
  }

  async put(key: string, value: string): Promise<void> {
    this.storage[key] = value;
  }

  async delete(key: string): Promise<void> {
    delete this.storage[key];
  }
}
