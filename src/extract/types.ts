import { z } from 'zod';

/**
 * Usage statistics for an extraction operation.
 * Provides detailed information about token usage and costs.
 */
export interface ExtractUsage {
    /** Number of tokens in the input content */
    input_tokens: number;
    /** Number of tokens in the extracted output */
    output_tokens: number;
    /** Total tokens processed in the operation */
    total_tokens: number;
    /** Cost of processing input tokens (in USD) */
    input_cost: string;
    /** Cost of generating output tokens (in USD) */
    output_cost: string;
    /** Total cost of the operation (in USD) */
    total_cost: string;
}

/**
 * Response from a successful extraction operation.
 * Contains the extracted data and usage statistics.
 * 
 * @example
 * ```typescript
 * {
 *   id: "ext_abc123",
 *   status: "success",
 *   result: {
 *     title: "Example Article",
 *     author: "John Doe",
 *     content: "..."
 *   },
 *   usage: {
 *     input_tokens: 150,
 *     output_tokens: 50,
 *     total_tokens: 200,
 *     input_cost: "$0.002",
 *     output_cost: "$0.001",
 *     total_cost: "$0.003"
 *   }
 * }
 * ```
 */
export interface ExtractResponse {
    /** Unique identifier for this extraction operation */
    id: string;
    /** Status of the operation (always "success" for successful responses) */
    status: 'success';
    /** Extracted data, structure depends on the schema provided */
    result: any;
    /** Usage statistics for the operation */
    usage: ExtractUsage;
}

/**
 * Base options available for all extraction types.
 * These options help guide the AI in extracting the desired information.
 */
export interface BaseExtractOptions {
    /** 
     * Custom prompt to guide the extraction process.
     * Use this to specify what information you want to extract or how to interpret the content.
     * @example "Extract the main points and summarize the key findings"
     */
    prompt?: string;
    /** 
     * Schema definition using either Zod or JSON Schema.
     * Defines the structure of the data you want to extract.
     * @example
     * ```typescript
     * // Using Zod
     * z.object({
     *   title: z.string(),
     *   author: z.string(),
     *   date: z.string()
     * })
     * 
     * // Using JSON Schema
     * {
     *   type: 'object',
     *   properties: {
     *     title: { type: 'string' },
     *     author: { type: 'string' },
     *     date: { type: 'string' }
     *   }
     * }
     * ```
     */
    schema?: z.ZodType<any> | Record<string, any>;
    /** 
     * Natural language description of the schema.
     * Alternative to providing a formal schema.
     * @example "Extract the title, author name, and publication date"
     */
    schemaDescription?: string;
    /** Whether to stream results as they become available */
    stream?: boolean;
}

/**
 * Options for extracting data from a URL.
 * The service will fetch and process the content at the specified URL.
 * 
 * @example
 * ```typescript
 * {
 *   type: 'url',
 *   content: 'https://example.com/article',
 *   prompt: 'Extract the main points and author information',
 *   schema: {
 *     title: { type: 'string' },
 *     author: { type: 'string' },
 *     content: { type: 'string' }
 *   }
 * }
 * ```
 */
export interface UrlExtractOptions extends BaseExtractOptions {
    /** Type of extraction */
    type: 'url';
    /** URL to extract content from */
    content: string;
}

/**
 * Options for extracting data from a file.
 * Supports various file types including PDFs, images, and more.
 * 
 * @example
 * ```typescript
 * {
 *   type: 'file',
 *   content: {
 *     data: base64EncodedContent,
 *     mimeType: 'application/pdf'
 *   },
 *   prompt: 'Extract the executive summary and key findings'
 * }
 * ```
 */
export interface FileExtractOptions extends BaseExtractOptions {
    /** Type of extraction */
    type: 'file';
    /** File content as base64 string or Blob */
    content: {
        /** Base64 encoded file data */
        data: string;
        /** MIME type of the file (e.g., 'application/pdf', 'image/jpeg') */
        mimeType: string;
    } | Blob;
}

/**
 * Options for extracting data from plain text.
 * 
 * @example
 * ```typescript
 * {
 *   type: 'text',
 *   content: 'Your text content here...',
 *   schema: {
 *     summary: { type: 'string' },
 *     keywords: { type: 'array', items: { type: 'string' } }
 *   }
 * }
 * ```
 */
export interface TextExtractOptions extends BaseExtractOptions {
    /** Type of extraction */
    type: 'text';
    /** Text content to extract from */
    content: string;
}

/**
 * Options for generating a schema based on a description.
 * 
 * @example
 * ```typescript
 * {
 *   type: 'generate_schema',
 *   description: 'Generate a schema for extracting product information including name, price, and features'
 * }
 * ```
 */
export interface GenerateSchemaOptions {
    /** Type of operation */
    type: 'generate_schema';
    /** Description of the data structure you want to generate */
    description: string;
}

/** All possible extraction option types */
export type ExtractOptions = UrlExtractOptions | FileExtractOptions | TextExtractOptions | GenerateSchemaOptions;

/**
 * Extract structured data from various content types (URLs, files, or text).
 * 
 * @param options - Extraction options or content string
 * @returns Promise<ExtractResponse> - The extracted structured data
 * 
 * @example
 * ```typescript
 * // Extract from URL
 * const result = await consoles.extract({
 *   type: 'url',
 *   content: 'https://example.com/article',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       title: { type: 'string' },
 *       content: { type: 'string' }
 *     }
 *   }
 * });
 * 
 * // Simple text extraction
 * const result = await consoles.extract("Extract key points from this text");
 * ```
 * 
 * @throws {Error} When API key is not provided
 * @see {@link https://consoles.ai/docs/extract} Documentation
 */
export type ExtractInput = Exclude<ExtractOptions, { type: 'generate_schema' }> | string; 