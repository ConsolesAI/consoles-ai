import { log } from "../util/log.js";
import chalk from "chalk";
import figlet from "figlet";
import os from "os";
import path from "path";
import fs from "fs";
import { readEnvFile } from "../util/file.js";

const displayFiglet = () => {
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
const handleResponse = async (response, successMsg, errorMsg) => {
    if (response.ok) {
        log.info(successMsg);
    } else {
        log.error(errorMsg);
    }
};

export const kvCommand = async (action, namespace, key, value) => {
    displayFiglet();


    if (!action) {
        log.info("Available KV commands:");
        console.log(chalk.grey(`├─ ${chalk.cyan("new")} - Create a new Space`));
        console.log(chalk.grey(`├─ ${chalk.cyan("list")} - List all Spaces`));
        console.log(
            chalk.grey(`├─ ${chalk.cyan("add")} - Add a key-value pair to a Space`)
        );
        console.log(
            chalk.grey(`├─ ${chalk.cyan("view")} - View a key-value pair in a Space`)
        );
        console.log(
            chalk.grey(
                `├─ ${chalk.cyan(
                    "del"
                )} - Delete a Space or a key-value pair from a Space`
            )
        );
        process.exit(0);
    }
    try {
        const envPath = path.join(os.homedir(), ".consoles.env");
        const apiKey = fs.existsSync(envPath) ? readEnvFile(envPath).API_KEY : null;
    
        if (!apiKey)
            throw new Error("API key not found. Please run the setup command.");

        // const apiUrl = "https://api.consoles.ai/v1/kv";
        // const headers = {
        //     "Content-Type": "application/json",
        //     Authorization: `Bearer ${apiKey}`,
        // };

        switch (action) {
            
            case "new":
                if (!namespace) {
                    log.error("Space name is required for this action");
                    log.warn("> Example: kv new <space>");
                    return;
                }
                await handleResponse(
                    await fetch(`${apiUrl}/new/${namespace}`, {
                        method: "POST",
                        headers,
                    }),
                    `Namespace ${namespace} created.`,
                    `Failed to create namespace ${namespace}.`
                );
                break;

            case "list":
                const listResponse = await fetch(`${apiUrl}/list`, {
                    method: "GET",
                    headers,
                });
                const spaces = await listResponse.json();
                log.info("Listing all namespaces:");
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
                    `KV pair added: ${key} = ${value}`,
                    `Failed to add KV pair: ${key} = ${value}`
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
                        chalk.grey(`├─ ${chalk.cyan("KV Pair:")} ${key} = ${kvValue.value}`)
                    );
                } else {
                    log.error(`Key ${key} does not exist in namespace ${namespace}.`);
                }
                break;

            default:
                log.info("Available KV commands:");
                console.log(
                    chalk.grey(`├─ ${chalk.cyan("new")} - Create a new namespace`)
                );
                console.log(
                    chalk.grey(`├─ ${chalk.cyan("list")} - List all namespaces`)
                );
                console.log(
                    chalk.grey(
                        `├─ ${chalk.cyan("add")} - Add a key-value pair to a namespace`
                    )
                );
                console.log(
                    chalk.grey(
                        `├─ ${chalk.cyan("view")} - View a key-value pair in a namespace`
                    )
                );
        }

        log.success("\nKV operation completed successfully! 🎉✨\n");
    } catch (error) {
        log.error("\n ❌ KV OPERATION FAILED...\n" + error.message);
    }
};
