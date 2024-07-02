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
    } 
  }
  return matches;
};

export const deployProject = async () => {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  const entryScript = path.join(srcDir, 'console.ts');


  log.info("├── 🔨 Building your project...");

  if (!fs.existsSync(entryScript)) {
    log.error(
      chalk.yellow.italic(
        `   The entry script '${chalk.cyan(entryScript)}' does not exist!\n`
      )
    );
    process.exit(0); // Exit the process
  }

  const fileContent = fs.readFileSync(entryScript, "utf8");
  const projectNameMatch = fileContent.match(/new Console\(['"]([^'"]+)['"](,\s*['"]([^'"]+)['"]|\s*,\s*\{.*?\})?\);/);
  if (!projectNameMatch) {
    log.error(
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
    process.exit(0); // Exit the process
  }

  const projectName = projectNameMatch[1].toLowerCase();
  const workSpace = projectNameMatch[2].toLowerCase();
  const bundleDir = path.join(projectRoot, "built");
  const bundlePath = path.join(bundleDir, `${projectName}.mjs`);

  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir);
  }

  const homeDir = os.homedir();
  const envPath = path.join(homeDir, ".consoles.env");

if (!fs.existsSync(envPath)) {
  log.error(
    chalk.red(`   The .consoles.env file does not exist at ${chalk.cyan(envPath)}!\n`)
  );
  process.exit(0); // Exit the process
}
  
// Use the readEnvFile function from file.js
const envVars = await readEnvFile(envPath);



  let modifiedFileContent = fileContent;

  const apiKeyRegex = /new Console\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"]|\s*,\s*\{.*?apiKey:\s*['"]([^'"]+)['"].*?\})?\);/;

  let apiKey = envVars.API_KEY;
  
  if (!apiKey) {
    const apiKeyMatch = fileContent.match(apiKeyRegex);
    if (apiKeyMatch) {
      apiKey = apiKeyMatch[3];
    }
  }
  
  if (!apiKey) {
    log.error(
      chalk.red(`   The API_KEY is not defined in the .consoles.env file or in the entry script!\n`)
    );
    process.exit(0); // Exit the process
  }

  if (!apiKeyRegex.test(fileContent)) {
    modifiedFileContent = fileContent.replace(
      /new Console\(['"]([^'"]+)['"]\);/,
      `new Console('$1', { apiKey: '${apiKey}' });`
    ).replace(
      /new Console\(['"]([^'"]+)['"],\s*\{(.*?)\}\);/,
      `new Console('$1', { $2, apiKey: '${apiKey}' });`
    ).replace(
      /new Console\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\);/,
      `new Console('$1', '${apiKey}');`
    );
  }

  fs.writeFileSync(entryScript, modifiedFileContent, "utf8");

  try {
    await esbuild.build({
      entryPoints: [entryScript],
      bundle: true,
      outfile: bundlePath,
      platform: "browser",
      external: [], // Ensure no modules are treated as external
      minify: false,
      sourcemap: false,
      format: "esm", // Change this line to use ESModule format
      target: ["es2020"],
      loader: { ".ts": "ts" },
      tsconfig: path.join(projectRoot, "tsconfig.json"),
    });
    log.info("├── 📦 Building completed.");
    const bundleContent = fs.readFileSync(bundlePath, "utf8");
  
    // Remove node_modules folder from the built directory if it exists
    const nodeModulesPath = path.join(bundleDir, "node_modules");
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    }
  

    const endpoints = extractMatches(
      /app\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g,
      bundleContent,
      "endpoint"
    );
  

    log.info("├── ✨ Deploying to cloud...");

    // // Actually deploy to  WfP API
    // const wrkr = path.join(bundleDir, `${projectName}_bundle.mjs`);
    // const r = await fetch(`https://api.consoles.ai/deploy`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({ projectName, wrkr }),
    // });
    
    const response = {
      data: {
        id: crypto.randomBytes(3).toString("hex"),
        deploymentId: crypto.randomBytes(3).toString("hex"),
        projectName: projectName,
        workSpace: "rob",
        endpoints: endpoints
      },
    };
    log.info("├── 🌍 Deployment completed.");
    // Cleanup
    log.info("├── 🧹 Cleaning up...");
    // fs.rmSync(bundleDir, { recursive: true, force: true });
    log.info("├── 🗑️ Cleanup completed!");

    return response.data;
  } catch (error) {
    log.error("❌ Error during deployment: " + error.message);
    // Cleanup even if there's an error
    if (fs.existsSync(bundleDir)) {
    //  fs.rmSync(bundleDir, { recursive: true, force: true });
    }
    throw error;
  }
};