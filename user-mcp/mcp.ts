// Name: my-cool-tools
// Description: A collection of helpful utility tools

import { z } from 'zod';

// =====================================================
// DEFINING SCHEMAS
// =====================================================
// Define schemas first for cleaner code and better documentation
// These schemas provide validation and descriptions for the LLM

const HelloSchema = z.object({
  name: z.string().describe('Name to greet')
}).describe('Greet someone');

const AddSchema = z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number')
}).describe('Add two numbers');

const ReverseSchema = z.object({
  text: z.string().describe('Text to reverse')
}).describe('Reverse text');


// Tool 1: Greet someone
export async function hello(name: string) {
  return `Hello, ${name}!`;
}
hello.schema = HelloSchema;

// Tool 2: Add two numbers
export async function add(a: number, b: number) {
  return `${a + b}`;
}
add.schema = AddSchema;

// Tool 3: Reverse text
export async function reverse(text: string) {
  return `${text.split('').reverse().join('')}`;
}
reverse.schema = ReverseSchema;