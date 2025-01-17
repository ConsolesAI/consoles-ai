// Simple interface for what we need from Consoles
interface ConsolesInstance {
  apiKey: string;
}

export class Browser {
  private readonly consoles: ConsolesInstance;
  private readonly profile: string;

  constructor(profile: string, consoles: ConsolesInstance) {
    this.profile = profile;
    this.consoles = consoles;
  }

  async launch(options: {
    headless?: boolean;
    proxy?: string;
    userAgent?: string;
  } = {}) {
    const response = await fetch('https://browser.consoles.ai/launch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.consoles.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile: this.profile,
        ...options
      })
    });

    const { sessionId } = await response.json();
    return new BrowserSession(sessionId, this.consoles.apiKey);
  }
}

class BrowserSession {
  private sessionId: string;
  private apiKey: string;

  constructor(sessionId: string, apiKey: string) {
    this.sessionId = sessionId;
    this.apiKey = apiKey;
  }

  async goto(url: string) {
    await fetch('https://browser.consoles.ai/goto', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        url
      })
    });
  }

  async screenshot(): Promise<ArrayBuffer> {
    const response = await fetch('https://browser.consoles.ai/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.sessionId
      })
    });
    return await response.arrayBuffer();
  }

  async close() {
    await fetch('https://browser.consoles.ai/close', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.sessionId
      })
    });
  }
}
