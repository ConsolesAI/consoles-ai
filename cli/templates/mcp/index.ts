// name: {{name}}
// description: {{description}}

import { z } from 'zod';

// =====================================================
// DEFINING SCHEMAS
// =====================================================
// Define your schemas here to validate tool inputs
// Each schema should describe the parameters your tool accepts

const ExampleSchema = z.object({
  message: z.string().describe('A message to echo back')
}).describe('A simple example tool that echoes back a message');

// =====================================================
// TOOL IMPLEMENTATIONS 
// =====================================================
// Implement your tools here
// Each tool should have a schema attached using toolName.schema = SchemaName

export async function example(message: string) {
  return `${message}`;
}
example.schema = ExampleSchema;