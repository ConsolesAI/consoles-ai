import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import figlet from "figlet";
import open from "open";
import crypto from "crypto";
import os from "os";
import readline from "readline";
import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

const log = {
  info: (message) => console.log(chalk.green(message)),
  warn: (message) => console.log(chalk.yellow(message)),
  error: (message) => console.error(chalk.red(message)),
  success: (message) => console.log(chalk.green.bold(message)),
};

const displayFiglet = (text, color = "#4B0082") => {
  console.log(
    chalk.hex(color)(figlet.textSync(text, { horizontalLayout: "full" }))
  );
};

const readEnvFile = (envPath) => {
  const envContent = fs.readFileSync(envPath, "utf-8");
  return Object.fromEntries(
    envContent
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("="))
  );
};

const generateToken = () => crypto.randomBytes(16).toString("hex");

const waitForKeyPress = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => {
      rl.close();
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
};

const saveEnvFile = (envPath, token, apiKey) => {
  fs.writeFileSync(envPath, `TOKEN=${token}\nAPI_KEY=${apiKey}\n`);
  log.success("API key and token saved to 📁 " + chalk.cyan(envPath));
};

const setupCommand = async () => {
  displayFiglet("Consoles.ai");
  log.info("Setting up ConsolesAI...");

  const homeDir = os.homedir();
  const envPath = path.join(homeDir, ".consoles.env");

  let token, apiKey;

  if (fs.existsSync(envPath)) {
    log.warn(".consoles.env file found at 📁 " + chalk.cyan(envPath));
    const envVars = readEnvFile(envPath);

    if (envVars.TOKEN) {
      token = envVars.TOKEN;
      log.info("Using existing token: 🔑 " + chalk.cyan(token));
      apiKey = await retrieveApiKey(token);
    } else if (envVars.API_KEY) {
      apiKey = envVars.API_KEY;
      log.info("Using existing API key: 🔑 " + chalk.cyan(apiKey));
    }
  } else {
    log.warn(".consoles.env file not found. Creating a new one.");
  }

  if (!apiKey) {
    if (!token) {
      token = generateToken();
      log.info("Generated unique token: 🔑 " + chalk.cyan(token));
      log.info("Press any key to login");

      await waitForKeyPress();
      await open(`https://consoles.ai/login?token=${token}`);
      log.info("Please complete the process in your browser. 🌍");
      apiKey = await retrieveApiKey(token);

      saveEnvFile(envPath, token, apiKey);
      log.success("ConsolesAI setup completed. ✅");
      log.info(
        "Use 'consoles init' to start your first project or use 'consoles run <script.name>'"
      );
    }
  } else {
    log.success("ConsolesAI setup completed. ✅");
    log.info(
      "Use 'consoles init' to start your first project or use 'consoles run <script.name>'"
    );
  }
};;

const runCommand = async (script) => {
  log.info(`Running script: ${script}... 🚀`);

  try {
    const output = await runScriptInCloud(script);
    log.info("Script output:");
    console.log(output);
  } catch (error) {
    log.error("Error running script: " + error.message);
  }
};

const deployCommand = async (entryScript = "console.ts") => {
  console.log(
    chalk.hex('#800080')(figlet.textSync("consoles.ai", { font: "Larry 3D", horizontalLayout: "fitted" }))
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
          chalk.grey(
            `├─ ${paddedMethod} ${chalk.underline(fullUrl)}`
          )
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

  } catch (error) {
    log.error("\n ❌ DEPLOYMENT FAILED...\n" + error.message);
  }
};

program
  .command("setup")
  .description("Setup ConsolesAI 🛠️")
  .action(setupCommand);
program
  .command("run <script>")
  .description("Run a script in ConsolesAI cloud environment")
  .action(runCommand);
program
  .command("deploy [entry_script]")
  .description("Deploy your project to ConsolesAI cloud")
  .action(deployCommand);

  
 const extractMatches = (regex, content, type) => {
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (type === "endpoint") {
        matches.push({ method: match[1], route: match[2] });
      } else if (type === "llm") {
        matches.push({ name: match[1] });
      }
    }
    return matches;
  };
  
  const deployProject = async (entryScript) => {
    log.info("├── 🔨 Building your project...");
  
    if (!fs.existsSync(entryScript)) {
      throw new Error(
        chalk.yellow.italic(
          `   The entry script '${chalk.cyan(entryScript)}' does not exist!\n`
        )
      );
    }
  
    const fileContent = fs.readFileSync(entryScript, "utf8");
    const projectNameMatch = fileContent.match(/new Console\('([^']+)'\)/);
  
    if (!projectNameMatch) {
      throw new Error(
        chalk.italic.yellow(
          `   No 'Console' instance found in the entry script '${chalk.cyan(
            entryScript
          )}'! Please define a Console instance as shown in the example below:\n`
        ) +
          chalk.italic.gray(
            `\n╭───Entry file: console.ts ──────────────────────╮\n`
          ) +
          chalk.italic.gray(
            "│                                                │\n"
          ) +
          chalk.italic.gray(
            `│ ${chalk.blue("const")} ${chalk.green("app")} ${chalk.blue(
              "="
            )} ${chalk.blue("new")} ${chalk.cyan("Console")}(${chalk.yellow(
              "'your-project-name'"
            )});  │\n`
          ) +
          chalk.italic.gray(
            "│                                                │\n"
          ) +
          chalk.italic.gray(
            "╰────────────────────────────────────────────────╯\n"
          )
      );
    }
    const projectName = projectNameMatch[1];
    const bundleDir = path.join(path.dirname(entryScript), "built");
    const bundlePath = path.join(bundleDir, `${projectName}_bundle.mjs`);
  
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir);
    }
  
    try {
      const scriptDir = path.dirname(entryScript);
      await esbuild.build({
        entryPoints: [entryScript],
        bundle: true,
        outfile: bundlePath,
        platform: "node",
        external: [],
        minify: false,
        sourcemap: false,
        format: "esm",
        target: ["node14"],
        loader: { ".ts": "ts" },
        tsconfig: path.join(path.dirname(scriptDir), "tsconfig.json"),
      });
      log.info("├── 📦 Building completed.");
      const bundleContent = fs.readFileSync(bundlePath, "utf8");
  
      const endpoints = extractMatches(/app\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g, bundleContent, "endpoint");

  
      const llms = extractMatches(/app\.llm\s*\(\s*['"`](.*?)['"`]\s*\)/g, bundleContent, "llm");
     
  
      log.info("├── ✨ Deploying to cloud...");
      const response = {
        data: {
          id: crypto.randomBytes(3).toString("hex"),
          deploymentId: crypto.randomBytes(3).toString("hex"),
          projectName: projectName,
          workspace: "cosmo",
          endpoints: endpoints,
          llm: llms,
        },
      };
      log.info("├── 🌍 Deployment completed.");
  
      return response.data;
    } catch (error) {
      log.error("❌ Error during deployment: " + error.message);
      throw error;
    }
  };

async function runScriptInCloud(script) {
  log.info("Running Script on ConsolesAI cloud... 🌥️");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const output = `Output of ${script} from ConsolesAI cloud.`;
  return output;
}

async function retrieveApiKey(token) {
  const apiKey = await pollForApiKey(token);
  log.success("API key received. 🎉");
  return apiKey;
}

async function pollForApiKey(token) {
  const pollInterval = 2000;
  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hourglassChars = ["⏳", "⌛"];
    log.info(
      `Waiting for key... ${hourglassChars[attempt % hourglassChars.length]}`
    );
    const apiKey = await checkApiKeyStatus(token);
    if (apiKey) {
      return apiKey;
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Failed to retrieve API key within the expected time. ⏰");
}

async function checkApiKeyStatus(token) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const apiKey = "mocked-api-key";
  return apiKey;
}

program.parse(process.argv);
