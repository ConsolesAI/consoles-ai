import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hardcoded credentials and configuration
const CF_API_TOKEN = 'CDg-ehW-cKsD4n6xzPMLOM1pLSvgyaj58gC6NWLZ';
const CF_ACCOUNT_ID = '26fadb0e7fb3b317bc68bd136f7e9329';
const DISPATCH_NAMESPACE = 'testing';

// Helper to display registered tools
async function displayRegisteredTools(userFunctionsPath) {
  try {
    const module = await import(userFunctionsPath);
    const tools = Object.entries(module)
      .filter(([name, func]) => typeof func === 'function' && func.schema)
      .map(([name]) => name);
    
    if (tools.length > 0) {
      console.log(chalk.dim('└─') + chalk.cyan(' Registered tools: ') + 
        tools.map(name => chalk.yellow(name)).join(chalk.dim(', ')));
    } else {
      console.log(chalk.dim('└─') + chalk.yellow(' No tools registered'));
    }
  } catch (error) {
    console.log(chalk.dim('└─') + chalk.yellow(' Could not analyze tools'));
  }
}

// Helper to check if a file is an MCP-style file
async function isMCPStyleFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check for typical patterns in MCP-style files
    return content.includes('.schema = ') && 
           (content.includes('z.object(') || content.includes('from "zod"') || content.includes('from \'zod\''));
  } catch (error) {
    return false;
  }
}

export async function createMCPProject(dirName, description, displayName) {
  const spinner = ora(chalk.blue('Creating MCP project...')).start();
  
  try {
    // Create project directory
    const projectDir = path.join(process.cwd(), dirName);
    if (fs.existsSync(projectDir)) {
      throw new Error(`Directory ${dirName} already exists`);
    }
    
    fs.mkdirSync(projectDir);

    // Copy template files
    const templateDir = path.join(__dirname, '../templates/mcp');
    const files = ['index.ts', 'tsconfig.json', 'package.json'];
    
    for (const file of files) {
      let content = fs.readFileSync(path.join(templateDir, file), 'utf8');
      
      // Replace placeholders
      content = content.replace(/{{name}}/g, dirName);
      content = content.replace(/{{description}}/g, description);
      
      fs.writeFileSync(path.join(projectDir, file), content);
    }

    // Add display name to index.ts
    const indexPath = path.join(projectDir, 'index.ts');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    indexContent = `// Name: ${displayName}\n// Description: ${description}\n\n${indexContent}`;
    fs.writeFileSync(indexPath, indexContent);

    // Install dependencies
    spinner.text = chalk.blue('Installing dependencies...');
    execSync('npm install', { cwd: projectDir, stdio: 'ignore' });

    spinner.succeed(chalk.green('MCP project created successfully'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.dim('1.'), 'cd', chalk.yellow(dirName));
    console.log(chalk.dim('2.'), 'Edit', chalk.yellow('index.ts'), 'to implement your tools');
    console.log(chalk.dim('3.'), 'Run', chalk.yellow('consoles-ai mcp deploy'), 'to deploy');

    return true;
  } catch (error) {
    spinner.fail(chalk.red('Failed to create MCP project'));
    console.error(chalk.red(`\nError: ${error.message}`));
    return false;
  }
}

export async function deployMCP(file = 'index.ts') {
  let spinner = ora(chalk.blue('Building MCP server...')).start();
  
  try {
    // Resolve file path relative to current directory
    const resolvedFile = path.resolve(process.cwd(), file);

    // Validate input file
    if (!fs.existsSync(resolvedFile)) {
      throw new Error(`Entry file ${chalk.cyan(resolvedFile)} not found. Please provide a valid TypeScript or JavaScript file.`);
    }

    // Get the directory of the input file and create dist folder there
    const inputDir = path.dirname(resolvedFile);
    const outputDir = path.join(inputDir, 'dist');

    // Create or clean build directory
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Check for package.json and ensure dependencies are installed
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        spinner.info(chalk.yellow('Dependencies not installed, running npm install...'));
        try {
          execSync('npm install', { stdio: 'inherit' });
        } catch (error) {
          spinner.warn(chalk.yellow('⚠️  Failed to install dependencies. Some imports may not work.'));
        }
        spinner.text = chalk.blue('Building MCP worker...');
      }
    }
    
    const workerPath = path.join(outputDir, 'worker.mjs');
      
    // First bundle the user code
    const userFunctionsPath = path.join(outputDir, '_user-functions.mjs');
    await esbuild.build({
      entryPoints: [resolvedFile],
      bundle: true,
      outfile: userFunctionsPath,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      treeShaking: true,
      sourcemap: false,
      loader: { '.ts': 'ts', '.js': 'js', '.mjs': 'js' },
      nodePaths: [path.resolve(process.cwd(), 'node_modules')],
      logLevel: 'warning'
    });
      
    // Create framework file for MCP-style files
    const frameworkContent = `
import * as userFunctions from './_user-functions.mjs';

// Helper to convert Zod schema to JSON Schema
function zodToJsonSchema(schema) {
  if (!schema || !schema._def) return { type: 'object', properties: {} };
  
  const def = schema._def;
  
  // Handle object schemas
  if (def.typeName === 'ZodObject') {
    const properties = {};
    const required = [];
    
    Object.entries(def.shape()).forEach(([key, value]) => {
      properties[key] = {
        type: getJsonSchemaType(value),
        description: value._def.description || key
      };
      if (!value._def.isOptional) {
        required.push(key);
      }
    });
    
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      description: def.description || ''
    };
  }
  
  return { type: 'object', properties: {} };
}

// Helper to get JSON Schema type from Zod type
function getJsonSchemaType(zodSchema) {
  if (!zodSchema || !zodSchema._def) return 'string';
  
  const typeMap = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
    ZodArray: 'array',
    ZodObject: 'object',
    ZodEnum: 'string',
    ZodOptional: getJsonSchemaType(zodSchema._def.innerType)
  };
  
  return typeMap[zodSchema._def.typeName] || 'string';
}

// Response formatting helper
function formatResponse(result) {
  if (result && typeof result === 'object' && Array.isArray(result.content)) {
    return result;
  }
  
  if (typeof result === 'string') {
    return {
      content: [{ type: "text", text: result }]
    };
  } else if (result === null || result === undefined) {
    return {
      content: [{ type: "text", text: "Operation completed successfully" }]
    };
  } else {
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
}

// Framework code for handling requests
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Tool definition endpoint
    if (url.pathname === '/tool-definition' && request.method === 'GET') {
      const toolDefinition = {};
      
      // For each function in the module that has a schema
      for (const [name, func] of Object.entries(userFunctions)) {
        if (typeof func === 'function' && func.schema) {
          // Convert schema to proper JSON Schema
          const inputSchema = zodToJsonSchema(func.schema);
          
          // Add to tool definition
          toolDefinition[name] = {
            name,
            description: func.schema._def?.description || \`Tool: \${name}\`,
            inputSchema
          };
        }
      }
      
      return new Response(JSON.stringify(toolDefinition), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Execute tools
    if (url.pathname === '/execute' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        // Extract tool name and arguments
        // Support both 'name' and 'arguments', and 'args' format
        const { name, arguments: argsObj, args } = body;
        const toolArgs = argsObj || args || {};
        
        if (!name) {
          return new Response(JSON.stringify({
            error: 'Missing tool name'
          }), { 
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        
        // Get the function
        const func = userFunctions[name];
        if (!func) {
          return new Response(JSON.stringify({
            error: \`Tool '\${name}' not found\`
          }), { 
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        
        // Execute the function with validation if schema exists
        let result;
        if (func.schema) {
          // For functions with zod schemas
          try {
            // Extract and validate arguments based on schema
            const schema = func.schema;
            const validatedArgs = schema.parse(toolArgs);
            
            // For functions that expect individual arguments
            if (schema._def.typeName === 'ZodObject') {
              const shape = schema._def.shape();
              const keys = Object.keys(shape);
              
              // If single parameter, pass it directly
              if (keys.length === 1) {
                result = await func(validatedArgs[keys[0]]);
              } else {
                // Pass all validated parameters as separate arguments
                const args = keys.map(key => validatedArgs[key]);
                result = await func(...args);
              }
            } else {
              // For non-object schemas, pass the entire validated value
              result = await func(validatedArgs);
            }
          } catch (validationError) {
            return new Response(JSON.stringify({
              error: \`Validation error: \${validationError.message}\`
            }), { 
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }
        } else {
          // For functions without schemas
          result = await func(toolArgs);
        }
        
        // Format and return the result
        const formattedResult = formatResponse(result);
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: body.message?.id,
          result: formattedResult
        }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: body.message?.id,
          error: {
            code: -32000,
            message: error.message || 'An error occurred during execution'
          }
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    return new Response('Not found', { 
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};`;

    // Write framework file
    const tempFrameworkPath = path.join(outputDir, '_framework.mjs');
    fs.writeFileSync(tempFrameworkPath, frameworkContent);

    // Bundle everything into final worker
    await esbuild.build({
      entryPoints: [tempFrameworkPath],
      bundle: true,
      outfile: workerPath,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      treeShaking: true,
      sourcemap: false,
      loader: { '.ts': 'ts', '.js': 'js', '.mjs': 'js' },
      nodePaths: [path.resolve(process.cwd(), 'node_modules')],
      logLevel: 'warning'
    });
      
    spinner.succeed(chalk.green('Built MCP Server!'));

    // Analyze tools before deleting user functions
    // Create a copy of the user functions file for later analysis
    const toolAnalysisPath = path.join(outputDir, '_tools-analysis.mjs');
    fs.copyFileSync(userFunctionsPath, toolAnalysisPath);

    // Clean up build files
    fs.unlinkSync(tempFrameworkPath);
    fs.unlinkSync(userFunctionsPath);

    // Deploy Phase
    spinner = ora(chalk.blue('Deploying MCP server...')).start();
    
    // Try to get name and description from file comments
    let scriptName;
    let description;
    
    try {
      const fileContent = fs.readFileSync(resolvedFile, 'utf8');
      // Look for Name: and Description: comments
      const nameMatch = fileContent.match(/\/\/\s*Name:\s*([^\n\r]+)/);
      const descMatch = fileContent.match(/\/\/\s*Description:\s*([^\n\r]+)/);
      
      if (nameMatch) {
        scriptName = nameMatch[1].trim();
      }
      
      if (descMatch) {
        description = descMatch[1].trim();
      }
    } catch (error) {
      // Ignore error and fall back
    }
    
    // If no scriptName from explicit "name:" comment, use the directory name
    if (!scriptName) {
      // Get parent directory of the file
      const parentDir = path.basename(path.dirname(resolvedFile));
      
      // If the parent directory is 'src', go up one more level
      if (parentDir.toLowerCase() === 'src') {
        scriptName = path.basename(path.dirname(path.dirname(resolvedFile)));
      } else {
        scriptName = parentDir;
      }
    }
    
    // Clean up script name
    scriptName = scriptName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Read the worker file content
    const scriptContent = fs.readFileSync(workerPath, 'utf8');
    
    // Prepare the API request
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/dispatch/namespaces/${DISPATCH_NAMESPACE}/scripts/${scriptName}`;
    
    // First try to delete any existing script
    try {
      const deleteResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
        }
      });
      const deleteResult = await deleteResponse.json();
    } catch (error) {
      // Ignore errors
    }
    
    // Create a FormData instance for multipart upload
    const formData = new FormData();
    
    // Prepare metadata
    const metadata = {
      main_module: "worker.mjs",
      compatibility_date: "2025-03-03",
      usage_model: "standard",
      compatibility_flags: ["nodejs_compat"]
    };
    
    // Add the metadata part
    formData.append('metadata', JSON.stringify(metadata));
    
    // Add the worker script
    const scriptBuffer = Buffer.from(scriptContent);
    formData.append('worker.mjs', scriptBuffer, {
      filename: 'worker.mjs',
      contentType: 'application/javascript+module'
    });
    
    // Upload the new script
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.errors?.[0]?.message || 'Deployment failed');
    }
    
    spinner.succeed(chalk.green('Deployed MCP Server!'));
    
    // Show deployment details with cleaner format
    console.log();
    console.log(chalk.cyan('Name         ') + chalk.bold(scriptName));
    if (description) {
      console.log(chalk.cyan('Description  ') + description);
    }
    
    // Try to display registered tools using the saved copy
    await displayRegisteredTools(toolAnalysisPath);
    
    // Clean up analysis file
    try {
      fs.unlinkSync(toolAnalysisPath);
    } catch (error) {
      // Ignore errors
    }
    
    // Show URL last
    console.log(chalk.blue('\nURL         ') + `https://mcp.consoles.ai/${scriptName}/mcp`);
    
    // Clean up dist folder after successful deployment
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Gracefully exit after successful deployment
    process.exit(0);
    
    return { success: true, scriptName };
  } catch (error) {
    // Clean up dist folder even if deployment failed
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    spinner.fail(chalk.red('Failed'));
    console.error(chalk.red(`\nError: ${error.message}`));
    if (error.errors) {
      console.error(chalk.red('\nBuild errors:'));
      error.errors.forEach(err => {
        console.error(chalk.red(`  ├─ ${err.text || err.message}`));
        if (err.location) {
          const { file, line, column } = err.location;
          console.error(chalk.dim(`  └─ at ${file}:${line}:${column}`));
        }
      });
    }
    
    // Exit with error code after failure
    process.exit(1);
    
    return { success: false, error: error.message };
  }
} 