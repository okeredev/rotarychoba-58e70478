
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY "Anyone can register" ON public.registrations;
CREATE POLICY "Anyone can register" ON public.registrations FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(full_name) BETWEEN 2 AND 120
    AND length(email) BETWEEN 5 AND 200
    AND length(phone) BETWEEN 6 AND 30
    AND amount IN (10000, 20000, 50000)
  );
