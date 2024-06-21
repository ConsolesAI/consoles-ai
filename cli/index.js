#!/usr/bin/env node

import { Command } from "commander";
import { setupCommand } from "./cmd/setup.js";
import { deployCommand } from "./cmd/deploy.js";
import { kvCommand } from "./cmd/kv.js";
import { initCommand } from "./cmd/init.js";
import { secretsCommand } from "./cmd/env.js";
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .command("setup")
  .description("Setup ConsolesAI 🛠️")
  .action(setupCommand);

program
  .command("run <script>")
  .description("Run a script in ConsolesAI cloud environment");

program
  .command("init")
  .description("Initialize a new ConsolesAI project")
  .action(initCommand);

program
  .command("deploy [entry_script]")
  .description("Deploy your project to ConsolesAI cloud")
  .action(deployCommand);

program
  .command('kv [action] [namespace] [key] [value]')
  .description('Key-Value store commands')
  .action((action, namespace, key, value) => {
    kvCommand(action, namespace, key, value);
  });

program
  .command('secrets [action] [space] [key] [value]')
  .description('Secret Spaces management commands')
  .action((action, namespace, key, value) => {
    secretsCommand(action, namespace, key, value);
  });

program
  .command('help')
  .description('Display help information for ConsolesAI commands')
  .action(() => {
    program.outputHelp();
  });

  program
  .version(packageJson.version, '-v, --version', 'Display the current version of ConsolesAI');


program.parse(process.argv);
