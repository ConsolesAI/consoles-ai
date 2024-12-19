import { tool } from 'ai';
import { z } from 'zod';

export class Tools {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  youtubeSearchTool = tool({
    description: 'Searches YouTube for the given query and returns relevant video links and details when a user asks for information.',
    parameters: z.object({
      query: z.string().describe('The search query to be used for finding YouTube videos.'),
      dateRange: z.enum(['qdr:h', 'qdr:d', 'qdr:w', 'qdr:m', 'qdr:y']).optional().describe('h = lst hour, d = last day, w = lst week, m = lst month, y = lst year. leave blank if user doesnt specify'),
    }),
    execute: async ({ query, dateRange }) => {
      console.log('Executing YouTube Search Tool for query:', query);

      const url = 'https://google.serper.dev/videos';
      const headers = {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({
        q: query + ' site:youtube.com',
        num: 10,
        ...(dateRange && { tbs: dateRange }),
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: body,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        return data;
      } catch (error) {
        console.error('Error fetching YouTube Search results:', error);
        throw error;
      }
    },
  });

  googleImageSearchTool = tool({
    description: 'Searches Google Images for the given query and returns relevant information when a user asks for information.',
    parameters: z.object({
      query: z.string(),
      quantity: z.number().int().positive().max(10).optional(),
    }),
    execute: async ({ query, quantity }) => {
      console.log('Executing Google Image Search Tool for query:', query);

      const url = 'https://google.serper.dev/images';
      const headers = {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({
        q: query + '+width: 1200',
        num: quantity || 1,
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: body,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        return data;
      } catch (error) {
        console.error('Error fetching Google Image Search results:', error);
        throw error;
      }
    },
  });

  googleSearchTool = tool({
    description: 'Searches Google for the given query and returns relevant information when a user asks for information.',
    parameters: z.object({
      query: z.string(),
    }),
    execute: async ({ query }) => {
      console.log('Executing Google Search Tool for query:', query);

      const url = 'https://google.serper.dev/search';
      const headers = {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({
        q: query,
        location: 'United States',
        num: 10,
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: body,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        return data;
      } catch (error) {
        console.error('Error fetching Google Search results:', error);
        throw error;
      }
    },
  });

  googleNewsTool = tool({
    description: 'Fetches the latest news from Google News based on the query and returns relevant information when a user asks for information.',
    parameters: z.object({
      query: z.string(),
    }),
    execute: async ({ query }) => {
      console.log('Executing Google News Tool for query:', query);
      
      const url = 'https://google.serper.dev/news';
      const headers = {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({
        q: query,
        location: 'United States',
        gl: 'us',
        num: 50,
        tbs: 'qdr:m',
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: body,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        return data;
      } catch (error) {
        console.error('Error fetching Google News:', error);
        throw error;
      }
    },
  });
}