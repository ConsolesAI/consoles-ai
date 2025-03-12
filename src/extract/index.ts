import type {
  ExtractResponse,
  ExtractOptions,
  ExtractInput
} from './types';

/**
 * Custom error class for Extract API errors
 */
export class ExtractError extends Error {
  status: number;
  code?: string;
  details?: any;
  retryAfter?: number;

  constructor(message: string, status: number, code?: string, details?: any, retryAfter?: number) {
    super(message);
    this.name = 'ExtractError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }
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
      const errorMessage = errorJson.error?.message || 'API request failed';
      const errorCode = errorJson.error?.code;
      const retryAfter = errorJson.retryAfter;
      
      // Handle specific error types
      if (errorCode === 'STORAGE_ERROR' || errorMessage.includes('R2 bucket is not available')) {
        throw new ExtractError(
          'Storage configuration error: R2 bucket is not available. The request may still succeed with direct upload.',
          response.status,
          'STORAGE_ERROR',
          errorJson.error,
          retryAfter
        );
      } else if (errorCode === 'TIMEOUT' || response.status === 408) {
        throw new ExtractError(
          'Request timeout. Please use chunked upload for large files or try again later.',
          408,
          'TIMEOUT',
          errorJson.error,
          retryAfter || 5
        );
      } else {
        throw new ExtractError(
          errorMessage,
          response.status,
          errorCode,
          errorJson.error,
          retryAfter
        );
      }
    } catch (e) {
      if (e instanceof ExtractError) {
        throw e;
      }
      throw new ExtractError(
        `API request failed (${response.status}): ${errorText}`,
        response.status
      );
    }
  }

  const data = await response.json();
  return data as ExtractResponse;
}

export { makeRequest as extract };
export * from './types'; 