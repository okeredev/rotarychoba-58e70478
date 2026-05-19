
-- Goodwill: add document URL + event year for past-event backfill
ALTER TABLE public.goodwill_messages
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS event_year integer;

-- Storage bucket for optional supporting documents (PDF / DOC)
INSERT INTO storage.buckets (id, name, public)
VALUES ('goodwill-documents', 'goodwill-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Public read, anyone can upload, admins manage
DO $$ BEGIN
  CREATE POLICY "Public read goodwill documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'goodwill-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can upload goodwill documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'goodwill-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins update goodwill documents"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'goodwill-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins delete goodwill documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'goodwill-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND actor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);

-- Allow admins to insert goodwill at any status (for backfill of past events)
DROP POLICY IF EXISTS "Admins insert goodwill" ON public.goodwill_messages;
CREATE POLICY "Admins insert goodwill"
  ON public.goodwill_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
