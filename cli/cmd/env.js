import path from "path";
import os from "os";
import fs from "fs";
import chalk from "chalk";
import { log } from "../util/log.js";
import { displayFiglet, readEnvFile } from "../util/file.js";

const handleResponse = async (response, successMsg, errorMsg) => {
    if (response.ok) {
        log.info(successMsg);
    } else {
        log.error(errorMsg);
    }
};

export const secretsCommand = async (action, namespace, key, value) => {

    if (!action) {
        log.info("Available Secret Space commands:");
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
                    `Secret key-value pair added: ${key} = ${value}`,
                    `Failed to add secret key-value pair: ${key} = ${value}`
                );
                break;

            case "view":
                const viewResponse = await fetch(
                    `${apiUrl}/view?namespace=${namespace}&key=${key}`,
                    { method: "GET", headers }
                );
                const secretValue = await viewResponse.json();
                if (secretValue) {
                    console.log(
                        chalk.grey(`├─ ${chalk.cyan("Secret Pair:")} ${key} = ${secretValue.value}`)
                    );
                } else {
                    log.error(`Key ${key} does not exist in Secret Space ${namespace}.`);
                }
                break;

            default:
                log.info("Available Secret Space commands:");
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

        log.success("\nSecret Space operation completed successfully! 🎉✨\n");
    } catch (error) {
        log.error("\n ❌ SECRET SPACE OPERATION FAILED...\n" + error.message);
    }
};
