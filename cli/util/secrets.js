import path from "path";
import os from "os";
import fs from "fs";
import chalk from "chalk";
import { log } from "../util/log.js";
import { displayFiglet, readEnvFile } from "../util/file.js";
import figlet from "figlet";

const displayConsolesAiFiglet = () => {
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
};

export const secretsCommand = async (action, namespace, key, value) => {
    displayConsolesAiFiglet();

    if (!action) {
        log.info("Available Secrets commands:");
        console.log(chalk.grey(`├─ ${chalk.cyan("new")} - Create a new Secret Space`));
        console.log(chalk.grey(`├─ ${chalk.cyan("list")} - List all Secret Spaces`));
        console.log(
            chalk.grey(`├─ ${chalk.cyan("add")} - Add a secret key-value pair to a Space`)
        );
        console.log(
            chalk.grey(`├─ ${chalk.cyan("view")} - View a secret key-value pair in a Space`)
        );
        console.log(
            chalk.grey(
                `├─ ${chalk.cyan(
                    "del"
                )} - Delete a Secret Space or a secret key-value pair from a Space`
            )
        );
        return;
    }
    try {
        const envPath = path.join(os.homedir(), ".consoles.env");
        const apiKey = fs.existsSync(envPath) ? await readEnvFile(envPath).API_KEY : null;
    
        if (!apiKey)
            throw new Error("API key not found. Please run the setup command.");

        const apiUrl = "https://api.consoles.ai/v1/secrets";
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        };

        switch (action) {
            
            case "new":
                if (!namespace) {
                    log.error("Secret Space name is required for this action");
                    log.warn("> Example: secrets new <space>");
                    return;
                }
                await handleResponse(
                    await fetch(`${apiUrl}/new/${namespace}`, {
                        method: "POST",
                        headers,
                    }),
                    `Secret Space ${namespace} created.`,
                    `Failed to create Secret Space ${namespace}.`
                );
                break;

            case "list":
                const listResponse = await fetch(`${apiUrl}/list`, {
                    method: "GET",
                    headers,
                });
                const spaces = await listResponse.json();
                log.info("Listing all Secret Spaces:");
                spaces.keys.forEach((ns) =>
                    console.log(chalk.grey(`├─ ${chalk.cyan(ns.name)}`))
                );
                break;

            case "add":
                await handleResponse(
                    await fetch(`${apiUrl}/add`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ namespace, key, value }),
                    }),
                    `Secret KV pair added: ${key} = ${value}`,
                    `Failed to add Secret KV pair: ${key} = ${value}`
                );
                break;

            case "view":
                const viewResponse = await fetch(
                    `${apiUrl}/view?namespace=${namespace}&key=${key}`,
                    { method: "GET", headers }
                );
                const kvValue = await viewResponse.json();
                if (kvValue) {
                    console.log(
                        chalk.grey(`├─ ${chalk.cyan("Secret KV Pair:")} ${key} = ${kvValue.value}`)
                    );
                } else {
                    log.error(`Key ${key} does not exist in Secret Space ${namespace}.`);
                }
                break;

            default:
                log.info("Available Secrets commands:");
                console.log(
                    chalk.grey(`├─ ${chalk.cyan("new")} - Create a new Secret Space`)
                );
                console.log(
                    chalk.grey(`├─ ${chalk.cyan("list")} - List all Secret Spaces`)
                );
                console.log(
                    chalk.grey(
                        `├─ ${chalk.cyan("add")} - Add a secret key-value pair to a Space`
                    )
                );
                console.log(
                    chalk.grey(
                        `├─ ${chalk.cyan("view")} - View a secret key-value pair in a Space`
                    )
                );
        }

        log.success("\nSecrets operation completed successfully! 🎉✨\n");
    } catch (error) {
        log.error("\n ❌ Secrets OPERATION FAILED...\n" + error.message);
    }
};
