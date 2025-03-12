import { z } from 'zod';

export interface ExtractUsage {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_cost: string;
    output_cost: string;
    total_cost: string;
}

export interface ExtractResponse {
    id: string;
    status: 'success';
    result: any;
    usage: ExtractUsage;
    input_type?: 'file' | 'url' | 'text';
    input_details?: {
        url?: string;
        file_name?: string;
        file_size?: number;
        mime_type?: string;
        text_length?: number;
    };
    schema?: Record<string, any>;
    prompt?: string;
}

/**
 * Base options for all extract operations
 * @example
 * ```typescript
 * // Example with a simple schema
 * const options: BaseExtractOptions = {
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       title: { type: 'string' },
 *       price: { type: 'number' },
 *       inStock: { type: 'boolean' }
 *     }
 *   }
 * }
 * 
 * // Example with a complex schema
 * const options: BaseExtractOptions = {
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       products: {
 *         type: 'array',
 *         items: {
 *           type: 'object',
 *           properties: {
 *             name: { type: 'string' },
 *             variants: {
 *               type: 'array',
 *               items: { type: 'string' }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   prompt: "Extract product information focusing on variants"
 * }
 * ```
 */
export interface BaseExtractOptions {
    /** 
     * Optional prompt to guide the extraction process.
     * Use this to specify additional context or focus areas.
     * @example
     * prompt: "Extract only pricing information and availability"
     * prompt: "Focus on technical specifications in the content"
     */
    prompt?: string;

    /** 
     * Schema definition for the expected output structure.
     * Supports both Zod schemas and plain JSON Schema objects.
     * Common types: string, number, boolean, array, object
     * @example
     * ```typescript
     * // JSON Schema style
     * schema: {
     *   type: 'object',
     *   properties: {
     *     title: { type: 'string' },
     *     metadata: {
     *       type: 'object',
     *       properties: {
     *         tags: { type: 'array', items: { type: 'string' } }
     *       }
     *     }
     *   }
     * }
     * 
     * // Zod schema style
     * schema: z.object({
     *   title: z.string(),
     *   metadata: z.object({
     *     tags: z.array(z.string())
     *   })
     * })
     * ```
     */
    schema?: z.ZodType<any> | Record<string, any>;

    /** 
     * Human-readable description of what the schema represents.
     * Use this to provide context about the expected data structure.
     * @example
     * "Product catalog with nested variants and pricing information"
     * "Article content with metadata and author details"
     */
    schemaDescription?: string;

    /** 
     * Enable streaming of extraction results.
     * Useful for processing large documents or getting partial results faster.
     */
    stream?: boolean;
}

/**
 * Options for extracting data from a URL
 * @example
 * ```typescript
 * // Example: Extract financial data from annual report PDF
 * const urlExtract: UrlExtractOptions = {
 *   type: 'url',  // Specify 'url' for URL-based extraction
 *   content: 'https://www.annualreports.com/HostedData/AnnualReports/PDF/NYSE_NET_2023.pdf',
 *   schema: {
 *     type: 'object',
 *     required: ['revenue', 'netIncome'],
 *     properties: {
 *       revenue: {
 *         type: 'number',
 *         description: 'Total revenue in millions USD'
 *       },
 *       netIncome: {
 *         type: 'number',
 *         description: 'Net income in millions USD'
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface UrlExtractOptions extends BaseExtractOptions {
    /** 
     * Specify 'url' for URL-based extraction.
     * Use this type when you want to extract data from a webpage or downloadable file (PDF, etc).
     * The URL must be publicly accessible and start with http:// or https://.
     * @example
     * type: 'url'
     */
    type: 'url';
    /** 
     * The URL to extract data from.
     * Supports both http and https URLs.
     * @example
     * 'https://example.com/article/123'
     * 'https://store.example.com/products'
     */
    content: string;
}

/**
 * Options for extracting data from a file
 * @example
 * ```typescript
 * // Example 1: Extract from PDF using base64
 * const fileExtract: FileExtractOptions = {
 *   type: 'file',  // Specify 'file' for file-based extraction
 *   content: {
 *     data: 'JVBERi0xLjcKCjEgMCBvYmogICUgZW50...',
 *     mimeType: 'application/pdf'
 *   },
 *   schema: {
 *     type: 'object',
 *     required: ['title', 'author'],
 *     properties: {
 *       title: { type: 'string' },
 *       author: { type: 'string' }
 *     }
 *   }
 * }
 * 
 * // Example 2: Extract from file using Blob
 * const blobExtract: FileExtractOptions = {
 *   type: 'file',
 *   content: new Blob(['file contents'], { type: 'text/plain' }),
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       text: { type: 'string' },
 *       summary: { type: 'string' }
 *     }
 *   }
 * }
 * ```
 */
export interface FileExtractOptions extends BaseExtractOptions {
    /** 
     * Specify 'file' for file-based extraction.
     * Supports multiple file types:
     * - Documents: PDF, DOCX, DOC, TXT, RTF
     * - Audio: MP3, WAV, M4A, OGG
     * - Video: MP4, MOV, AVI, MKV
     * - Images: JPG, PNG, WEBP
     * 
     * Files are processed in 50MB chunks.
     * @example
     * type: 'file'
     */
    type: 'file';
    /** 
     * The file content and type information.
     * Supports both string data with mimeType or Blob objects.
     * Common mimeTypes: application/pdf, text/plain, application/json
     */
    content: {
        data: string;
        mimeType: string;
    } | Blob;
}

/**
 * Options for extracting data from plain text
 * @example
 * ```typescript
 * // Example: Extract product details from text
 * const textExtract: TextExtractOptions = {
 *   type: 'text',  // Specify 'text' for plain text extraction
 *   content: 'The new iPhone 15 Pro Max features a 6.7" display at $1099, it's 5G enabled and has a 12MP camera',
 *   schema: {
 *     type: 'object',
 *     required: ['model', 'price'],
 *     properties: {
 *       model: { type: 'string' },
 *       price: { type: 'number' },
 *       features: {
 *         type: 'array',
 *         items: { type: 'string' }
 *       }
 *     }
 *   },
 *   prompt: "Extract product specifications and pricing information"
 * }
 * ```
 */
export interface TextExtractOptions extends BaseExtractOptions {
    /** 
     * Specify 'text' for plain text extraction.
     * Use this type when you have raw text content to analyze.
     * Ideal for processing product descriptions, articles, or any textual content.
     * @example
     * type: 'text'
     */
    type: 'text';
    /** The text content to extract data from */
    content: string;
}

export interface GenerateSchemaOptions {
    type: 'generate_schema';
    description: string;
}

export type ExtractOptions = UrlExtractOptions | FileExtractOptions | TextExtractOptions | GenerateSchemaOptions;

export type ExtractInput = Exclude<ExtractOptions, { type: 'generate_schema' }> | string;

export type ExtractType = 'text' | 'url' | 'file' | 'generate_schema';

export interface TextExtractOptions extends BaseExtractOptions {
    type: Extract<ExtractType, 'text'>;
    content: string;
}

export interface UrlExtractOptions extends BaseExtractOptions {
    type: Extract<ExtractType, 'url'>;
    content: string;
}

export interface FileExtractOptions extends BaseExtractOptions {
    type: Extract<ExtractType, 'file'>;
    content: {
        data: string;
        mimeType: string;
    } | Blob;
}

export interface GenerateSchemaOptions {
    type: Extract<ExtractType, 'generate_schema'>;
    description: string;
}