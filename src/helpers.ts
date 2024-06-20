import { parseAsJSON } from '@acusti/parsing';

export function sanitizeToJson(contentText: string): string {
  // Check if contentText is already a valid JSON
  try {
      JSON.parse(contentText);
      return contentText;
  } catch (error) {
      // Not a valid JSON, proceed with sanitization
  }

  const r = parseAsJSON(contentText);
  if (r !== null) {
      return JSON.stringify(r);
  }
  
  // Check if the content contains key-value pairs indicating potential JSON
  if (contentText.includes('":"')) {
      // Ensure the content is wrapped in '{' and '}'
      let jsonStr = contentText;
      jsonStr = jsonStr.startsWith("{") ? jsonStr : "{" + jsonStr;
      jsonStr = jsonStr.endsWith("}") ? jsonStr : jsonStr + "}";

      // If there are two '}' at the end, remove one
      while (jsonStr.endsWith("}}")) {
          jsonStr = jsonStr.slice(0, -1);
      }

      // Additional check to ensure the JSON is valid
      try {
          JSON.parse(jsonStr);
          return jsonStr;
      } catch (error) {
          // If JSON is still invalid, wrap the content in '{' and '}'
          return "{" + contentText + "}";
      }
  }

  // If no key-value pairs are found, wrap the content in '{' and '}'
  return "{" + contentText + "}";
}