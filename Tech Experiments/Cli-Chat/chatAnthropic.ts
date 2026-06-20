// chat-anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import "dotenv/config";

const client = new Anthropic(); // automatically reads ANTHROPIC_API_KEY from env

type Role = "user" | "assistant"; // system is handled separately in the SDK

interface Message {
  role: Role;
  content: string;
}

async function sendMessage(messages: Message[]): Promise<string> {
  process.stdout.write("Assistant: ");

  let fullReply = "";

  // .stream() handles all the chunk-splitting and JSON parsing for you
  const stream = await client.messages.stream({
    model: "claude-haiku-4-5",   // fast and cheap, great for learning
    max_tokens: 1024,
    system: "You are a helpful assistant. Keep answers concise.", // system is its own field here
    messages: messages,
  });

  // for-await loops over tokens as they stream in — same concept as your manual reader loop
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
      fullReply += event.delta.text;
    }
  }

  process.stdout.write("\n\n");
  return fullReply;
}

async function main() {
  const conversation: Message[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Chat started (Anthropic). Type "exit" to quit.\n');

  const askUser = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  while (true) {
    const userInput = await askUser("You: ");

    if (userInput.trim().toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    conversation.push({ role: "user", content: userInput });

    try {
      const reply = await sendMessage(conversation);
      conversation.push({ role: "assistant", content: reply });
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

main();