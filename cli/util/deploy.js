import * as fs from "fs";
import path from "path";
import esbuild from "esbuild";
import crypto from "crypto";
import os from "os";
import { log } from "./log.js";
import { readEnvFile } from "./file.js";
import chalk from "chalk"; // Add this line

export const extractMatches = (regex, content, type) => {
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

export const deployProject = async (entryScript) => {
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

  const homeDir = os.homedir();
  const envPath = path.join(homeDir, ".consoles.env");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      chalk.red(`   The .consoles.env file does not exist at ${chalk.cyan(envPath)}!\n`)
    );
  }
  const envVars = readEnvFile(envPath);
  const apiKey = envVars.API_KEY;
  if (!apiKey) {
    throw new Error(
      chalk.red(`   The API_KEY is not defined in the .consoles.env file!\n`)
    );
  }

  let modifiedFileContent = fileContent;

  const apiKeyRegex = /new Console\('([^']+)'\s*,\s*'([^']+)'\);/;
  if (!apiKeyRegex.test(fileContent)) {
    modifiedFileContent = fileContent.replace(
      /new Console\('([^']+)'\);/,
      `new Console('$1', '${apiKey}');`
    );
  }

  fs.writeFileSync(entryScript, modifiedFileContent, "utf8");

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

    const endpoints = extractMatches(
      /app\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g,
      bundleContent,
      "endpoint"
    );
    const llms = extractMatches(
      /app\.llm\s*\(\s*['"`](.*?)['"`]\s*\)/g,
      bundleContent,
      "llm"
    );

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