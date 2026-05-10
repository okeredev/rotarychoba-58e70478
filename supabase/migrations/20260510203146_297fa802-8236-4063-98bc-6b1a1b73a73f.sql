-- 1. Raffle: payment method + proof url
ALTER TABLE public.raffle_sales
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pay_at_venue',
  ADD COLUMN IF NOT EXISTS payment_proof_url text;

-- Tighten payment_method values via trigger (CHECK constraints disallowed for some immutability rules; use trigger)
CREATE OR REPLACE FUNCTION public.validate_raffle_payment_method()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_method NOT IN ('pay_now','pay_at_venue') THEN
    RAISE EXCEPTION 'Invalid payment_method: %', NEW.payment_method;
  END IF;
  IF NEW.payment_proof_url IS NOT NULL AND length(NEW.payment_proof_url) > 1000 THEN
    RAISE EXCEPTION 'payment_proof_url too long';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_raffle_payment_method ON public.raffle_sales;
CREATE TRIGGER trg_validate_raffle_payment_method
  BEFORE INSERT OR UPDATE ON public.raffle_sales
  FOR EACH ROW EXECUTE FUNCTION public.validate_raffle_payment_method();

-- 2. RPC: attach payment proof to raffle sale (anyone can attach if proof not yet set)
CREATE OR REPLACE FUNCTION public.attach_raffle_payment_proof(sale_id uuid, proof_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF proof_url IS NULL OR length(proof_url) < 5 OR length(proof_url) > 1000 THEN
    RAISE EXCEPTION 'Invalid proof URL';
  END IF;
  UPDATE public.raffle_sales
    SET payment_proof_url = proof_url,
        updated_at = now()
  WHERE id = sale_id
    AND payment_proof_url IS NULL;
END;
$$;

-- 3. Allow admins to manage user_roles
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
CREATE POLICY "Admins insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
CREATE POLICY "Admins delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));