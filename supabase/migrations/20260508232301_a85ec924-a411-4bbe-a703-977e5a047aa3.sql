
-- Column for payment proof URL
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_proof_url text;

-- Storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read payment proofs" ON storage.objects;
CREATE POLICY "Public read payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Safe helper: attach payment proof exactly once
CREATE OR REPLACE FUNCTION public.attach_payment_proof(reg_id uuid, proof_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF proof_url IS NULL OR length(proof_url) < 5 OR length(proof_url) > 1000 THEN
    RAISE EXCEPTION 'Invalid proof URL';
  END IF;
  UPDATE public.registrations
    SET payment_proof_url = proof_url,
        updated_at = now()
  WHERE id = reg_id
    AND payment_proof_url IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_payment_proof(uuid, text) TO anon, authenticated;
