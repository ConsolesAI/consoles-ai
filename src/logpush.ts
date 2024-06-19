import { R2Bucket } from '@cloudflare/workers-types';

function expandObject(obj: any): any {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = expandObject(obj[key]);
      }
    }
  }
  return obj;
}

async function enhancedLogger(messages: any[], options: any, response: any, bucket: R2Bucket) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    request: {
      provider: options.provider,
      model: options.model,
      messages: messages,
      options: options,
    },
    response: expandObject(response),
  };

  const logData = JSON.stringify(logEntry, null, 2);
  const logFileName = `llm_gateway_${Date.now()}.log`;

  await bucket.put(logFileName, logData, {
    httpMetadata: {
      contentType: 'application/json',
    },
  });

  console.log('Log entry added to R2 bucket with filename', logFileName);
}

export { enhancedLogger };
