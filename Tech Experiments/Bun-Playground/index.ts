import dayjs from "dayjs"

console.log("Hello via Bun!")
console.log("Today is:", dayjs().format("YYYY-MM-DD"))

// Top-level await — just works, no wrapper needed
const response = await fetch("https://api.github.com/repos/oven-sh/bun")
const data = await response.json()

console.log(`Bun has ${data.stargazers_count} stars on GitHub`)

// Bun's built-in fast file I/O — no `fs` module needed
await Bun.write(
  "stars.json",
  JSON.stringify({ stars: data.stargazers_count }, null, 2),
)

console.log("Saved to stars.json")
