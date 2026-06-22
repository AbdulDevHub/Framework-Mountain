"""
ingest.py — Phase 1 of the RAG pipeline: Ingestion

This script takes raw text chunks, converts each one into a vector (embedding)
using a local Ollama model, and stores both the original text and its vector
in a Postgres database (with the pgvector extension).

Run this once (or whenever you add new documents) to populate the database.
After this, use query.py to search or rag.py to get LLM-generated answers.
"""

import requests
import psycopg2

# --- Config ---

# Ollama runs a local HTTP server on port 11434.
# This endpoint accepts text and returns a vector (list of floats).
OLLAMA_URL = "http://localhost:11434/api/embeddings"

# Connection string for our Postgres container started with Docker.
# Format: "host=... port=... dbname=... user=... password=..."
DB_CONN = "host=localhost port=5432 dbname=postgres user=postgres password=postgres"


def get_embedding(text: str) -> list[float]:
    """
    Convert a string of text into an embedding vector using Ollama.

    An embedding is a list of 768 numbers that represents the *meaning*
    of the text. Texts with similar meaning produce vectors that are
    mathematically close to each other — that's what makes semantic
    search possible.

    We use 'nomic-embed-text', a small model purpose-built for embeddings.
    It always outputs exactly 768 numbers regardless of input length.
    """
    response = requests.post(OLLAMA_URL, json={
        "model": "nomic-embed-text",
        "prompt": text
    })
    # The API returns {"embedding": [0.12, -0.44, ...]}
    return response.json()["embedding"]


def store_document(content: str, embedding: list[float]):
    """
    Insert a text chunk and its embedding vector into the 'documents' table.

    The table schema (created during setup) looks like:
        id        SERIAL PRIMARY KEY
        content   TEXT             -- the original text
        embedding vector(768)      -- the 768-dimensional vector

    pgvector accepts the embedding as a string like "[0.12, -0.44, ...]",
    which is why we call str(embedding) before inserting.
    """
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO documents (content, embedding) VALUES (%s, %s)",
        (content, str(embedding))   # pgvector accepts a Python list cast to string
    )

    conn.commit()   # actually write the row to disk
    cur.close()
    conn.close()


# --- Sample documents to ingest ---
# In a real project these would come from PDFs, web pages, a database, etc.
# Each string is one "chunk" — a self-contained piece of text.
# Chunk size matters: too short loses context, too long dilutes relevance.
chunks = [
    "The Eiffel Tower is located in Paris, France and was completed in 1889.",
    "Photosynthesis is the process by which plants convert sunlight into glucose.",
    "Python is a high-level programming language known for its readable syntax.",
    "The Pacific Ocean is the largest and deepest ocean on Earth.",
    "Shakespeare wrote Hamlet, Macbeth, and Romeo and Juliet."
]

# --- Ingest loop ---
# For each chunk: embed it, then store both the text and vector in Postgres.
for chunk in chunks:
    print(f"Embedding: '{chunk[:50]}...'")

    embedding = get_embedding(chunk)
    print(f"  Vector length: {len(embedding)}")   # should always be 768

    store_document(chunk, embedding)
    print(f"  Stored!")

print("\nDone! All chunks ingested.")