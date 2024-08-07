export const ProviderModels = {
  openai: [
    'gpt-4o-2024-08-06',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'gpt-4o-2024-05-13',
    'gpt-4-turbo-2024-04-09',
    'gpt-4-turbo-preview',
    'gpt-4-0125-preview',
    'gpt-4-1106-preview',
    'gpt-4-vision-preview',
    'gpt-4-1106-vision-preview',
    'gpt-4-0613',
    'gpt-4-32k',
    'gpt-4-32k-0613',
    'gpt-3.5-turbo-0125',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-instruct'
  ],
  anthropic: [
    'claude-3-opus-20240229', 
    'claude-3-sonnet-20240229', 
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20240620'
  ],
  cohere: [],
  google: [],
  cloudflare: [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-2-7b-chat-fp16',
    '@cf/mistral/mistral-7b-instruct-v0.1',
    '@cf/thebloke/deepseek-coder-6.7b-base-awq',
    '@cf/thebloke/deepseek-coder-6.7b-instruct-awq',
    '@cf/deepseek-ai/deepseek-math-7b-base',
    '@cf/deepseek-ai/deepseek-math-7b-instruct',
    '@cf/thebloke/discolm-german-7b-v1-awq',
    '@cf/tiiuae/falcon-7b-instruct',
    '@cf/google/gemma-2b-it-lora',
    '@cf/google/gemma-7b-it',
    '@cf/google/gemma-7b-it-lora',
    '@hf/nousresearch/hermes-2-pro-mistral-7b',
    '@hf/thebloke/llama-2-13b-chat-awq',
    '@cf/meta-llama/llama-2-7b-chat-hf-lora',
    '@hf/meta-llama/meta-llama-3-8b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@cf/meta/llama-3-8b-instruct-awq',
    '@hf/thebloke/llamaguard-7b-awq',
    '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
    '@hf/mistral/mistral-7b-instruct-v0.2',
    '@cf/mistral/mistral-7b-instruct-v0.2-lora',
    '@hf/thebloke/neural-chat-7b-v3-1-awq',
    '@cf/openchat/openchat-3.5-0106',
    '@hf/thebloke/openhermes-2.5-mistral-7b-awq',
    '@cf/microsoft/phi-2',
    '@cf/qwen/qwen1.5-0.5b-chat',
    '@cf/qwen/qwen1.5-1.8b-chat',
    '@cf/qwen/qwen1.5-14b-chat-awq',
    '@cf/qwen/qwen1.5-7b-chat-awq',
    '@cf/defog/sqlcoder-7b-2',
    '@hf/nexusflow/starling-lm-7b-beta',
    '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
    '@cf/fblgit/una-cybertron-7b-v2-bf16',
    '@hf/thebloke/zephyr-7b-beta-awq'
  ]
} as const;