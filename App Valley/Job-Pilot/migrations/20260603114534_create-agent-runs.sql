CREATE TABLE public.agent_runs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status              text        NOT NULL DEFAULT 'running',
  job_title_searched  text,
  location_searched   text,
  jobs_found          integer     DEFAULT 0,
  started_at          timestamptz DEFAULT now(),
  completed_at        timestamptz
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_runs_select_own"
  ON public.agent_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agent_runs_insert_own"
  ON public.agent_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_runs_update_own"
  ON public.agent_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_runs_delete_own"
  ON public.agent_runs FOR DELETE
  USING (auth.uid() = user_id);
