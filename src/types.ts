import { ProviderModels } from './types/ProviderModels';

export interface Prompt {
  system: string;
  messages: any[];
  user: {
    question: string;
  };
}

export type llmProviders = keyof typeof ProviderModels;
export type ProviderModelNames<T extends llmProviders> = (typeof ProviderModels)[T][number];

export interface LLMOptions<T extends llmProviders = llmProviders> {
  keys?: {
    openai?: string;
    anthropic?: string;
    cohere?: string;
    google?: string;
    cloudflare?: string;
  };
  provider?: T;
  model?: ProviderModelNames<T>;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  json?: boolean;
  stream?: boolean;
  tool_choice?: string;
  tools?: any[];
}


