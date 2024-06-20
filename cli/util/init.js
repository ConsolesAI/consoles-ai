import * as fs from "fs";
import path from "path";
import { log } from "./log.js";
import chalk from "chalk";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const initProject = async () => {
  const projectName = await new Promise((resolve) => {
    rl.question(chalk.blue("Enter the project name: "), (answer) => {
      resolve(answer);
    });
  });

  log.info(`├── 🚀 Initializing your project: ${chalk.cyan(projectName)}`);

  const projectDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    throw new Error(
      chalk.yellow.italic(
        `   The project directory '${chalk.cyan(projectDir)}' already exists!\n`
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

  log.info("├── 📦 Installing dependencies...");
  const { execSync } = await import("child_process");
  execSync("npm install", { cwd: projectDir, stdio: "inherit" });

  log.info("├── 🎉 Project initialized successfully!");
  rl.close();
};