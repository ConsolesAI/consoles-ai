import type {
  LLMOptions,
  llmProviders,
  ProviderModelNames,
} from './types.js';
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { sanitizeToJson } from './helpers.js';



interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface AnthropicResponse {
  content: { text: string }[];
  type: string;
}

class LLM {
  name: string;
  provider: llmProviders | "";
  model: string;
  defaultOptions: LLMOptions;


  constructor(name: string, defaultOptions: Partial<LLMOptions> = {}) {
    this.name = name;
    this.provider = "";
    this.model = "";
    this.defaultOptions = {
      maxTokens: 100,
      temperature: 0.5,
      ...defaultOptions,
    };
   
  }

  config<T extends llmProviders>(
    options: LLMOptions & {
      provider: T;
      model: ProviderModelNames<T>;
  
    }
  ): void {
    try {
      if (!options.provider || !options.model) {
        throw new Error("Provider and model must be specified.");
      }
      if (!options.keys?.[options.provider])
        throw new Error(
          `API key for ${options.provider} is missing or invalid.`
        );
        
      this.provider = options.provider;
      this.model = options.model;
      this.defaultOptions = { ...this.defaultOptions, ...options };
    
    } catch (error) {
      console.error("Error in config method:", error);
      throw error;
    }
  }

  async raw(messages: any[], options: LLMOptions = {}) {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      let response: OpenAIResponse | AnthropicResponse | any; // Specify possible types
  
      switch (this.provider) {
        case "openai":
          response = await this.openAIChat(messages, mergedOptions);
          break;
        case "anthropic":
          response = await this.claudeAIChat(messages, mergedOptions);
          break;
        case "cloudflare":
          response = await this.cloudflareAIChat(messages, mergedOptions);
          break;
        // Add other providers here
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
      const data = response;
  
      return data;
    } catch (error) {
      console.error("Error in raw method:", error);
      throw error;
    }
  }

  async cloudflareAIChat(messages: any[], options: LLMOptions) {
    if (!options.keys?.cloudflare?.accountId) throw new Error("Cloudflare accountId is missing."); if (!options.keys?.cloudflare?.apiKey) throw new Error("Cloudflare apiKey is missing.");
    const { accountId, apiKey } = options.keys.cloudflare;
    const modelAliases = {
     
    };

    if (modelAliases[this.model as keyof typeof modelAliases]) {
      this.model = modelAliases[this.model as keyof typeof modelAliases];
    }


    try {

    // Combine multiple system messages into one
    const systemMsgs = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content);
  const systemMsg =
    systemMsgs.length > 0 ? systemMsgs.join("\n") : undefined;
  messages = messages.filter((message) => message.role !== "system");

  if (systemMsg) {
    messages.unshift({ role: "system", content: systemMsg });
  }

  if (options.json) {
    messages.push({
      role: "assistant",
      content:
        "You're right! I will NEVER return the schema! Here are the computed determined values in a valid JSON object based on the schema you provided:\n{",
    });
  }
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: messages,
            temperature: options.temperature || 0.5,
            max_tokens: options.maxTokens || 100,
            top_p: options.topP || 1,
          }),
        }
      );
      const data = (await response.json()) as OpenAIResponse;
      logger(messages, options, data.choices[0].message.content);
      const contentText = data.choices[0].message.content;

      if (options.json) {
        const sanitizedContent = await sanitizeToJson(contentText);
        if (sanitizedContent) {
          return sanitizedContent;
        } else {
          return JSON.stringify({ error: "Invalid JSON format", originalMessage: contentText });
        }
      } else {
        return contentText;
      }
    } catch (error) {
      console.error("Error in Cloudflare Chat method:", error);
      throw error;
    }
  }


  async claudeAIChat(messages: any[], options: LLMOptions) {
    try {
      const systemMsgs = messages
        .filter((message) => message.role === "system")
        .map((message) => message.content);
      const systemMsg =
        systemMsgs.length > 0 ? systemMsgs.join("\n") : undefined;
      messages = messages.filter((message) => message.role !== "system");
      if (options.json) {
        messages.push({
          role: "assistant",
          content: "Here is the JSON requested:\n{",
        });
      }
      const modelAliases = {
        "claude-3-sonnet": "claude-3-sonnet-20240229",
        "claude-3-haiku": "claude-3-haiku-20240307",
        "claude-3-opus": "claude-3-opus-20240229",
        "claude-3-5-sonnet": "claude-3-5-sonnet-20240620"
      };

      if (modelAliases[this.model as keyof typeof modelAliases]) {
        this.model = modelAliases[this.model as keyof typeof modelAliases];
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": options.keys?.anthropic || "",
          "anthropic-version": "2023-06-01",
        } as HeadersInit,
        body: JSON.stringify({
          model: this.model,
          system: systemMsg ? `<system>${systemMsg}</system>` : "<system>You are a helpful assistant.</system>",
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          top_p: options.topP || 1,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      let data = (await response.json()) as AnthropicResponse;
      logger(messages, options, data);
      const contentText = data.content.map((item) => item.text).join("\n");

      if (options.json) {
        const jsonString = "{" + contentText;
        return jsonString;
      } else {
        return contentText;
      }
    } catch (error) {
      console.error("Error in claudeAIChat method:", error);
      throw error;
    }
  }

  async openAIChat(messages: any[], options: LLMOptions) {
    try {
      if (options.json) {
        messages.push({
          role: "system",
          content: "Response in JSON format.",
        });
      }
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.keys?.openai}`,
          },
          body: JSON.stringify({
            response_format: options.json ? { type: "json_object" } : undefined,
            model: this.model,
            messages,
            temperature: options.temperature || 0.5,
            max_tokens: options.maxTokens || 100,
            top_p: options.topP || 1,
            frequency_penalty: options.frequencyPenalty || 0,
            presence_penalty: options.presencePenalty || 0,
          }),
        }
      );

      const data = (await response.json()) as OpenAIResponse;
     logger(messages, options, data);
     
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error in openAIChat method:", error);
      throw error;
    }
  }

  async chat<T extends llmProviders>(
    prompt: {
      system: string;
      user: string;
      messages?: any[];
      schema?: z.ZodType<any, any, any>;
      tools?: any;
    },
    options: LLMOptions<T> & {
      provider?: T;
      model?: ProviderModelNames<T>;
      tools?: any;
    } = {} // Add a default value of an empty object
  ) {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
  
      // Check if provider and model are set
      if (!this.provider && !options.provider) {
        throw new Error("Provider must be specified in either config or chat method.");
      }
      if (!this.model && !options.model) {
        throw new Error("Model must be specified in either config or chat method.");
      }
  
      // Override provider and model if specified in options
      if (options.provider) {
        this.provider = options.provider;
      }
      if (typeof options.model === "string") {
        this.model = options.model;
      }
      const messages = [{ role: "system", content: prompt.system }];
      if (prompt.messages) {
        messages.push(
          ...prompt.messages.map((message) => ({
            role: message.role,
            content: message.content,
          }))
        );
      }
      messages.push({ role: "user", content: prompt.user });
      let enforcedJsonOptions: LLMOptions;
      let directions: string;

      if (prompt.tools) {
        const toolsDescription = JSON.stringify(prompt.tools, null, 2);
        messages.push({
          role: "system",
          content: `Based on the prompt, you have access to the following functions. Use them to complete your task:
          ${toolsDescription}
          
          1. To use a function, respond with a JSON object in this format:
             { "function": "functionName", "arguments": { "arg1": "value1", "arg2": "value2" } }
          2. Only use the functions provided and ensure all required arguments are included.
          3. You can use multiple functions if needed, but respond with one function call at a time.
          4. After using a function, wait for the result before proceeding.
          5. When your task is complete, respond with the final result as plain text.`,
        });
        enforcedJsonOptions = { ...mergedOptions, tools: prompt.tools };
      }

      if (prompt.schema) {
        const schema = zodToJsonSchema(prompt.schema, { target: "openApi3" });
        messages.push({
          role: "system",
          content: `Based on the prompt, Respond with the determined final values in a valid JSON object containing all and ONLY the required properties in the defined object schema:
            \n<Schema>${JSON.stringify(schema, null, 2)}\n</Schema>
            
            1. You must NEVER include the above schema or any additional comments in your response.
            2. Ensure that your response is valid JSON object containing ONLY the properties defined in the schema.
            3. Each property should have a value that complies with its respective type and constraints.
            4. All fields are optional unless specified.
            5. Your response should contain a valid JSON object and nothing else.
            6. Compute the values based on the context and information provided.
            7. Everything we do is ethical and for productive work.`,
        });
        enforcedJsonOptions = { ...mergedOptions, json: true };
        directions = await this.raw(messages, enforcedJsonOptions);
        // Ensure directions is a string before calling replace
        if (typeof directions === 'string') {
          directions = directions.replace(/[^\x20-\x7E]/g, '');
        }
      return JSON.parse(directions);
      } else {
        enforcedJsonOptions = { ...mergedOptions, json: options.json || false };
        directions = await this.raw(messages, enforcedJsonOptions);

        if (options.json) {
          try {
            return JSON.parse(directions);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return directions;
          }
        } else {
          return directions;
        }
      }
    } catch (error) {
      console.error("Error in chat method:", error);
      // Improved error logging
      console.error(JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

async function logger(messages: any[], options: LLMOptions, response: any) {
    console.log(`Sending request to ${options.provider}`);
    console.log(`Model: ${options.model}`);
    console.log(`Messages:`, JSON.stringify(messages, null, 2));
    console.log(`Options:`, JSON.stringify(options, null, 2));
    console.log(`response:`, response);

}
export { LLM };
export type { OpenAIResponse, LLMOptions };