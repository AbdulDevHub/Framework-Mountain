import type { PrismaClient } from "@prisma/client";

export type MatchScores = { ftsScore: number; trigramScore: number };

// ─────────────────────────────────────────────
// Why raw SQL, when everything else uses Prisma's normal query builder
// ─────────────────────────────────────────────
// `ts_rank`, `to_tsvector`, `to_tsquery`, and `similarity()` are
// Postgres functions — there's no Prisma query-builder equivalent for
// "run this function and give me the result," so $queryRaw is the
// correct tool here, not a workaround. Values are still passed as
// tagged-template parameters (${resumeText}), which Prisma sends as
// separate bind parameters — NOT string-interpolated into the SQL text
// — so this is not a SQL-injection risk despite looking like a
// template literal.
//
// ─────────────────────────────────────────────
// How the two scores actually work
// ─────────────────────────────────────────────
// FTS (ftsScore): `to_tsvector('english', jobDescription)` breaks the
// posting into normalized word stems ("developing" -> "develop").
// `tsvector_to_array(...)` pulls those stems out as a plain array, and
// `array_to_string(..., ' | ')` joins them with tsquery's OR operator —
// so the resulting tsquery matches "any word from the job posting,"
// not "every word" (an AND-query built from a whole paragraph would
// essentially never match anything). `ts_rank` then scores the RESUME
// against that query — higher when more of the posting's terms appear
// in the resume, weighted by how prominent they are. This score is
// UNBOUNDED (no fixed max), per the schema's note.
//
// Trigram (trigramScore): `similarity()` is pg_trgm's function —
// breaks both strings into overlapping 3-character sequences and
// scores what fraction overlap. Bounded 0-1. Catches near-matches FTS
// misses (typos, unstemmed variants) but doesn't understand word
// boundaries or meaning the way FTS does — the two scores are
// deliberately kept separate rather than blended, since they measure
// different kinds of similarity on different scales.
//
// COALESCE(..., 0) guards the edge case of an empty/whitespace-only
// description or resume: to_tsquery('') and similarity('', x) both
// resolve safely without erroring, but wrapping in COALESCE is cheap
// insurance against a NULL ever reaching a non-nullable Float column.
export async function computeMatchScores(
  prisma: PrismaClient,
  resumeText: string,
  jobDescription: string,
): Promise<MatchScores> {
  const rows = await prisma.$queryRaw<MatchScores[]>`
    SELECT
      COALESCE(
        ts_rank(
          to_tsvector('english', ${resumeText}),
          to_tsquery('english', array_to_string(tsvector_to_array(to_tsvector('english', ${jobDescription})), ' | '))
        ),
        0
      )::float8 AS "ftsScore",
      COALESCE(similarity(${resumeText}, ${jobDescription}), 0)::float8 AS "trigramScore"
  `;

  return rows[0];
}
