import { z } from 'zod';

// Simple interface for what we need from Consoles
interface ConsolesInstance {
  apiKey: string;
}

export interface ExtractUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: string;
  output_cost: string;
  total_cost: string;
}

export interface ExtractResponse {
  id: string;
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

type ExtractInput = Exclude<ExtractOptions, { type: 'generate_schema' }> | string;

export interface ExtractInstance {
  (options: ExtractInput): Promise<ExtractResponse>;
  extract(options: ExtractInput): Promise<ExtractResponse>;
}

async function makeRequest(apiKey: string, options: ExtractInput): Promise<ExtractResponse> {
  let normalizedOptions: Exclude<ExtractOptions, { type: 'generate_schema' }>;

  // Handle string shorthand
  if (typeof options === 'string') {
    normalizedOptions = {
      type: 'text',
      content: options
    };
  } else {
    normalizedOptions = options;
  }

  const response = await fetch('https://api.consoles.ai/v1/extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(normalizedOptions)
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error?.message || 'API request failed');
    } catch (e) {
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }
  }

  const data = await response.json();
  return data as ExtractResponse;
}

export function Extract(consoles: ConsolesInstance): ExtractInstance {
  const extractFn = (options: ExtractInput) => makeRequest(consoles.apiKey, options);
  extractFn.extract = extractFn;
  return extractFn;
}