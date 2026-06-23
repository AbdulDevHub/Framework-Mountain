import OpenAI from "openai";

/**
 * Gets a configured OpenAI client instance.
 * If OPENAI_API_KEY is defined, it returns a standard OpenAI client.
 * Otherwise, it falls back to OPEN_ROUTER_API_KEY and configures the client for OpenRouter.
 */
export function getOpenAIClient(): OpenAI {
  const openAIKey = process.env.OPENAI_API_KEY;
  const openRouterKey = process.env.OPEN_ROUTER_API_KEY;

  if (openAIKey) {
    return new OpenAI({
      apiKey: openAIKey,
    });
  }

  if (openRouterKey) {
    return new OpenAI({
      apiKey: openRouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "JobPilot",
      },
    });
  }

  // Fallback to avoid runtime crashes during build/initialization when keys are empty
  return new OpenAI({
    apiKey: "placeholder",
  });
}

/**
 * Resolves the correct model name based on active provider configuration.
 * Returns 'gpt-4o' if standard OpenAI is active.
 * Otherwise, returns the value of OPEN_ROUTER_MODEL or defaults to 'meta-llama/llama-3.3-70b-instruct:free'.
 */
export function getAIModelName(): string {
  const openAIKey = process.env.OPENAI_API_KEY;

  if (openAIKey) {
    return "gpt-4o";
  }

  return process.env.OPEN_ROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
}
