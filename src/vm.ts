// Define the VM class
export class VM {
  name: string;
  configOptions: Record<string, any>;

  constructor(name: string) {
    this.name = name;
    this.configOptions = {};
  }

  config(options: Record<string, any>) {
    const validFields = ['cpu', 'ram', 'apt', 'pip', 'image', 'gpu'];
    const defaultValues = { cpu: 0.5, ram: 128, sandbox: false };
    if (!options || typeof options !== 'object') {
      throw new Error('Invalid configuration options provided.');
    }
    if (options.image === '') delete options.image;
    if (options.cpu && options.cpu < 0.5) options.cpu = 0.5;

    for (const key of Object.keys(options)) {
      if (!validFields.includes(key)) {
        throw new Error(`Invalid configuration field: ${key}`);
      }
    }
    this.configOptions = { ...defaultValues, ...options };
  }

  async run(code: string) {
    fetch('https://shell.consoles.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, config: this.configOptions }),
    });
    return `Running code in VM ${this.name}: ${code}`;
  }

}
