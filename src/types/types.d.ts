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


declare module 'hono' {
  interface Context {
    /**
     * The country associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/hello', (c) => {
     *   const country = c.country;
     *   if (country === 'US') {
     *     return c.text('Hello from the United States!');
     *   } else {
     *     return c.text('Hello from somewhere else!');
     *   }
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    country?: string;

    /**
     * The ASN (Autonomous System Number) associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const asn = c.asn;
     *   return c.text(`ASN: ${asn}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    asn?: string;

    /**
     * The organization associated with the ASN.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const organization = c.organization;
     *   return c.text(`Organization: ${organization}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    organization?: string;

    /**
     * The HTTP protocol used for the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const httpProtocol = c.httpProtocol;
     *   return c.text(`HTTP Protocol: ${httpProtocol}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    httpProtocol?: string;

    /**
     * The TLS cipher used for the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const tlsCipher = c.tlsCipher;
     *   return c.text(`TLS Cipher: ${tlsCipher}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    tlsCipher?: string;

    /**
     * The TLS version used for the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const tlsVersion = c.tlsVersion;
     *   return c.text(`TLS Version: ${tlsVersion}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    tlsVersion?: string;

    /**
     * The city associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const city = c.city;
     *   return c.text(`City: ${city}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    city?: string;

    /**
     * The continent associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const continent = c.continent;
     *   return c.text(`Continent: ${continent}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    continent?: string;

    /**
     * The latitude associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const latitude = c.latitude;
     *   return c.text(`Latitude: ${latitude}`);
     * });
     * ```
     * 
     * @type {number | undefined}
     */
    latitude?: number;

    /**
     * The longitude associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const longitude = c.longitude;
     *   return c.text(`Longitude: ${longitude}`);
     * });
     * ```
     * 
     * @type {number | undefined}
     */
    longitude?: number;

    /**
     * The postal code associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const postalCode = c.postalCode;
     *   return c.text(`Postal Code: ${postalCode}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    postalCode?: string;

    /**
     * The metro code associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const metroCode = c.metroCode;
     *   return c.text(`Metro Code: ${metroCode}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    metroCode?: string;

    /**
     * The timezone associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const timezone = c.timezone;
     *   return c.text(`Timezone: ${timezone}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    timezone?: string;

    /**
     * Alias for region as state.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const state = c.state;
     *   return c.text(`State: ${state}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    state?: string;

    /**
     * Alias for datacenter as colo.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const datacenter = c.datacenter;
     *   return c.text(`Datacenter: ${datacenter}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    datacenter?: string;

    /**
     * Alias for regionCode as stateCode.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const stateCode = c.stateCode;
     *   return c.text(`State Code: ${stateCode}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    stateCode?: string;

    /**
     * The IP address associated with the request.
     * 
     * @example
     * ```typescript
     * app.get('/info', (c) => {
     *   const ip = c.ip;
     *   return c.text(`IP Address: ${ip}`);
     * });
     * ```
     * 
     * @type {string | undefined}
     */
    ip?: string;
  }
}


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
    
    llm(name: string, defaultOptions?: LLMOptions<llmProviders>): LLM;
  
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

}