import { Hono, Context, Env } from 'hono';
import { ProviderModels } from './ProviderModels';

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

declare module 'consoles-ai' {
  interface Console {
    /**
     * Initializes a new instance of a Large Language Model (LLM) with a unique name.
     * This method creates a named LLM instance which can be configured later using the `llm.config` method.
     * The model and provider details are not specified at initialization but are required to be set in the `llm.config` before use.
     * 
     * Example usage:
     * ```typescript
     * // Initialize a new LLM instance named 'llm1'
     * const llm = app.llm('llm1');
     * // Configuration of the LLM instance must be done separately
     * llm.config({
     *   model: '@openai/gpt-4-turbo',
     *   temperature: 1,
     * });
     * ```
     * 
     * @param name The unique identifier for the LLM instance. This name is used to reference the instance within your application.
     * @returns Returns a new `LLM` object, which represents the initialized language model. This object provides methods to configure and interact with the model.
     */
    llm(name: string, defaultOptions?: LLMOptions): LLM;
  }

  class LLM {
    name: string;
    provider?: llmProviders;
    model?: ProviderModelNames<llmProviders>;
    defaultOptions: LLMOptions;

    constructor(name: string, defaultOptions?: LLMOptions);

    /**
     * Configures the settings for the LLM instance.
     * This method allows setting various options such as the model type, token limits, and behavior adjustments.
     * 
     * @param options An object containing configuration options for the LLM instance.
     * Options include:
     * - model: Specifies the model to use (e.g., '@openai/gpt-4-turbo').
     * - maxTokens: Sets the maximum number of tokens to generate.
     * - temperature: Controls the randomness of the output.
     * - topP: Configures nucleus sampling.
     * - frequencyPenalty: Adjusts penalty for frequently used tokens.
     * - presencePenalty: Adjusts penalty for introducing new tokens.
     * - json: Determines if the output should be in JSON format.
     * - stream: Enables streaming of the output.
     */
    config<T extends llmProviders>(options: LLMOptions & { provider: T, model: ProviderModelNames<T> }): void;

    /**
     * Sends a raw prompt to the LLM and returns the response.
     * 
     * @param prompt The prompt to send to the LLM.
     * @param options Optional configuration options for the request.
     * @returns A promise that resolves with the response from the LLM.
     */
    raw(prompt: any, options?: LLMOptions): Promise<any>;

  /**
   * Sends a chat prompt to the LLM and returns the response.
   * 
   * @param prompt The chat prompt to send to the LLM.
   * @param options Optional configuration options for the request.
   * @returns A promise that resolves with the response from the LLM.
   */
    chat(prompt: any, options?: LLMOptions): Promise<any>;
  }

  export { ConsoleContext as Context, Env };
}