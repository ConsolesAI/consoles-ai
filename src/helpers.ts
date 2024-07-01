import { parseAsJSON } from '@acusti/parsing';


export async function sanitizeToJson(contentText: string): Promise<string> {
  // If already JSON, return it
  try {
    JSON.parse(contentText);
    console.log(`Already JSON: ${contentText}`);
    return contentText;
  } catch (e) {
    // Not valid JSON, continue to sanitize
  }

  // Trim whitespace from the ends
  contentText = contentText.trim();

// If it contains a colon and doesn't start with '{' or end with '}'
if (contentText.includes(':') && (!contentText.startsWith('{') || !contentText.endsWith('}'))) {
  console.log(`Sanitizing JSON - Adding missing brackets`);
  contentText = contentText.startsWith('{') ? contentText : `{${contentText}`;
  contentText = contentText.endsWith('}') ? contentText : `${contentText}}`;

   // If it doesn't end in '}'
   let lastIndex = contentText.lastIndexOf('}');
   let formattedString = contentText.slice(0, lastIndex + 1);
   formattedString = formattedString.startsWith('{') ? formattedString : `{${formattedString}`;
   contentText = formattedString;
}
 
  // If it doesnt end in } 
  // Find the last occurrence of '}'
  let lastIndex = contentText.lastIndexOf('}');

  // Slice the string up to the last '}'
  let formattedString = contentText.slice(0, lastIndex + 1);

  // If doesnt start with a { add one 
  formattedString = formattedString.startsWith('{') ? formattedString : `{${formattedString}`;
  
  contentText = formattedString;

  // Existing checks...
  const parsedResult = parseAsJSON(contentText);
  if (parsedResult) {
    const parsedContent = JSON.stringify(parsedResult);
    console.log(`Parsing Library Json Success: ${parsedContent}`);
    return parsedContent;
  } else if (contentText.startsWith('{') && !contentText.endsWith('}')) {
    console.log(`Sanitizing JSON - Missing closing bracket`);
    return `${contentText}}`;
  } else if (!contentText.startsWith('{') && contentText.endsWith('}')) {
    console.log(`Sanitizing JSON - Missing opening bracket`);
    return `{${contentText}`;
  } else if (contentText.includes('{{') && contentText.includes('}}')) {
    console.log(`Sanitizing JSON - Double brackets`);
    return contentText.replace('{{', '{').replace('}}', '}');
  } else if (contentText.includes('"') && contentText.includes(':') && !contentText.includes('{') && !contentText.includes('}')) {
    console.log(`Sanitizing JSON - No brackets`);
    return `{${contentText}}`;
  } else if (contentText.includes('"') && contentText.includes(':') && contentText.includes('}') && !contentText.includes('{')) {
    console.log(`Sanitizing JSON - Extra characters after closing bracket`);
    return `{${contentText.split('}')[0]}}`;
  } else {
    return '';
  }
}