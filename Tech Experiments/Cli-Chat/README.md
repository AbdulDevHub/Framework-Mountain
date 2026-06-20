# CLI Chat — Learning Project

A from-scratch CLI chat app built to understand how AI APIs actually work under the hood. Two implementations: one using raw `fetch` against a local Ollama model (free), one using the Anthropic SDK.

---

## What this project covers

- Calling an AI API directly with `fetch` — no wrapper libraries
- The `messages` array: how roles (`system`, `user`, `assistant`) work
- Conversation memory: why you have to send the full history every turn
- Streaming responses with async iterators (tokens printing as they arrive)
- How the Anthropic SDK compares to doing it manually

---

## Project structure

```
cli-chat/
├── chatOllama.ts        # Raw fetch → Ollama (local, free)
├── chatAnthropic.ts     # Anthropic SDK → Claude (requires API key)
├── .env.example         # Copy to .env and add your API key
├── package.json
└── tsconfig.json
```

---

## Setup

```bash
npm install
```

### For Ollama (free, local)

1. Install Ollama from <https://ollama.com>
2. Pull a model: `ollama pull qwen2.5-coder:7b`
3. Run it: `ollama serve`

### For Anthropic (requires API key)

1. Get an API key at <https://console.anthropic.com>
2. Copy `.env.example` to `.env`
3. Add your key: `ANTHROPIC_API_KEY=sk-ant-...`

---

## Running

```bash
# Local Ollama version
npx tsx chatOllama.ts

# Anthropic SDK version
npx tsx chatAnthropic.ts
```

Type your message and press Enter. Type `exit` to quit.

---

## Key concepts learned

### The messages array

Every AI chat API uses the same pattern — you send a list of messages and the model replies with the next one. There is no memory on the server; you send the full conversation history every single time.

```ts
const messages = [
  { role: "system",    content: "You are a helpful assistant." },
  { role: "user",      content: "My name is Alex."             },
  { role: "assistant", content: "Nice to meet you, Alex!"      },
  { role: "user",      content: "What's my name?"              }, // model answers this
];
```

The three roles:

- `system` — ground rules / persona set before the conversation starts
- `user` — messages from the human
- `assistant` — the model's previous replies (you add these so the model knows what it already said)

### Conversation memory

After each reply, push both the user message and the assistant reply into the array before the next turn. That growing array is the entire "memory" mechanism.

```ts
conversation.push({ role: "user", content: userInput });
const reply = await sendMessage(conversation);
conversation.push({ role: "assistant", content: reply });
```

### Streaming

With `stream: false` you wait for the whole response, then print it. With `stream: true` the API sends small chunks (tokens) as the model generates them.

Each chunk from Ollama is a line of JSON:

```json
{"message": {"content": "Hello"}, "done": false}
```

Multiple chunks can arrive in one network read, so you split by `\n` and parse each line individually:

```ts
const lines = value.split("\n").filter(line => line.trim() !== "");
for (const line of lines) {
  const parsed = JSON.parse(line);
  process.stdout.write(parsed.message?.content ?? "");
}
```

Tokens are not words — they're roughly syllables or common character groups. A word like "Hello" might arrive as `"Hell"` then `"o"`. Spaces are usually baked into the token itself (e.g. `" the"`).

### Raw fetch vs the Anthropic SDK

| | `chatOllama.ts` (raw) | `chatAnthropic.ts` (SDK) |
|---|---|---|
| HTTP | Manual `fetch` | SDK handles it |
| Streaming | Split `\n`, parse JSON manually | `for await` over typed events |
| Token extraction | `parsed.message?.content` | `event.delta.text` |
| System message | Inside `messages` array | Separate `system:` field |

The messages array, roles, and conversation loop logic are identical between both. The SDK just removes the HTTP plumbing.

---

## Models used

| File | Model | Cost |
|---|---|---|
| `chatOllama.ts` | `qwen2.5-coder:7b` | Free (local) |
| `chatAnthropic.ts` | `claude-haiku-4-5` | ~$0.001 per message |
