import { Command } from "commander";
import { setupCommand } from "./cmd/setup.js";
// import { runCommand } from "./cmd/run.js";
import { deployCommand } from "./cmd/deploy.js";

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
  .command("deploy [entry_script]")
  .description("Deploy your project to ConsolesAI cloud")
  .action(deployCommand);

program.parse(process.argv);