import { createMCPProject, deployMCP } from '../util/mcp.js';
import { log } from '../util/log.js';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

export const mcpCommand = async (action, entryFile) => {
  try {
    switch (action) {
      case 'init':
        // Prompt for project details
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'What is the name of your MCP project?',
            validate: input => {
              if (!input) return 'Name is required';
              if (!/^[a-z0-9-]+$/.test(input)) return 'Name can only contain lowercase letters, numbers, and hyphens';
              return true;
            }
          },
          {
            type: 'input',
            name: 'description',
            message: 'Provide a brief description:',
            default: 'A ConsolesAI MCP Project'
          }
        ]);
        
        await createMCPProject(answers.name, answers.description);
        break;

      case 'deploy':
        // Use provided entry file or default to index.ts
        const defaultFile = 'index.ts';
        const targetFile = entryFile || defaultFile;
        
        // Check if file exists
        if (!fs.existsSync(path.resolve(process.cwd(), targetFile))) {
          log.error(`Entry file "${targetFile}" not found.`);
          log.info(`Tip: Make sure you're in the project directory or specify a valid entry file.`);
          return;
        }
        
        log.info(`Deploying MCP project with entry file: ${targetFile}`);
        const result = await deployMCP(targetFile);
        if (!result.success) {
          log.error(`\n ❌ Deployment failed: ${result.error}`);
        }
        break;

      default:
        log.info(`
Available MCP actions:
- init                  : Initialize a new MCP project
- deploy [entry_script] : Deploy your MCP project to ConsolesAI cloud
                          (default entry script is index.ts)
        `);
    }
  } catch (error) {
    log.error("\n ❌ Operation failed...\n" + error.message);
  }
};
