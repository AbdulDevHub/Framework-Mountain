CREATE TABLE public.agent_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     uuid        REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  level      text        NOT NULL DEFAULT 'info',
  job_id     uuid        REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_logs_select_own"
  ON public.agent_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agent_logs_insert_own"
  ON public.agent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_logs_update_own"
  ON public.agent_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agent_logs_delete_own"
  ON public.agent_logs FOR DELETE
  USING (auth.uid() = user_id);
