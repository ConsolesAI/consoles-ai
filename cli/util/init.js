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
  const text = figlet.textSync("consoles.ai", {
    font: "Larry 3D",
    horizontalLayout: "fitted",
  });
  
  const lines = text.split('\n');
  const gradientColors = ['#8A2BE2', '#9370DB', '#9932CC', '#8B008B', '#800080', '#4B0082'];

  
  const isDarkMode = process.env.NODE_ENV === 'production'; // You can adjust this condition based on your needs

  
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
      "target": "es2021",
      "lib": ["es2021"],
      "jsx": "react",
      "module": "es2022",
      "moduleResolution": "node",
      "types": ["@cloudflare/workers-types"],
      "resolveJsonModule": true,
      "allowJs": true,
      "checkJs": false,
      "noEmit": true,
      "isolatedModules": true,
      "allowSyntheticDefaultImports": true,
      "forceConsistentCasingInFileNames": true,
      "strict": true,
      "skipLibCheck": true
    }
  }`;

  const packageJsonContent = `{
    "name": "${projectName}",
    "version": "0.0.1",
    "private": true,
    "description": "${projectDescription}",
    "scripts": {
      "deploy": "consoles-ai deploy"
    },
    "devDependencies": {
      "@cloudflare/workers-types": "^4.20230419.0",
      "typescript": "^5.0.4"
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

  fs.writeFileSync(path.join(srcDir, "console.ts"), consoleContent);

  log.info(chalk.blue.bold("📦 Installing dependencies..."));
  const { execSync } = await import("child_process");
  execSync("npm install", { cwd: projectDir, stdio: "inherit" });

  log.info(chalk.green.bold("🎉 Project initialized successfully!"));
  rl.close();
};

