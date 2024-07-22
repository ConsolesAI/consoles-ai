![image](https://github.com/user-attachments/assets/2c5cfbe0-cbcf-4929-a3eb-8da1471f873d)## Overview

Consoles is a simple and lightweight framework for developing backends and interacting with LLMs, giving them access to structured prompting, code execution, and other tools. It offers a seamless interface for interacting with various AI providers, including OpenAI, Anthropic, and Cloudflare, ensuring efficient resource management and cost calculation.

## Features

- **Multi provider & model support**: Seamlessly switch between various models from providers such as  OpenAI, Anthropic, Cloudflare and Google using the integrated framework.
- **Granular Configuration**: Customize each call with options like provider, model, temperature, max tokens, etc. This allows you to adapt each interaction to specific needs, giving you full control over your models' behavior and performance.
- **Structured JSON Responses**: Automatically handle and ensure responses are in valid JSON format when required. This feature ensures that responses are formatted as valid JSON objects, even when using models that do not have built-in JSON support. (*Note: Performance may degrade with lesser model types.*)
- **User-friendly Prompting**: Utilize intuitive and context-aware prompting directly within functions, making it easy to generate and handle prompts natively within the framework.
- **Schema-based Response Validation**: Define and enforce response types using Zod schemas, ensuring that all responses adhere to the expected content, structure, and data types.
- **Advanced Error Handling**: Implement robust error handling and logging mechanisms for enhanced debugging and reliability.

## Getting Started

To get started with ConsoleAI, follow these steps:

1. Install the `consoles-ai` package using npm:
   ```sh
   npm install consoles-ai
   ```

2. Import the `LLM` class from the `consoles-ai` package in your project:
   ```javascript
   import { LLM } from 'consoles-ai';
   import { z } from 'zod';
   ```

3. Configure the `LLM` instance in your code.
   ```javascript
   // Start a new LLM instance
   const llm = new LLM();

   llm.config({
     provider: 'openai',
     keys: {
       openai: 'your-openai-key',
     },
     model: 'gpt-4o',
     temperature: 0.5,
   });

   // Define a simple schema for a greeting
   const greetingSchema = z.object({
     greeting: z.string().describe('A simple greeting message')
   });


   // Function to generate a simple greeting response
   async function generateGreetingResponse(greeting) {
     const prompt = {
       system: `You are a friendly assistant generating a simple greeting response.`,
       user: `Generate a response for the greeting: "${greeting}".`,
       schema: greetingSchema
     };
     return await llm.chat(prompt, { model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 50 });
   }

   // Example usage of the new functions
   const userGreeting = 'Hi there!'

   generateGreetingResponse(userGreeting).then(response => {
     console.log('Response:', response);
   });
   ```

### Prerequisites
- Node.js 14+ (TypeScript required)

## Supported LLM Providers and Models

The `consolesai` package supports a variety of providers and models for Large Language Models (LLMs). Below is a list of the currently supported providers and their respective models:

### OpenAI
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`
- `gpt-4o-2024-05-13`
- `gpt-4-turbo-2024-04-09`
- `gpt-4-turbo-preview`
- `gpt-4-0125-preview`
- `gpt-4-1106-preview`
- `gpt-4-vision-preview`
- `gpt-4-1106-vision-preview`
- `gpt-4-0613`
- `gpt-4-32k`
- `gpt-4-32k-0613`
- `gpt-3.5-turbo-0125`
- `gpt-3.5-turbo-1106`
- `gpt-3.5-turbo-instruct`

### Anthropic
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### Cloudflare
- `@cf/meta/llama-2-7b-chat-fp16`
- `@cf/mistral/mistral-7b-instruct-v0.1`
- `@cf/thebloke/deepseek-coder-6.7b-base-awq`
- `@cf/thebloke/deepseek-coder-6.7b-instruct-awq`
- `@cf/deepseek-ai/deepseek-math-7b-base`
- `@cf/deepseek-ai/deepseek-math-7b-instruct`
- `@cf/thebloke/discolm-german-7b-v1-awq`
- `@cf/tiiuae/falcon-7b-instruct`
- `@cf/google/gemma-2b-it-lora`
- `@cf/google/gemma-7b-it`
- `@cf/google/gemma-7b-it-lora`
- `@hf/nousresearch/hermes-2-pro-mistral-7b`
- `@hf/thebloke/llama-2-13b-chat-awq`
- `@cf/meta-llama/llama-2-7b-chat-hf-lora`
- `@cf/meta/llama-3-8b-instruct`
- `@cf/meta/llama-3-8b-instruct-awq`
- `@hf/thebloke/llamaguard-7b-awq`
- `@hf/thebloke/mistral-7b-instruct-v0.1-awq`
- `@hf/mistral/mistral-7b-instruct-v0.2`
- `@cf/mistral/mistral-7b-instruct-v0.2-lora`
- `@hf/thebloke/neural-chat-7b-v3-1-awq`
- `@cf/openchat/openchat-3.5-0106`
- `@openhermes-2.5-mistral-7b-awq`
- `@cf/microsoft/phi-2`
- `@cf/qwen/qwen1.5-0.5b-chat`
- `@cf/qwen/qwen1.5-1.8b-chat`
- `@cf/qwen/qwen1.5-14b-chat-awq`
- `@cf/qwen/qwen1.5-7b-chat-awq`
- `@cf/defog/sqlcoder-7b-2`
- `@hf/nexusflow/starling-lm-7b-beta`
- `@cf/tinyllama/tinyllama-1.1b-chat-v1.0`
- `@cf/fblgit/una-cybertron-7b-v2-bf16`
- `@hf/thebloke/zephyr-7b-beta-awq`

### Google
- (Currently no models listed)

### Cohere
- (Currently no models listed)

This list is subject to change as new models and providers are added to the `consolesai` package. Always refer to the latest documentation for the most up-to-date information.

### CLI For Consoles Cloud

![alt text](https://i.imgur.com/582jvCe.png)

