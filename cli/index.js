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
  .action(async () => {
    await setupCommand();
  });

program
  .command("run <script>")
  .description("Run a script in ConsolesAI cloud environment")
  // .action(runCommand);

program
  .command("init")
  .description("Initialize a new ConsolesAI project")
  .action(async () => {
    await initCommand();
  });

program
  .command("deploy [entry_script]")
  .description("Deploy your project to ConsolesAI cloud")
  .action(async (entry_script) => {
    await deployCommand(entry_script);
  });

program
  .command('kv [action] [namespace] [key] [value]')
  .description('Key-Value store commands')
  .action(async (action, namespace, key, value) => {
    await kvCommand(action, namespace, key, value);
  });

program.parse(process.argv);