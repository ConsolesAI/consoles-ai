import { log } from "../util/log.js";
import { deployProject } from "../util/deploy.js";
import chalk from "chalk";
import figlet from "figlet";

export const deployCommand = async (entryScript = "console.ts") => {
  const text = figlet.textSync("consoles", {
    font: "Larry 3D",
    horizontalLayout: "fitted",
  });

  const lines = text.split('\n');
  const gradientColors = ['#8A2BE2', '#9370DB', '#9932CC', '#8B008B', '#800080', '#4B0082', '#6A5ACD', '#483D8B', '#7B68EE', '#9400D3', '#8B008B', '#9932CC'];

  const coloredLines = lines.map((line, index) => {
    const color = gradientColors[Math.floor(index / lines.length * gradientColors.length)];
    return chalk.hex(color)(line);
  });

  if (process.stdout.isTTY && process.stdout.getColorDepth() > 4) {
    console.log(coloredLines.join('\n'));
  } else {
    console.log(text);
  }

  log.info(`🚀 Initiating deployment for: ${entryScript}`);

  try {
    const result = await deployProject(entryScript);

    log.info("\nDeployment Details:");
    console.log(
      chalk.underline.cyan(
        `https://app.consoles.ai/${result.workSpace}/${result.projectName}/d/${result.deploymentId}\n`
      )
    );

    const consoleUrl = `https://${result.projectName}-${result.workSpace}.cnsl.dev`;

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


    log.success("\nConsole successfully deployed! 🎉✨\n");
    process.exit(0);
  } catch (error) {
    log.error("\n ❌ DEPLOYMENT FAILED...\n" + error.message);
  }
};