-- 1. Enable RLS on user_roles (was disabled even though policies exist)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Tighten storage bucket SELECT policies (prevent broad listing).
-- Public buckets still serve files via CDN without RLS, so dropping these
-- policies does not break public image rendering.
DROP POLICY IF EXISTS "Public read member photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read payment proofs" ON storage.objects;

CREATE POLICY "Admins list member photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins list payment proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- 3. Revoke EXECUTE on internal SECURITY DEFINER functions (triggers/helpers
-- that should never be called over the API).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_raffle_payment_method() FROM anon, authenticated, public;

-- 4. Harden attach_raffle_payment_proof: require ownership proof (buyer phone)
-- so only the original buyer (or an admin) can attach a proof for a sale.
CREATE OR REPLACE FUNCTION public.attach_raffle_payment_proof(
  sale_id uuid,
  proof_url text,
  buyer_phone_input text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
  matched int;
BEGIN
  IF proof_url IS NULL OR length(proof_url) < 5 OR length(proof_url) > 1000 THEN
    RAISE EXCEPTION 'Invalid proof URL';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    is_admin := public.has_role(auth.uid(), 'admin');
  END IF;

  IF is_admin THEN
    UPDATE public.raffle_sales
      SET payment_proof_url = proof_url, updated_at = now()
    WHERE id = sale_id;
  ELSE
    IF buyer_phone_input IS NULL OR length(trim(buyer_phone_input)) < 6 THEN
      RAISE EXCEPTION 'Phone required to attach proof';
    END IF;
    UPDATE public.raffle_sales
      SET payment_proof_url = proof_url, updated_at = now()
    WHERE id = sale_id
      AND payment_proof_url IS NULL
      AND regexp_replace(buyer_phone, '\D', '', 'g')
          = regexp_replace(buyer_phone_input, '\D', '', 'g');
  END IF;

  GET DIAGNOSTICS matched = ROW_COUNT;
  IF matched = 0 THEN
    RAISE EXCEPTION 'Sale not found, already has proof, or phone does not match';
  END IF;
END;
$$;

-- Allow only the roles that actually need to call it
REVOKE EXECUTE ON FUNCTION public.attach_raffle_payment_proof(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.attach_raffle_payment_proof(uuid, text, text) TO anon, authenticated;

-- Drop the old 2-arg signature so clients use the new one
DROP FUNCTION IF EXISTS public.attach_raffle_payment_proof(uuid, text);

-- Same hardening for registrations attach_payment_proof: limit grants
REVOKE EXECUTE ON FUNCTION public.attach_payment_proof(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.attach_payment_proof(uuid, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_registration(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_registration(text, text, text) TO anon, authenticated;