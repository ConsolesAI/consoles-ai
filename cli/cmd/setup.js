import { displayFiglet, readEnvFile, generateToken, waitForKeyPress, saveEnvFile } from "../util/file.js";
import { log } from "../util/log.js";
import { retrieveApiKey } from "../util/api.js";
import os from "os";
import path from "path";
import fs from "fs";
import open from "open";
import figlet from "figlet";
import chalk from "chalk";

export const setupCommand = async () => {
  console.log(
    chalk.hex("#800080")(
      figlet.textSync("consoles.ai", {
        font: "Larry 3D",
        horizontalLayout: "fitted",
      })
    )
  );
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
      token = await generateToken();
      log.info("Generated unique token: 🔑 " + chalk.cyan(token));
      log.info("Press any key to login");
      await waitForKeyPress();
      await open(`https://consoles.ai/login?token=${token}`);
      log.info("Please complete the process in your browser. 🌍");
      apiKey = await retrieveApiKey(token);
  
      // Ensure token and apiKey are defined before saving
      if (token && apiKey) {
        await saveEnvFile(envPath, token, apiKey);
        log.success("ConsolesAI setup completed. ✅");
        log.info(
          "Use 'consoles init' to start your first project or use 'consoles run <script.name>'"
        );
      } else {
        log.error("Failed to retrieve token or API key.");
      }
    }
  } else {
    log.success("ConsolesAI setup completed. ✅");
    log.info(
      "Use 'consoles init' to start your first project or use 'consoles run <script.name>'"
    );
  }
};