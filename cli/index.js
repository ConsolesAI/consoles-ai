#!/usr/bin/env node

import { Command } from "commander";
import { setupCommand } from "./cmd/setup.js";
import { deployCommand } from "./cmd/deploy.js";
import { kvCommand } from "./cmd/kv.js";
import { initCommand } from "./cmd/init.js";


const program = new Command();

program
  .command("setup")
  .description("Setup ConsolesAI 🛠️")
  .action(setupCommand);

program
  .command("run <script>")
  .description("Run a script in ConsolesAI cloud environment")
  // .action(runCommand);

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

program.parse(process.argv);