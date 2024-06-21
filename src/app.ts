import { Hono, Context, Env } from "hono";
// import { upgradeWebSocket } from "hono/cloudflare-workers";
import { prettyJSON } from "hono/pretty-json";
import { etag } from "hono/etag";
import { poweredBy } from "hono/powered-by";
import { LLM } from "./llm";
import { VM } from "./vm";
import { KV } from "./kv";
import type { LLMOptions, llmProviders } from "./types/index.d.ts"; // Ensure correct import


function addShortcuts() {
  const properties = [
    "country",
    "asn",
    "asOrganization",
    "colo",
    "httpProtocol",
    "tlsCipher",
    "tlsVersion",
    "city",
    "continent",
    "latitude",
    "longitude",
    "postalCode",
    "metroCode",
    "region",
    "regionCode",
    "timezone",
  ];

  return async (c: any, next: () => Promise<void>) => {
    const cf = c.req.raw.cf || {};
    properties.forEach((prop) => {
      Object.defineProperty(c, prop, {
        get: () => cf[prop],
        configurable: true,
      });
    });
    // Alias for organization as asOrganization
    Object.defineProperty(c, "asOrganization", {
      get: () => cf["organization"],
      configurable: true,
    });
    // Alias for region as state
    Object.defineProperty(c, "state", {
      get: () => cf["region"],
      configurable: true,
    });
    // Alias for datacenter as colo
    Object.defineProperty(c, "datacenter", {
      get: () => cf["colo"],
      configurable: true,
    });
    // Alias for regionCode as stateCode
    Object.defineProperty(c, "stateCode", {
      get: () => cf["regionCode"],
      configurable: true,
    });
    // Set IP address from CF-Connecting-IP header
    c.ip = c.req.header("CF-Connecting-IP");
    await next();
  };
}

export class Console extends Hono<Env> {
  private currentContext: Context | null = null;
  private name: string; 
  private apiKey?: string; // Add this line

  constructor(name: string, apiKey?: string) {
    super();
    this.apiKey = apiKey;
    this.name = name;
    this.use(poweredBy());
    this.use("/etag/*", etag());
    this.use(prettyJSON());
    this.use(addShortcuts()); // Use the middleware

    this.use(async (c: Context, next: () => Promise<void>) => {
      this.currentContext = c; // Store the current context
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      c.header("X-Response-Time", `${ms}ms`);
    });

    this.notFound((c: Context) => {
      const path = c.req.url;
      return c.html(
        this.generateErrorPage(
          404,
          `Oops, it looks like the page at '${path}' doesn't exist.`
        ),
        404
      );
    });

    this.onError((err: Error, c: Context) => {
      console.error(`${err}`);
      return c.html(
        this.generateErrorPage(500, "Oops, something went wrong.", err),
        500
      );
    });

    this.use(async (c: Context, next: () => Promise<void>) => {
      try {
        await next();
      } catch (err) {
        console.error(`Unhandled error: ${err}`);
        return c.html(
          this.generateErrorPage(
            500,
            "Oops, something went wrong.",
            err as Error
          ),
          500
        );
      }
    });
  }

  generateErrorPage(
    statusCode: number,
    message: string,
    error?: Error
  ): string {
    const errorDetails = error
      ? `<pre class="mt-4 text-left text-sm text-red-500 bg-black p-4 rounded-lg border border-gray-700 shadow-lg">${error.stack}</pre>`
      : "";
    return `
    <head>
      <script src="https://cdn.tailwindcss.com"><\/script>
    </head>
    <section class="flex min-h-screen flex-col items-center justify-center px-4 md:px-6 lg:px-8">
      <div class="max-w-3xl text-center">
        <h1 class="text-9xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-gray-100">
          ${statusCode}
        </h1>
        <p class="mt-4 mb-8 text-xl font-semibold text-gray-500 dark:text-gray-400">
          ${message}
        </p>
        ${errorDetails}
        <br>
        <a
          class="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-gray-50 shadow-sm transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
          href="https://consoles.ai"
        >
          Back to Home
        </a>
      </div>
    </section>
    `;
  }
 // Method to get the current context
 getCurrentContext(): Context | null {
  return this.currentContext;
}
// Get Consoles app name
getName(): string {
  return this.name;
}

llm(name: string, defaultOptions?: LLMOptions<llmProviders>): LLM {
  return new LLM(name, defaultOptions || {});
}

  kv(namespace: string) {
    const getContext = () => {
      const c = this.getCurrentContext();
      if (!c) {
        throw new Error('No context available');
      }
      return c;
    };
    return new KV(getContext, namespace, this.apiKey!);
  }

  // Method to create a VM
  vm(name: string): VM {
    return new VM(name);
  }
 
}
