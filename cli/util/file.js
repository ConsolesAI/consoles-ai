import * as fs from "fs";
import chalk from "chalk";
import figlet from "figlet";
import crypto from "crypto";
import readline from "readline";

export const displayFiglet = (text, color = "#4B0082") => {
  console.log(
    chalk.hex(color)(figlet.textSync(text, { horizontalLayout: "full" }))
  );
};

export const readEnvFile = (envPath) => {
  const envContent = fs.readFileSync(envPath, "utf-8");
  return Object.fromEntries(
    envContent
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("="))
  );
};

export const generateToken = () => crypto.randomBytes(16).toString("hex");

export const waitForKeyPress = () => {
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

export const saveEnvFile = (envPath, token, apiKey) => {
  fs.writeFileSync(envPath, `TOKEN=${token}\nAPI_KEY=${apiKey}\n`);
  log.success("API key and token saved to 📁 " + chalk.cyan(envPath));
};