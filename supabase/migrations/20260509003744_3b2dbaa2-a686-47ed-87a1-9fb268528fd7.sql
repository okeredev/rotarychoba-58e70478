CREATE OR REPLACE FUNCTION public.lookup_registration(ref text, email_input text)
RETURNS TABLE (
  id uuid,
  full_name text,
  title text,
  email text,
  phone text,
  tier text,
  amount integer,
  guests_count integer,
  payment_method text,
  payment_status text,
  payment_proof_url text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ref IS NULL OR length(ref) < 4 OR email_input IS NULL OR length(email_input) < 5 THEN
    RAISE EXCEPTION 'Invalid lookup parameters';
  END IF;
  RETURN QUERY
  SELECT r.id, r.full_name, r.title, r.email, r.phone,
         r.tier::text, r.amount, r.guests_count,
         r.payment_method, r.payment_status::text,
         r.payment_proof_url, r.created_at
  FROM public.registrations r
  WHERE upper(substring(r.id::text, 1, 8)) = upper(ref)
    AND lower(r.email) = lower(email_input)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_registration(text, text) TO anon, authenticated;