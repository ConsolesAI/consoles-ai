import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DurableObjectState, DurableObject, DurableObjectNamespace } from '@cloudflare/workers-types';
import { EdgeSSETransport } from './edgeSSE.js';
import { Hono, Context } from 'hono';
import { z } from 'zod';

// Define the Env interface for type safety
export interface Env {
	MCP_OBJECT: DurableObjectNamespace;
}

export class MCP {
	#server: McpServer;
	#app: Hono;
	McpObject: any;

	constructor(config: { name: string; version: string; description?: string }) {
		// Initialize the MCP server
		this.#server = new McpServer({
			name: config.name,
			version: config.version,
			description: config.description,
			capabilities: {
				prompts: {},
				tools: {},
				resources: {}
			},
		});

		// Initialize Hono app
		this.#app = new Hono();
		
		// Set up the route handler for MCP endpoints
		this.#app.all('/*', async (c: Context) => {
			const sessionId = c.req.query('sessionId');
			const object = c.env.MCP_OBJECT.get(
				sessionId ? c.env.MCP_OBJECT.idFromString(sessionId) : c.env.MCP_OBJECT.newUniqueId(),
			);
			return object.fetch(c.req.raw);
		});

		// Create the Durable Object class and attach it directly to this instance
		const serverFactory = () => this.#server;
		this.McpObject = class extends MCPDurableObject {
			constructor(state: DurableObjectState, env: Env) {
				super(state, env, serverFactory);
			}
		};
	}

	/**
	 * Add a tool to the MCP server
	 * @param name Name of the tool
	 * @param schema Schema for the tool's input parameters using zod or a raw object
	 * @param handler Function that processes the input and returns a result
	 * @returns The MCP instance for chaining
	 */
	tool(name: string, schema: any, handler: (args: any) => any) {
		// Wrap the handler to format the response according to MCP requirements
		const wrappedHandler = async (args: any, extra: any) => {
			const result = await handler(args);
			
			// If the result is already in the MCP format, return it as is
			if (result && typeof result === 'object' && Array.isArray(result.content)) {
				return result;
			}
			
			// Otherwise, convert the result to a text content item
			return {
				content: [
					{
						type: 'text',
						text: String(result)
					}
				]
			};
		};
		
		// Register the tool with the MCP server
		this.#server.tool(name, schema, wrappedHandler);
		return this;
	}

	/**
	 * Add a resource to the MCP server
	 * @param uri URI of the resource
	 * @param handler Function that returns the resource content
	 * @param options Additional options for the resource
	 * @returns The MCP instance for chaining
	 */
	resource(uri: string, handler: () => Promise<string | object>, options: {
		name?: string;
		description?: string;
		mimeType?: string;
	} = {}) {
		// Register the resource with the MCP server
		this.#server.resource(
			options.name || uri,                // Name of the resource
			uri,                                // URI of the resource
			{                                   // Metadata
				description: options.description,
				mimeType: options.mimeType || 'text/plain'
			},
			async () => {                       // Read callback
				const result = await handler();
				
				// Format the result based on its type
				if (typeof result === 'string') {
					return {
						contents: [{
							uri,
							mimeType: options.mimeType || 'text/plain',
							text: result
						}]
					};
				} else {
					return {
						contents: [{
							uri,
							mimeType: options.mimeType || 'application/json',
							text: JSON.stringify(result)
						}]
					};
				}
			}
		);
		
		return this;
	}

	get fetch() {
		return this.#app.fetch;
	}
}

/**
 * Durable Object implementation for MCP
 */
class MCPDurableObject {
	private transport: EdgeSSETransport | null = null;
	private server: McpServer;
	private state: DurableObjectState;
	private env: Env;

	constructor(state: DurableObjectState, env: Env, serverFactory: () => McpServer) {
		this.state = state;
		this.env = env;
		this.server = serverFactory();
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		
		// Create the transport if it doesn't exist
		if (!this.transport) {
			const messageUrl = `${url.origin}${url.pathname.replace('sse', 'message')}`;
			this.transport = new EdgeSSETransport(messageUrl, this.state.id.toString());
		}
		
		// Handle SSE connection
		if (request.method === 'GET' && url.pathname.endsWith('/sse')) {
			await this.server.connect(this.transport);
			return this.transport.sseResponse;
		}
		
		// Handle message posting
		if (request.method === 'POST' && url.pathname.endsWith('/message')) {
			return this.transport.handlePostMessage(request);
		}
		
		// Return information about the server for the root path
		if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
			return new Response(JSON.stringify({
				status: 'ready',
				message: 'MCP server is running'
			}), {
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}
		
		return new Response('Not found', { status: 404 });
	}
}

// Export the MCP class as the default export
export { MCP as default };