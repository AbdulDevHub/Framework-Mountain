"""
query.py — Phase 2 of the RAG pipeline: Retrieval (without LLM)

This script lets you search the stored embeddings by meaning, not keywords.
You give it a question, it embeds that question the same way the documents
were embedded, then finds the stored chunks whose vectors are closest.

Useful for inspecting what your retrieval is actually finding before
wiring up an LLM on top (that's what rag.py does).
"""

import requests
import psycopg2

# --- Config ---

# Note: the base URL only — each function appends its own endpoint path.
OLLAMA_URL = "http://localhost:11434/api/embeddings"

DB_CONN = "host=localhost port=5432 dbname=postgres user=postgres password=postgres"


def get_embedding(text: str) -> list[float]:
    """
    Convert text into a 768-dimensional embedding vector via Ollama.

    Critical: we must use the *same model* here as we did in ingest.py.
    Different models produce vectors in different "spaces" — mixing them
    would make similarity scores meaningless.
    """
    response = requests.post(OLLAMA_URL, json={
        "model": "nomic-embed-text",
        "prompt": text
    })
    return response.json()["embedding"]


def search(question: str, top_k: int = 3):
    """
    Find the top_k most semantically similar chunks to the given question.

    How it works:
      1. Embed the question into a vector.
      2. Run a SQL query that computes the distance between the question
         vector and every stored document vector.
      3. Return the closest ones (smallest distance = most similar).

    The SQL operator '<=>' is provided by pgvector and computes
    *cosine distance* between two vectors (a value between 0 and 2,
    where 0 = identical direction, 2 = opposite direction).

    We convert distance to similarity with: similarity = 1 - distance
    So similarity ranges from -1 to 1, where 1 = perfect match.
    """
    embedding = get_embedding(question)

    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()

    cur.execute("""
        SELECT content, 1 - (embedding <=> %s::vector) AS similarity
        FROM documents
        ORDER BY embedding <=> %s::vector   -- smallest distance first
        LIMIT %s
    """, (str(embedding), str(embedding), top_k))
    # We pass the embedding twice: once for the SELECT (to show similarity score),
    # once for the ORDER BY (to sort by distance). They must be identical.

    results = cur.fetchall()    # list of (content, similarity) tuples
    cur.close()
    conn.close()
    return results


# --- Test queries ---
# These use different wording than the stored chunks on purpose —
# semantic search works on meaning, not exact keywords.
questions = [
    "Where is the Eiffel Tower?",
    "How do plants make food?",
    "Who wrote Macbeth?",
]

for question in questions:
    print(f"\nQuestion: {question}")
    print("Top matches:")
    for content, similarity in search(question, top_k=2):
        # Similarity closer to 1.0 = stronger match
        print(f"  [{similarity:.3f}] {content}")