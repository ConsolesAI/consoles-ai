import { log } from "./log.js";
import readline from 'readline';
import chalk from 'chalk';
import open from 'open';
import { generateToken, waitForKeyPress } from './file.js';

// Debug utility that only logs when --debug flag is present
const debug = (...args) => {
  if (process.argv.includes('--debug')) {
    console.log(...args);
  }
};

const askToRetry = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.blue('Would you like to try again? (y/N): '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
};

export const retrieveApiKey = async (token) => {
  while (true) {
    try {
      const apiKey = await pollForApiKey(token);
      log.success("API key received! 🎉");
      return apiKey;
    } catch (error) {
      if (error.code === "TOKEN_REJECTED") {
        log.warn("Link request was cancelled.");
        const retry = await askToRetry();
        if (retry) {
          // Generate new token and continue
          token = await generateToken();
          log.info("Generated new token: 🔑 " + chalk.cyan(token));
          log.info("Press any key to login");
          await waitForKeyPress();
          await open(`https://app.consoles.ai/settings/account?link=${token}`);
          log.info("Please complete the process in your browser. 🌍");
          continue;
        }
      }
      log.error("Setup cancelled. Run 'consoles-ai setup' when you're ready to try again.");
      process.exit(0);
    }
  }
};

const pollForApiKey = async (token) => {
  const poll = async () => {
    try {
      const response = await fetch(`https://app.consoles.ai/api/token/${token}`);
      const responseData = await response.json();
      
      debug('Response:', {
        status: response.status,
        data: responseData
      });

      // Handle nested data structure
      const data = responseData.data || responseData;

      // Handle different response cases
      if (data.apiKey) {
        return data.apiKey;
      }
      
      if (data.status === 'pending') {
        return null; // Keep polling
      }

      if (responseData.code === "TOKEN_REJECTED" || responseData.error === "Token rejected") {
        const error = new Error("Link request was cancelled.");
        error.code = "TOKEN_REJECTED";
        throw error;
      }

      // Any other non-OK response
      if (!response.ok) {
        return null;
      }
      
      return null;
    } catch (error) {
      if (error.code === "TOKEN_REJECTED") {
        throw error;
      }
      // Log unexpected errors
      debug('Unexpected error:', error);
      return null;
    }
  };

  let apiKey;
  let attempts = 0;
  const maxAttempts = 180; // 3 minutes with 1s delay

  while (!apiKey && attempts < maxAttempts) {
    try {
      apiKey = await poll();
      if (!apiKey) {
        attempts++;
        if (attempts === maxAttempts) {
          throw new Error("Failed to receive API key. Please try again or check your connection.");
        }
        if (attempts % 10 === 0) {
          debug(`Still polling... (${attempts} attempts)`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      throw error;
    }
  }
  
  if (!apiKey) {
    throw new Error("Failed to receive API key. Please try again or check your connection.");
  }
  
  return apiKey;
};