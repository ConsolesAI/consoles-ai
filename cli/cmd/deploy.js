import { log } from "../util/log.js";
import { deployProject } from "../util/deploy.js";
import chalk from "chalk";
import figlet from "figlet";

export const deployCommand = async (entryScript = "console.ts") => {
  console.log(
    chalk.hex("#800080")(
      figlet.textSync("consoles", {
        font: "Larry 3D",
        horizontalLayout: "fitted",
      })
    )
  );
  log.info(`🚀 Initiating deployment for: ${entryScript}`);

  try {
    const result = await deployProject(entryScript);

    log.info("View Console Deployment:");
    console.log(
      chalk.underline.cyan(
        `https://app.consoles.ai/${result.workspace}/${result.projectName}/d/${result.deploymentId}\n`
      )
    );

    const consoleUrl = `https://${result.projectName}.cosmo.consoles.ai`;

    log.info("Endpoints:");
    if (result.endpoints && result.endpoints.length > 0) {
      const longestMethodLength = result.endpoints.reduce(
        (max, endpoint) => Math.max(max, endpoint.method.length),
        0
      );

      result.endpoints.forEach((endpoint) => {
        const methodColor =
          {
            GET: chalk.blue,
            POST: chalk.magenta,
            PUT: chalk.blueBright,
            DELETE: chalk.greenBright,
            PATCH: chalk.yellowBright,
          }[endpoint.method.toUpperCase()] || chalk.gray;

        const method = endpoint.method.toUpperCase();
        const paddingNeeded = longestMethodLength - method.length + 4;
        const paddedMethod = methodColor(method) + " ".repeat(paddingNeeded);
        const fullUrl = `${consoleUrl}${endpoint.route}`;

        console.log(
          chalk.grey(`├─ ${paddedMethod} ${chalk.underline(fullUrl)}`)
        );
      });
    } else {
      console.log(chalk.grey("└─ No endpoints found."));
    }

    log.info("LLMS:");
    if (result.llm && result.llm.length > 0) {
      result.llm.forEach((llm) => {
        if (llm && llm.name) {
          console.log(chalk.grey(`├─ ${chalk.cyan(llm.name)}`));
        }
      });
    } else {
      console.log(chalk.grey("└─ No registered LLMs found."));
    }

    log.success("\nConsole successfully deployed! 🎉✨\n");
    process.exit(0);
  } catch (error) {
    log.error("\n ❌ DEPLOYMENT FAILED...\n" + error.message);
  }
};