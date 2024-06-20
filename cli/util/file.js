import * as fs from "fs/promises";
import chalk from "chalk";
import figlet from "figlet";
import crypto from "crypto";
import { log } from "../util/log.js";
import readline from "readline";

export const displayFiglet = async (text, color = "#4B0082") => {
  return new Promise((resolve, reject) => {
    figlet(text, { horizontalLayout: "full" }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(chalk.hex(color)(data));
      resolve();
    });
  });
};

export const readEnvFile = async (envPath) => {
  const envContent = await fs.readFile(envPath, "utf-8");
  return Object.fromEntries(
    envContent
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("="))
  );
};

export const generateToken = async () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer.toString("hex"));
    });
  });
};

export const waitForKeyPress = async () => {
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

export const saveEnvFile = async (envPath, envData) => {
  const data = `TOKEN=${envData.TOKEN}\nAPI_KEY=${envData.API_KEY}\n`;
  await fs.writeFile(envPath, data);
  log.success("API key and token saved to 📁 " + chalk.cyan(envPath));
};