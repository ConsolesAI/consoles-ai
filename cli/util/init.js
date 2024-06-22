import * as fs from "fs";
import path from "path";
import { log } from "./log.js";
import chalk from "chalk";
import readline from "readline";
import figlet from "figlet";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const initProject = async () => {
  const text = figlet.textSync("consoles", {
    font: "Larry 3D",
    horizontalLayout: "fitted",
  });
  
  const lines = text.split('\n');
  const gradientColors = ['#8A2BE2', '#9370DB', '#9932CC', '#8B008B', '#800080', '#4B0082', '#6A5ACD', '#483D8B', '#7B68EE', '#9400D3', '#8B008B', '#9932CC'];

  const coloredLines = lines.map((line, index) => {
    const color = gradientColors[Math.floor(index / lines.length * gradientColors.length)];
    return chalk.hex(color)(line);
  });
  
  if (process.stdout.isTTY && process.stdout.getColorDepth() > 4) {
    console.log(coloredLines.join('\n'));
  } else {
    console.log(text);
  }

  const projectName = await new Promise((resolve) => {
    rl.question(chalk.green("Enter the project name: "), (answer) => {
      resolve(answer);
    });
  });

  const projectDescription = await new Promise((resolve) => {
    rl.question(chalk.green("Enter brief description: "), (answer) => {
      resolve(answer);
    });
  });

  log.info(`🚀 Initializing your project: ${chalk.cyan.bold(projectName)}`);
  log.info(`📝 Project description: ${chalk.cyan(projectDescription)}`);

  const projectDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    throw new Error(
      chalk.yellow.italic(
        `   The project directory '${chalk.cyan.bold(projectDir)}' already exists!\n`
      )
    );
  }

  fs.mkdirSync(projectDir);

  const tsconfigContent = `{
    "compilerOptions": {
      "target": "ESNext",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "strict": true,
      "skipLibCheck": true,
      "types": [
        "node"
      ],
      "jsx": "react-jsx",
      "jsxImportSource": "hono/jsx",
    }
  }`;

  const packageJsonContent = `{
    "name": "${projectName}",
    "version": "0.0.1",
    "private": true,
    "description": "${projectDescription}",
    "scripts": {
      "deploy": "consoles-ai deploy",
      "dev": "tsx watch src/local.ts"
    },
    "devDependencies": {
      "consoles-ai": "^0.0.72"
      "@cloudflare/workers-types": "^4.20230419.0",
      "typescript": "^5.0.4",
      "@hono/node-server": "^1.11.4",
      "tsx": "^4.0.0",
      "typescript": "^5.4.5",
    }
  }`;

  const prettierrcContent = `{
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all"
  }`;

  const editorconfigContent = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true`;

  fs.writeFileSync(path.join(projectDir, "tsconfig.json"), tsconfigContent);
  fs.writeFileSync(path.join(projectDir, "package.json"), packageJsonContent);
  fs.writeFileSync(path.join(projectDir, ".prettierrc"), prettierrcContent);
  fs.writeFileSync(path.join(projectDir, ".editorconfig"), editorconfigContent);

  const srcDir = path.join(projectDir, "src");
  fs.mkdirSync(srcDir);

  const consoleContent = `import { Console } from 'consoles-ai';

const app = new Console('${projectName}');

app.get('/', (c) => {
  return c.json({ hello: 'world' });
});

export default app;
`;

const localFile = `import { serve } from '@hono/node-server';
import app from './console';

const port = 3000;
console.log('Server is running on port ' + port);

serve({
    fetch: app.fetch,
    port: port
});`;

  fs.writeFileSync(path.join(srcDir, "console.ts"), consoleContent);
  fs.writeFileSync(path.join(srcDir, "local.ts"), localFile);

  log.info(chalk.blue.bold("📦 Installing dependencies..."));
  const { execSync } = await import("child_process");
  execSync("npm install", { cwd: projectDir, stdio: "inherit" });

  log.info(chalk.green.bold("🎉 Project initialized successfully!"));
  rl.close();
};

