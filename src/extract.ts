import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ExtractUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: string;
  output_cost: string;
  total_cost: string;
}

export interface ExtractResponse {
  status: 'success';
  result: any;
  usage: ExtractUsage;
}

export interface BaseExtractOptions {
  prompt?: string;
  schema?: z.ZodType<any> | Record<string, any>;
}

export interface UrlExtractOptions extends BaseExtractOptions {
  type: 'url';
  content: string; // URL
}

export interface FileExtractOptions extends BaseExtractOptions {
  type: 'file';
  content: {
    data: string; // base64
    mimeType: string;
  };
}

export interface TextExtractOptions extends BaseExtractOptions {
  type: 'text';
  content: string;
}

export type ExtractOptions = UrlExtractOptions | FileExtractOptions | TextExtractOptions;

export class Extract {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private prepareOptions(options: ExtractOptions): ExtractOptions {
    const prepared = { ...options };
    
    if (prepared.schema instanceof z.ZodType) {
      prepared.schema = zodToJsonSchema(prepared.schema, { target: 'openApi3' });
    }

    return prepared;
  }

  async extract(options: ExtractOptions): Promise<ExtractResponse> {
    const preparedOptions = this.prepareOptions(options);
    
    const response = await fetch("https://api.consoles.ai/v1/extract", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preparedOptions)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to extract content: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ExtractResponse;
  }
}