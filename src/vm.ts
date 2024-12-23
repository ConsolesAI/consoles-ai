// Define the VM class
export class VM {
  name: string;
  configOptions: Record<string, any>;

  constructor(name: string) {
    this.name = name;
    this.configOptions = {};
  }

  config(options: Record<string, any>): VM {
    const validFields = ['cpu', 'memory', 'apt', 'pip', 'image', 'gpu', 'mounts'];
    const defaultValues = { cpu: 0.5, memory: 512 };
    
    if (!options || typeof options !== 'object') {
      throw new Error('Invalid configuration options provided.');
    }

    // Handle empty image
    if (options.image === '') delete options.image;
    
    // Enforce minimum CPU
    if (options.cpu && options.cpu < 0.5) options.cpu = 0.5;

    // Validate GPU config if present
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
        configuration: this.configOptions
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
        await fetch('https://shell.consoles.ai/kill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
    };
  }

  async initSSH(options: {
    username: string;
    password: string;
    timeout?: number;
  }) {
    const response = await fetch('https://shell.consoles.ai/ssh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...this.configOptions,
        ...options
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initialize SSH: ${response.statusText}`);
    }
    
    const { hostname, port } = await response.json();
    
    return {
      connectionString: `ssh -o StrictHostKeyChecking=no -p ${port} ${options.username}@${hostname}`,
      async kill() {
        const killResponse = await fetch('https://shell.consoles.ai/ssh/kill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!killResponse.ok) {
          throw new Error(`Failed to kill SSH session: ${killResponse.statusText}`);
        }
      }
    };
  }
}
