import chalk from "chalk";

export const log = {
  info: (message) => console.log(chalk.green(message)),
  warn: (message) => console.log(chalk.yellow(message)),
  error: (message) => console.error(chalk.red(`🚨 ${message}`)),
  success: (message) => console.log(chalk.green.bold(message)),
};