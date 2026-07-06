# LangChain Practice

Two small projects built while working through a LangChain crash course, exploring how to wire LLMs up to prompts, sequential logic, and external data.

- **[Pets Name](./Pets%20Name)** — a Streamlit app that generates pet name ideas from a prompt template
- **[Youtube Assistant](./Youtube%20Assistant)** — a Streamlit app that answers questions about a YouTube video using its transcript

---

## What is LangChain?

Plain LLMs are like a very smart consultant sitting alone in a locked room: they don't know your private files, they forget everything the moment the conversation ends, and they can't go fetch anything from the outside world on their own.

LangChain is a framework that gives an LLM the missing pieces to be useful in a real application — a way to read outside data, a way to remember things, and a way to chain steps together — so you're not reinventing that plumbing from scratch every time you call an API.

It's built around four core ideas:

| Concept | What it does | Analogy |
|---|---|---|
| **Models** | A common interface for talking to an LLM, so swapping providers (OpenAI, Anthropic, etc.) is mostly a one-line change | The brain |
| **Chains** | Link multiple steps together so the output of one becomes the input of the next | The pipeline |
| **Retrieval** | Connect the model to outside data (documents, transcripts, databases) so it can answer using real information instead of guessing | The library |
| **Agents** | Let the LLM itself decide which tool to use for a given query, rather than following a fixed sequence of steps | The decision-maker |

Both projects in this folder use the first two ideas — **Models** and **Chains**. The YouTube Assistant also uses **Retrieval**, since it has to search a transcript before answering. Neither project uses an Agent — the logic is fixed rather than decided on the fly by the LLM.

---

## Project 1: Pets Name Generator

A single-prompt app: pick an animal and a color, and the LLM suggests five names.

```
Pets Name/
├── main.py               # Streamlit UI
├── langchain_helper.py   # LangChain logic
├── requirements.txt
├── Dockerfile
└── images/Pets-Name-LangChain.gif
```

### How it works (`langchain_helper.py`)

```python
prompt_template_name = PromptTemplate(
    input_variables=['animal_type', 'pet_color'],
    template="I have a {animal_type} pet and I want a cool name for it, "
             "it is {pet_color} in color. Suggest me five cool names for my pet."
)

name_chain = LLMChain(llm=llm, prompt=prompt_template_name, output_key="pet_name")
```

This is the simplest possible **Chain**: one `PromptTemplate` with placeholders (`{animal_type}`, `{pet_color}`) feeds into one `LLMChain`. Calling the chain with a dictionary of values fills in the template, sends it to the model, and returns the result under the `pet_name` key. There's no external data involved — the whole "chain" here is really just one link, which is a good starting point before adding more steps.

### The UI (`main.py`)

Streamlit collects three inputs in the sidebar — animal type (a dropdown), color (a text box whose label changes depending on the animal), and an OpenAI API key (a password field, since this is a public demo and each user supplies their own key). Once both the color and the key are present, it calls `generate_pet_name()` and prints the response.

---

## Project 2: YouTube Assistant

A small retrieval-augmented Q&A tool: paste a YouTube URL and a question, and it answers using the video's transcript.

```
Youtube Assistant/
├── main.py               # Streamlit UI
├── langchain_helper.py   # LangChain logic
├── requirements.txt
├── Dockerfile
├── .streamlit/config.toml
└── YouTube-Assistant.png
```

### How it works (`langchain_helper.py`)

This one actually uses the **Retrieval** building block, in three stages:

**1. Load the transcript**

```python
loader = YoutubeLoader.from_youtube_url(video_url)
transcript = loader.load()
```

`YoutubeLoader` pulls the video's transcript so it can be treated as a normal document.

**2. Split and embed it**

```python
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
docs = text_splitter.split_documents(transcript)

db = FAISS.from_documents(docs, embeddings)
```

A full transcript is usually too long to hand an LLM in one go, so it's cut into overlapping 1000-character chunks (the overlap keeps sentences that straddle a chunk boundary from losing context). Each chunk is turned into an embedding — a numerical fingerprint of its meaning — and stored in a **FAISS** vector store, which is a small local database built for fast "find me the most similar chunks" lookups.

**3. Retrieve and answer**

```python
docs = db.similarity_search(query, k=k)
docs_page_content = " ".join([d.page_content for d in docs])

chain = LLMChain(llm=llm, prompt=prompt)
response = chain.run(question=query, docs=docs_page_content)
```

Instead of sending the entire transcript to the model, it searches the vector store for the `k` chunks most relevant to the question, joins those chunks together, and only sends *that* smaller, relevant slice to the LLM along with the question. This is the classic pattern behind most "chat with your documents" tools — it keeps the model grounded in the source material and avoids blowing past its token limit. The prompt itself also instructs the model to say "I don't know" if the transcript doesn't contain the answer, which helps cut down on hallucination.

### The UI (`main.py`)

Same shape as the Pets Name app: a sidebar form collects the video URL, the question, and an OpenAI API key. On submit, it builds the vector store from the video, runs the similarity search + answer chain, and prints the result.

---

## Running either project locally

From inside the project's folder (`Pets Name/` or `Youtube Assistant/`):

```bash
pip install -r requirements.txt
streamlit run main.py
```

Each app expects an OpenAI API key — either entered in the sidebar at runtime, or loaded from a `.env` file via `load_dotenv()` (as `OPENAI_API_KEY=...`).

A `Dockerfile` is included in each project folder if you'd rather run it in a container than install dependencies locally.

## What ties the two together

Side by side, these two projects are a decent mini-tour of LangChain fundamentals:

- **Pets Name** shows the smallest unit — one prompt template wired into one chain.
- **YouTube Assistant** builds on that by adding retrieval: loading data, chunking it, embedding it, storing it, and searching it before ever calling the LLM.

Neither uses an **Agent**, since both apps always take the same fixed path (fill a prompt, or search-then-answer) rather than needing the LLM to choose between multiple tools — that would be the natural next concept to explore after these two.
