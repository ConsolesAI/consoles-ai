import type {
  ExtractResponse,
  ExtractOptions,
  ExtractInput
} from './types';

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

export { makeRequest as extract };
export * from './types'; 