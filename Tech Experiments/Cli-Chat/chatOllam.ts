// chat.ts
import * as readline from "readline";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5-coder:7b"; // ← change this to match what `ollama list` shows you

type Role = "system" | "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

// This is a simple implementation that waits for the full response before printing anything.
// async function sendMessage(messages: Message[]): Promise<string> {
//   const response = await fetch(OLLAMA_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       model: MODEL,
//       messages: messages,
//       stream: true, // chatgpt style writing response
//     }),
//   });

//   if (!response.ok) {
//     throw new Error(`API error: ${response.status} ${await response.text()}`);
//   }

//   const data = await response.json();
  
//   // Ollama wraps the reply inside: data.message.content
//   return data.message.content;
// }

// This implementation reads the response as a stream and prints tokens as they arrive.
async function sendMessage(messages: Message[]): Promise<string> {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      stream: true, // chatgpt style writing response
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }

  // response.body is a stream of raw bytes
  // We wrap it to read it as text, line by line
  const reader = response.body!
    .pipeThrough(new TextDecoderStream())
    .getReader();

  process.stdout.write("Assistant: "); // print label once, with no newline

  let fullReply = "";

  while (true) {
    const { done, value } = await reader.read(); // await each chunk
    if (done) break;

    // Each chunk is one line of JSON like: {"message":{"content":"Hello"},"done":false}
    const lines = value.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const token = parsed.message?.content ?? "";

        process.stdout.write(token); // print word immediately, no newline
        fullReply += token;
      } catch {
        // incomplete chunk, skip
      }
    }
  }

  process.stdout.write("\n\n"); // newline after the full reply
  return fullReply; // still return the full text so we can add it to history
}

async function main() {
  const conversation: Message[] = [
    {
      role: "system",
      content: "You are a helpful assistant. Keep answers concise.",
    },
  ];

  // readline lets us read user input from the terminal line by line
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Chat started. Type your message and press Enter. Type "exit" to quit.\n');

  // This wraps rl.question in a Promise so we can use await with it
  const askUser = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  while (true) {
    const userInput = await askUser("You: ");

    if (userInput.trim().toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    // 1. Add the user's message to history
    conversation.push({ role: "user", content: userInput });

    try {
      const reply = await sendMessage(conversation);

      // 2. Add the model's reply to history
      conversation.push({ role: "assistant", content: reply });
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

main();