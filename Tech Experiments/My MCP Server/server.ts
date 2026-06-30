import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

// Create MCP server instance
const server = new McpServer({
  name: "Weather Data Fetcher",
  version: "1.0.0",
})

// Define a tool to track package delivery status
server.registerTool(
  "trackPackage",
  {
    description:
      "Track the delivery status of a package using its tracking number",
    inputSchema: {
      trackingNumber: z.string().describe("Package tracking number"),
    },
  },
  async ({ trackingNumber }) => {
    return {
      content: [
        {
          type: "text",
          text: `Checking delivery status for: ${trackingNumber}`,
        },
      ],
    }
  },
)

// A helper function to simulate fetching weather data
async function getWeatherByCity(city: string) {
  if (city.toLowerCase() === "new york") {
    return { temp: "22°C", forecast: "Partly cloudy with a breeze" }
  }
  if (city.toLowerCase() === "london") {
    return { temp: "16°C", forecast: "Rainy and overcast" }
  }
  return { temp: null, error: "Weather data not available for this city" }
}

// Define a tool to fetch weather data
server.registerTool(
  "getWeatherByCityName",
  {
    description: "Get current weather details for a specific supported city",
    inputSchema: {
      city: z
        .string()
        .describe("Name of the city to get weather for (New York or London)"),
    },
  },
  async ({ city }) => {
    const weatherData = await getWeatherByCity(city)
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(weatherData),
        },
      ],
    }
  },
)

// Registering a static resource for supported airport codes
server.registerResource(
  "Airport Codes",
  "flights://airports",
  {
    description: "List of supported airport codes",
    mimeType: "text/plain",
  },
  async (uri: URL) => {
    return {
      contents: [
        {
          uri: uri.href,
          text: `Supported Airports:
- JFK (New York)
- LHR (London Heathrow)
- SFO (San Francisco)`,
        },
      ],
    }
  },
)

// Registering a static resource for supported cities
server.registerResource(
  "Supported Cities",
  "weather://cities",
  {
    description: "List of supported cities",
    mimeType: "text/plain",
  },
  async (uri: URL) => {
    return {
      contents: [
        {
          uri: uri.href,
          text: `Supported Cities:
- London (UK)
- New York (USA)`,
        },
      ],
    }
  },
)

// Server Init
async function init() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("🌤️  Weather MCP Server Started!")
  console.error("🛠️  Tool: getWeatherByCityName")
  console.error("📚 Resource: weather://cities")
  console.error("🏙️  Supported Cities: New York, London")
  console.error("✅ Server ready!")
}

init().catch(console.error)
