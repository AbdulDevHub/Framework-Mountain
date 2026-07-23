CREATE TABLE public.jobs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id               uuid        REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  user_id              uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source               text        NOT NULL,
  source_url           text,
  external_apply_url   text,
  title                text,
  company              text,
  location             text,
  salary               text,
  job_type             text,
  about_role           text,
  responsibilities     text[]      DEFAULT '{}',
  requirements         text[]      DEFAULT '{}',
  nice_to_have         text[]      DEFAULT '{}',
  benefits             text[]      DEFAULT '{}',
  about_company        text,
  match_score          integer,
  match_reason         text,
  matched_skills       text[]      DEFAULT '{}',
  missing_skills       text[]      DEFAULT '{}',
  cover_letter         text,
  tailored_resume_url  text,
  tailored_match_score integer,
  is_tailored          boolean     DEFAULT false,
  found_at             timestamptz DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_own"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert_own"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update_own"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_delete_own"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);
