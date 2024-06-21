import * as fs from "fs";
import chalk from "chalk";
import figlet from "figlet";
import crypto from "crypto";
import { log } from "../util/log.js";
import readline from "readline";

export const displayFiglet = async (text, color = "#4B0082") => {
  return new Promise((resolve) => {
    figlet(text, { horizontalLayout: "full" }, (err, data) => {
      if (err) {
        console.error('Something went wrong...', err);
        return;
      }
      console.log(chalk.hex(color)(data));
      resolve();
    });
  });
};

export const readEnvFile = async (envPath) => {
  const envContent = await fs.promises.readFile(envPath, "utf-8");
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
      resolve(buffer.toString("hex"));
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

export const saveEnvFile = async (envPath, token, apiKey) => {
  const data = `TOKEN=${token}\nAPI_KEY=${apiKey}\n`;
  await fs.promises.writeFile(envPath, data);
  log.success("API key and token saved to 📁 " + chalk.cyan(envPath));
};