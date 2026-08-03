-- Run these by hand (psql, or any GUI client) once you have a
-- reasonable amount of seed data — a handful of rows won't be enough
-- for Postgres's query planner to bother using an index; it'll just
-- sequential-scan a 5-row table because that's genuinely faster than
-- index overhead at that size. Seed at least a few hundred JobPosting
-- rows for a meaningful test. (`prisma db seed` with a loop, or any
-- quick script, works — ask if you want one written.)
--
-- WHY THESE QUERIES, not a query on `similarity()`/`ts_rank()` filtering:
-- match.compute/computeBatch/getLatest/getHistory all operate on
-- specific, already-known ids — never "search all postings for
-- similar text." So the queries worth checking are the ownership
-- lookups these procedures actually run, not a full-text/trigram
-- search that no procedure performs (see the code comments in
-- lib/matching.ts for when that WOULD become relevant).

-- ─────────────────────────────────────────────
-- 1. compute()'s ownership-scoped lookups
-- ─────────────────────────────────────────────
-- Expect: "Index Scan using JobPosting_pkey" (id is a primary key —
-- always indexed automatically) with a Filter on userId, OR an Index
-- Scan on the @@index([userId]) index if the planner prefers filtering
-- by userId first. Either is correct; what you're checking for is the
-- ABSENCE of "Seq Scan" on a table with meaningful row count.
EXPLAIN ANALYZE
SELECT text, "updatedAt" FROM "Resume"
WHERE id = 'some-real-resume-id' AND "userId" = 'some-real-user-id';

EXPLAIN ANALYZE
SELECT description, "updatedAt" FROM "JobPosting"
WHERE id = 'some-real-posting-id' AND "userId" = 'some-real-user-id';

-- ─────────────────────────────────────────────
-- 2. computeBatch()'s multi-id ownership lookup
-- ─────────────────────────────────────────────
-- Expect: "Index Scan" (or "Bitmap Index Scan" for larger IN lists)
-- using the primary key, since Postgres can use a btree index
-- efficiently for an IN (...) list, not just single equality.
EXPLAIN ANALYZE
SELECT id, description, "updatedAt" FROM "JobPosting"
WHERE id IN ('id-1', 'id-2', 'id-3') AND "userId" = 'some-real-user-id';

-- ─────────────────────────────────────────────
-- 3. getHistory()'s MatchResult lookup
-- ─────────────────────────────────────────────
-- Expect: this one should specifically use the compound index declared
-- in schema.prisma — @@index([resumeId, jobPostingId, computedAt]) —
-- since the query filters on the first two columns and sorts by the
-- third, which is exactly what that index was shaped for.
EXPLAIN ANALYZE
SELECT * FROM "MatchResult"
WHERE "resumeId" = 'some-real-resume-id' AND "jobPostingId" = 'some-real-posting-id'
ORDER BY "computedAt" DESC;

-- ─────────────────────────────────────────────
-- If you ever add a "browse similar postings" feature (NOT currently
-- part of the 11 flows) — THIS is the kind of query that would
-- actually need a GIN index, because it filters/ranks across every
-- row instead of a known id:
--
--   SELECT id, similarity(description, 'some resume text') AS score
--   FROM "JobPosting"
--   WHERE description % 'some resume text'   -- pg_trgm's "is similar" operator
--   ORDER BY score DESC LIMIT 10;
--
-- Without an index, that's a sequential scan computing similarity()
-- against every row. With one:
--   CREATE INDEX job_posting_description_trgm_idx
--     ON "JobPosting" USING gin (description gin_trgm_ops);
-- ...the `%` operator can use the index to skip most rows entirely.
-- Not added now because nothing calls this query yet — added the day
-- you build that feature, not before.
