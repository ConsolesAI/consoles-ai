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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async call(options: Exclude<ExtractOptions, { type: 'generate_schema' }> | string): Promise<ExtractResponse | ReadableStream> {
    if (typeof options === 'string') {
      return this.call({
        type: 'text',
        content: options
      });
    }
    // ... rest of extract implementation
  }
}