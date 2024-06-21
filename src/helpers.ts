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
  
  // If the content starts and ends with a double quote, wrap it in curly braces
  if (contentText.trim().startsWith('"') && contentText.trim().endsWith('"')) {
    return `{${contentText}}`;
  }
  
  // If the content starts with a key-value pair, wrap it in curly braces
  if (contentText.trim().startsWith('"') && contentText.includes(':')) {
    return `{${contentText}}`;
  }
  
  // If the content is a plain string, wrap it in a JSON object
  if (!contentText.trim().startsWith('{') && !contentText.trim().endsWith('}')) {
    return JSON.stringify({ message: contentText });
  }
  
  // Check if the content contains key-value pairs indicating potential JSON
  if (contentText.includes('":"')) {
      // Ensure the content is wrapped in '{' and '}'
      let jsonStr = contentText;
      if (!jsonStr.startsWith("{")) {
          jsonStr = "{" + jsonStr;
      }
      if (!jsonStr.endsWith("}")) {
          jsonStr = jsonStr + "}";
      }

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