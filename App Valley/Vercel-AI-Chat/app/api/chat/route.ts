import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai'; // Added stepCountIs
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// Point the OpenAI provider at your local Ollama instead of OpenAI's servers
const ollama = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama doesn't need a real key, but the field is required
});

// Mock weather data — no real API needed
function getMockWeather(location: string) {
  const weatherData: Record<string, { temp: number; condition: string; humidity: number }> = {
    toronto: { temp: 18, condition: 'Cloudy', humidity: 72 },
    london:  { temp: 12, condition: 'Rainy',  humidity: 85 },
    tokyo:   { temp: 26, condition: 'Sunny',  humidity: 60 },
    sydney:  { temp: 22, condition: 'Partly Cloudy', humidity: 65 },
  };

  const key = location.toLowerCase();
  return weatherData[key] ?? { temp: 20, condition: 'Clear', humidity: 55 };
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: ollama.chat('gemma4:e4b'),
    system: 'You are a helpful assistant. When asked about weather, always use the get_weather tool.',
    messages: await convertToModelMessages(messages),
    tools: {
      get_weather: tool({
        description: 'Get the current weather for a given city',
        inputSchema: z.object({
          location: z.string().describe('The city name, e.g. Toronto'),
        }),
        execute: async ({ location }) => {
          const weather = getMockWeather(location);
          return {
            location,
            temperature: weather.temp,
            condition: weather.condition,
            humidity: weather.humidity,
          };
        },
      }),
    },
    // toolChoice: 'required', // Force small dumb local models to trigger tool binding correctly
    stopWhen: stepCountIs(3), // Allow model → tool → model round trips
  });

  return result.toUIMessageStreamResponse();
}