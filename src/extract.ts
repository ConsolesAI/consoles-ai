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
  schemaDescription?: string;
  stream?: boolean;
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
  } | Blob;
}

export interface TextExtractOptions extends BaseExtractOptions {
  type: 'text';
  content: string;
}

export interface GenerateSchemaOptions {
  type: 'generate_schema';
  description: string;
}

export type ExtractOptions = UrlExtractOptions | FileExtractOptions | TextExtractOptions | GenerateSchemaOptions;

export class Extract {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.consoles.ai/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private prepareOptions(options: ExtractOptions): ExtractOptions {
    const prepared = { ...options };
    
    if ('schema' in prepared && prepared.schema instanceof z.ZodType) {
      prepared.schema = zodToJsonSchema(prepared.schema, { target: 'openApi3' });
    }

    return prepared;
  }

  async generateSchema(description: string): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/extract`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: 'generate_schema',
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to generate schema: ${response.statusText}`);
    }

    const data = await response.json();
    return data.schema;
  }

  async extract(options: Exclude<ExtractOptions, GenerateSchemaOptions>): Promise<ExtractResponse | ReadableStream> {
    const preparedOptions = this.prepareOptions(options);
    
    const response = await fetch(`${this.baseUrl}/extract`, {
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

    // If streaming is enabled, return the stream
    if (options.stream) {
      return response.body as ReadableStream;
    }

    const data = await response.json();
    return data as ExtractResponse;
  }
}