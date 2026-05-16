
-- ============================================================
-- 1. GOODWILL MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goodwill_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name text NOT NULL,
  sender_role text,
  message text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goodwill_status_chk CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT goodwill_name_len CHECK (length(sender_name) BETWEEN 2 AND 120),
  CONSTRAINT goodwill_role_len CHECK (sender_role IS NULL OR length(sender_role) <= 160),
  CONSTRAINT goodwill_msg_len CHECK (length(message) BETWEEN 5 AND 2000),
  CONSTRAINT goodwill_photo_len CHECK (photo_url IS NULL OR length(photo_url) <= 1000)
);

ALTER TABLE public.goodwill_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved goodwill"
  ON public.goodwill_messages FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Anyone can submit goodwill"
  ON public.goodwill_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Admins view all goodwill"
  ON public.goodwill_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update goodwill"
  ON public.goodwill_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete goodwill"
  ON public.goodwill_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_goodwill_updated_at
  BEFORE UPDATE ON public.goodwill_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Goodwill photos bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('goodwill-photos','goodwill-photos', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read goodwill photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'goodwill-photos');

CREATE POLICY "Anyone upload goodwill photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'goodwill-photos');

CREATE POLICY "Admins manage goodwill photos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'goodwill-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'goodwill-photos' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. REMOVE OPEN ADMIN SELF-SIGNUP
-- ============================================================
DROP POLICY IF EXISTS "Self pending signup" ON public.user_roles;

-- ============================================================
-- 3. MAKE payment-proofs BUCKET PRIVATE
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

-- Admin read for payment-proofs (signed URLs)
DROP POLICY IF EXISTS "Admins read payment proofs" ON storage.objects;
CREATE POLICY "Admins read payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. TIGHTEN SECURITY DEFINER FUNCTION GRANTS
-- ============================================================
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.attach_payment_proof(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_payment_proof(uuid, text) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.attach_raffle_payment_proof(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_raffle_payment_proof(uuid, text, text) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.lookup_registration(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_registration(text, text, text) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_raffle_payment_method() FROM PUBLIC;
