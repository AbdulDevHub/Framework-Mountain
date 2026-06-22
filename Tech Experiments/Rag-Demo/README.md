# Rag-Demo

A from-scratch implementation of Retrieval-Augmented Generation (RAG) using local, free tools. No API keys, no cloud services, no cost.

## What is RAG?

RAG is a technique for making an LLM answer questions about *your* documents, not just its training data. Instead of stuffing a whole document into a prompt (slow, expensive, often too long), you:

1. **Ingest** — convert document chunks into vectors and store them
2. **Retrieve** — when a question arrives, find the most relevant chunks via similarity search
3. **Generate** — inject those chunks into an LLM prompt as context, get a grounded answer

The LLM only sees the relevant pieces, and is instructed to answer from them alone — reducing hallucination.

## Stack

| Tool | Role | Cost |
|---|---|---|
| [Ollama](https://ollama.com) | Runs models locally (embeddings + LLM) | Free |
| `nomic-embed-text` | Converts text → 768-dimensional vectors | Free |
| `qwen2.5-coder:7b` | Generates answers from retrieved context | Free |
| PostgreSQL + pgvector | Stores vectors, runs similarity search | Free / open source |
| Docker | Runs the Postgres container | Free |

## Project structure

```
RAG/
├── ingest.py   # Phase 1: embed documents and store in Postgres
├── query.py    # Phase 2: search by meaning, print raw results (no LLM)
├── rag.py      # Phase 3: full pipeline — retrieve + generate an answer
└── README.md
```

## Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Ollama](https://ollama.com) (installed and running)
- Python 3.10+ with [uv](https://github.com/astral-sh/uv)

### 1. Start the database

```powershell
docker run -d --name pgvector-demo -e POSTGRES_PASSWORD=postgres -p 5432:5432 ankane/pgvector
```

### 2. Create the schema

```powershell
docker exec -it pgvector-demo psql -U postgres
```

Then inside the Postgres shell:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id        SERIAL PRIMARY KEY,
  content   TEXT NOT NULL,
  embedding vector(768)   -- must match the embedding model's output size
);
```

Type `\q` to exit.

### 3. Pull the models

```powershell
ollama pull nomic-embed-text
ollama pull qwen2.5-coder:7b
```

### 4. Install Python dependencies

```powershell
uv init
uv add psycopg2-binary requests
```

## Usage

### Ingest documents

Edit the `chunks` list in `ingest.py` to add your own text, then run:

```powershell
uv run ingest.py
```

This embeds each chunk and stores it in Postgres. Run this once per document set, or whenever you add new content.

### Inspect retrieval (no LLM)

```powershell
uv run query.py
```

Prints the top matching chunks for each question along with their similarity scores. Useful for debugging — if the wrong chunks are being retrieved, the LLM answer will be wrong regardless of how good the model is.

### Full RAG pipeline

```powershell
uv run rag.py
```

Runs the complete loop: retrieves relevant chunks, builds a prompt, generates an answer with the local LLM.

## How similarity search works

Embeddings are vectors in high-dimensional space. The `<=>` operator in pgvector computes the **cosine distance** between two vectors — a measure of how different their directions are.

```sql
ORDER BY embedding <=> query_vector   -- closest vectors first
```

Similarity score = `1 - cosine_distance`, ranging from 0 to 1. A score above ~0.7 is typically a strong match.

## Swapping models

To use a different LLM, change `LLM_MODEL` in `rag.py` to any model you have pulled locally:

```python
LLM_MODEL = "gemma4:e4b"   # or any other ollama model
```

To use a different embedding model, change the `"model"` field in `get_embedding()` in all three files — and recreate the `documents` table with the correct vector dimension, since different models output different sizes.

## Limitations of this implementation

This is a learning-focused minimal pipeline. Production RAG systems typically also handle:

- **Chunking strategy** — splitting documents by sentence, paragraph, or token count rather than hardcoding strings
- **Metadata filtering** — storing document source, date, etc. alongside embeddings to filter before searching
- **Re-ranking** — a second pass to re-score retrieved chunks for better precision
- **Persistent connections** — connection pooling instead of opening/closing per query
- **Index tuning** — creating an HNSW or IVFFlat index on the vector column for fast search at scale