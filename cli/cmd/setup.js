import { displayFiglet, readEnvFile, generateToken, saveEnvFile } from "../util/file.js";
import { log } from "../util/log.js";
import { retrieveApiKey } from "../util/api.js";
import os from "os";
import path from "path";
import fs from "fs";
import open from "open";
import figlet from "figlet";
import chalk from "chalk";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const setupCommand = async () => {
  try {
    const text = figlet.textSync("consoles.ai", {
      font: "Larry 3D",
      horizontalLayout: "fitted",
    });
    console.log(text);

    log.info("Setting up ConsolesAI...");

    const homeDir = os.homedir();
    const envPath = path.join(homeDir, ".consoles.env");

    let token, apiKey;

    if (fs.existsSync(envPath)) {
      log.warn(".consoles.env file found at 📁 " + chalk.cyan(envPath));
      const envVars = await readEnvFile(envPath);  // Assuming readEnvFile is async

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
      token = generateToken();
      log.info("Generated unique token: 🔑 " + chalk.cyan(token));
      await saveEnvFile(envPath, { TOKEN: token }); // Assuming saveEnvFile is async
      log.info("Press Enter to login");
      await new Promise(resolve => rl.question("", resolve));
      await open(`https://consoles.ai/login?token=${token}`);
      apiKey = await retrieveApiKey(token);
      await saveEnvFile(envPath, { TOKEN: token, API_KEY: apiKey });
    }

    if (apiKey) {
      log.success("ConsolesAI setup completed. ✅");
      log.info("Use 'consoles init' to start your first project or use 'consoles run <script.name>'");
    
    }
  } catch (error) {
    log.error("An error occurred during setup:", error);
  } finally {
    rl.close();
    process.exit(0);  // Ensure the process exits
  }
};