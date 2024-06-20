import { log } from "./log.js";

export const retrieveApiKey = async (token) => {
  const apiKey = await pollForApiKey(token);
  log.success("API key received. 🎉");
  return apiKey;
};

const pollForApiKey = async (token) => {
    const poll = async () => {
      // Simulate API call to check for API key
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("mocked-api-key");
        }, 1000);
      });
    };
  
    let apiKey;
    while (!apiKey) {
      apiKey = await poll();
    }
    return apiKey;
  };