-- Enable RLS on the InsForge storage objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS policies for the resumes bucket.
-- Path format: {user_id}/resume.pdf  or  {user_id}/{job_id}-tailored.pdf
-- Users may only access files where the first path segment matches their user_id.

CREATE POLICY "resumes_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket = 'resumes'
    AND auth.uid()::text = (string_to_array(key, '/'))[1]
  );

CREATE POLICY "resumes_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket = 'resumes'
    AND auth.uid()::text = (string_to_array(key, '/'))[1]
  );

CREATE POLICY "resumes_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket = 'resumes'
    AND auth.uid()::text = (string_to_array(key, '/'))[1]
  );

CREATE POLICY "resumes_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket = 'resumes'
    AND auth.uid()::text = (string_to_array(key, '/'))[1]
  );
