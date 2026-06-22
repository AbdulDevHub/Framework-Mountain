"""
rag.py — Full RAG pipeline: Retrieval + Generation

This is the complete loop:
  1. User asks a question
  2. Question is embedded into a vector
  3. Most relevant stored chunks are retrieved via similarity search
  4. Those chunks are injected into an LLM prompt as context
  5. The LLM answers using only that context (no hallucination from training data)

The key insight: instead of sending the whole document to the LLM (expensive,
slow, often too long to fit), we only send the relevant pieces.
"""

import requests
import psycopg2

# --- Config ---

# Base URL for Ollama's local API server.
# Different endpoints handle embeddings vs. text generation (see below).
OLLAMA_URL = "http://localhost:11434"

DB_CONN = "host=localhost port=5432 dbname=postgres user=postgres password=postgres"

# The LLM used to generate the final answer.
# Must be a model you've already pulled with `ollama pull <model>`.
# Swap this out for any other model you have locally.
LLM_MODEL = "qwen2.5-coder:7b"


def get_embedding(text: str) -> list[float]:
    """
    Convert text into a 768-dimensional vector using the embedding model.

    This is called twice per question:
      - Once for the user's question (in retrieve())
      - The documents were already embedded during ingest.py

    Always uses 'nomic-embed-text' — must match what was used at ingest time.
    """
    response = requests.post(f"{OLLAMA_URL}/api/embeddings", json={
        "model": "nomic-embed-text",
        "prompt": text
    })
    return response.json()["embedding"]


def retrieve(question: str, top_k: int = 2) -> list[tuple]:
    """
    Find the top_k most relevant chunks for the given question.

    Uses pgvector's '<=>' cosine distance operator to rank all stored
    documents by how similar they are to the question vector.

    Returns a list of (content, similarity_score) tuples, best first.
    top_k=2 keeps the prompt short; raise it if your documents are fragmented.
    """
    embedding = get_embedding(question)

    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    cur.execute("""
        SELECT content, 1 - (embedding <=> %s::vector) AS similarity
        FROM documents
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (str(embedding), str(embedding), top_k))

    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


def answer(question: str) -> str:
    """
    The full RAG pipeline in one function:
      retrieve relevant chunks → build a prompt → call the LLM → return answer.

    The prompt instructs the LLM to answer *only* from the provided context.
    The "I don't know" instruction is important — without it, LLMs will
    confidently make up answers using their training data instead of admitting
    the context doesn't cover the question.
    """
    results = retrieve(question)

    # Build a bulleted context block from the retrieved chunks.
    # Each bullet is one stored document that was deemed relevant.
    context = "\n".join(f"- {content}" for content, _ in results)

    # The prompt is the core of RAG. Structure:
    #   1. Instruction (only use context, say "I don't know" if unsure)
    #   2. The retrieved context chunks
    #   3. The user's question
    # Keeping the instruction both at the top helps models follow it reliably.
    prompt = f"""Answer the question using only the context below.
If the answer isn't in the context, say "I don't know".

Context:
{context}

Question: {question}
Answer:"""

    # Call Ollama's generate endpoint (different from /api/embeddings).
    # stream=False means we wait for the full response before returning.
    response = requests.post(f"{OLLAMA_URL}/api/generate", json={
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False
    })

    return response.json()["response"].strip()


# --- Ask away ---
questions = [
    "Where is the Eiffel Tower?",       # directly in our documents
    "How do plants make food?",          # in our documents, different wording
    "Who wrote Macbeth?",                # in our documents
    "What is the capital of Japan?",     # NOT in our documents — should say "I don't know"
]

for question in questions:
    print(f"Q: {question}")
    print(f"A: {answer(question)}")
    print()