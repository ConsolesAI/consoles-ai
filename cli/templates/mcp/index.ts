// name: {{name}}
// description: {{description}}
// version: 1.0

import { z } from 'zod';

// =====================================================
// DEFINING SCHEMAS
// =====================================================
// Define schemas first for cleaner code and better documentation
// These schemas provide validation and descriptions for the LLM

const HelloSchema = z.object({
  name: z.string().describe('Name to greet')
}).describe('Greet someone');

const WeatherSchema = z.object({
  location: z.string().describe('The location to get weather for (city, address, etc.)'),
  units: z.enum(['metric', 'imperial']).optional().describe('Units to use for temperature (metric = Celsius, imperial = Fahrenheit)')
}).describe('Get the current weather for a location');

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

// Tool 1: Greet someone
export async function hello(name: string) {
  return `Hello, ${name}!`;
}
hello.schema = HelloSchema;

// Tool 2: Get weather
export async function weather(location: string, units: 'metric' | 'imperial' = 'metric') {
  return `Getting weather for ${location} in ${units} units...`;
}
weather.schema = WeatherSchema; 