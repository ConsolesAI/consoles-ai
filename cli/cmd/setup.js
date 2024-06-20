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
  const text = figlet.textSync("consoles.ai", {
    font: "Larry 3D",
    horizontalLayout: "fitted",
  });
  
  const lines = text.split('\n');
  const gradientColors = ['#8A2BE2', '#9370DB', '#9932CC', '#8B008B', '#800080', '#4B0082'];

  const coloredLines = lines.map((line, index) => {
    const color = gradientColors[Math.floor(index / lines.length * gradientColors.length)];
    return chalk.hex(color)(line);
  });
  
  if (process.stdout.isTTY && process.stdout.getColorDepth() > 4) {
    console.log(coloredLines.join('\n'));
  } else {
    console.log(text);
  }

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
};