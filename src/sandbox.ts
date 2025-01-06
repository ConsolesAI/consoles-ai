// Simple interface for what we need from Consoles
interface ConsolesInstance {
  apiKey?: string;
}

export class Sandbox {
  // private readonly apiKey: string;

  constructor({ apiKey }: ConsolesInstance) {
    if (!apiKey) throw new Error('API key required for Sandbox service');
    // this.apiKey = apiKey;
  }
}
