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
    
    // Find the start of the JSON object
    const start = contentText.indexOf("{");
    const end = contentText.lastIndexOf("}");
  
    let jsonStr;
  
    if (start !== -1 && end !== -1) {
      // If both '{' and '}' are found, slice the string to include the JSON object
      jsonStr = contentText.slice(start, end + 1);
    } else if (start === -1 && end !== -1) {
      // If only '}' is found, slice the string up to the '}' and add '{' at the front
      jsonStr = "{" + contentText.slice(0, end + 1);
    } else {
      // If neither '{' nor '}' is found, use the entire content
      jsonStr = contentText;
    }
  
    // Ensure the JSON object starts and ends with '{' and '}'
    jsonStr = jsonStr.startsWith("{") ? jsonStr : "{" + jsonStr;
    jsonStr = jsonStr.endsWith("}") ? jsonStr : jsonStr + "}";
  
    // If there are two '}' at the end, remove one
    while (jsonStr.endsWith("}}")) {
      jsonStr = jsonStr.slice(0, -1);
    }
  
    // Ensure the JSON object starts with '{' and ends with '}'
    if (!jsonStr.startsWith("{")) {
      jsonStr = "{" + jsonStr;
    }
    if (!jsonStr.endsWith("}")) {
      jsonStr = jsonStr + "}";
    }
  
    // Additional check to ensure the JSON is valid
    try {
      JSON.parse(jsonStr);
    } catch (error) {
      // If JSON is still invalid, return an error message
      return JSON.stringify({ error: "Invalid JSON format", originalMessage: contentText });
    }
  
    return jsonStr;
}