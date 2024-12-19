export class Sandbox {
  name: string;
  configOptions: Record<string, any>;

  constructor(name: string) {
    this.name = name;
    this.configOptions = {};
  }

  config(options: Record<string, any>): Sandbox {
    const validFields = ['cpu', 'memory', 'apt', 'pip', 'gpu', 'language', 'npm'];
    const defaultValues = { cpu: 0.125, memory: 128, language: 'python' };
    
    if (!options || typeof options !== 'object') {
      throw new Error('Invalid configuration options provided.');
    }

    // Parse GPU config if present
    if (options.gpu) {
      this._validateGpuConfig(options.gpu);
    }

    for (const key of Object.keys(options)) {
      if (!validFields.includes(key)) {
        throw new Error(`Invalid configuration field: ${key}`);
      }
    }
    this.configOptions = { ...defaultValues, ...options };
    return this;
  }

  private _validateGpuConfig(gpuConfig: string | Record<string, any>) {
    const validGpuTypes = ['a100-40gb', 'a100-80gb', 'a100', 'a10g', 'h100', 't4', 'l4', 'any'];
    
    if (typeof gpuConfig === 'string') {
      const [type] = gpuConfig.toLowerCase().split(':');
      if (!validGpuTypes.includes(type)) {
        throw new Error(`Invalid GPU type: ${type}`);
      }
    } else if (typeof gpuConfig === 'object') {
      if (!validGpuTypes.includes(gpuConfig.type?.toLowerCase())) {
        throw new Error(`Invalid GPU type: ${gpuConfig.type}`);
      }
    }
  }

  async run(code: string) {
    const response = await fetch('https://shell.consoles.ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        configuration: this.configOptions,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute code: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    return {
      stream: reader,
      async kill() {
        // TODO: Implement kill functionality
        await fetch('https://shell.consoles.ai/kill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
    };
  }
}
