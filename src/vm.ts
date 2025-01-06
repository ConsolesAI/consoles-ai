// Simple interface for what we need from Consoles
interface ConsolesInstance {
  apiKey?: string;
}

export class VM {
  // private readonly apiKey: string;

  constructor({ apiKey }: ConsolesInstance) {
    if (!apiKey) throw new Error('API key required for VM service');
    // this.apiKey = apiKey;
  }
}
