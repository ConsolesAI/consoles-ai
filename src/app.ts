import { VM } from "./vm";
import { Browser } from "./browser";
import { Sandbox } from "./sandbox";
import { Extract, ExtractOptions, ExtractResponse } from "./extract";

export class Console {
  private apiKey: string;
  private extractInstance: Extract;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.extractInstance = new Extract(apiKey);
  }

  async extract(options: ExtractOptions | string): Promise<ExtractResponse> {
    if (typeof options === 'string') {
      return this.extractInstance.extract({
        type: 'text',
        content: options
      });
    }
    return this.extractInstance.extract(options);
  }

  browser(profile: string): Browser {
    return new Browser(profile, this.apiKey);
  }

  VM(): VM {
    return new VM(this.apiKey);
  }

  sandbox(): Sandbox {
    return new Sandbox(this.apiKey);
  }
}
