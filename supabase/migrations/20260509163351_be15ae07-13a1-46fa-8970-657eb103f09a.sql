
-- 1. SPONSORSHIPS
CREATE TYPE public.sponsorship_status AS ENUM ('new','contacted','confirmed','declined');

CREATE TABLE public.sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company text,
  amount integer,
  message text,
  contact_email text,
  contact_phone text,
  logo_path text,
  brochure_path text,
  status public.sponsorship_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit sponsorship" ON public.sponsorships
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(full_name,'')) BETWEEN 2 AND 200
    AND length(coalesce(message,'')) <= 2000
    AND coalesce(amount, 0) BETWEEN 0 AND 100000000
  );
CREATE POLICY "Admins view sponsorships" ON public.sponsorships FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update sponsorships" ON public.sponsorships FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete sponsorships" ON public.sponsorships FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER sponsorships_updated BEFORE UPDATE ON public.sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. AWARDS
CREATE TABLE public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  citation text,
  photo_url text,
  year integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view awards" ON public.awards FOR SELECT USING (true);
CREATE POLICY "Admins insert awards" ON public.awards FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update awards" ON public.awards FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete awards" ON public.awards FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER awards_updated BEFORE UPDATE ON public.awards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. RAFFLE
CREATE TYPE public.raffle_pack AS ENUM ('single','pack20');

CREATE TABLE public.raffle_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text,
  pack public.raffle_pack NOT NULL DEFAULT 'single',
  qty integer NOT NULL DEFAULT 1,
  amount integer NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.raffle_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can buy raffle" ON public.raffle_sales
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(buyer_name,'')) BETWEEN 2 AND 120
    AND length(coalesce(buyer_phone,'')) BETWEEN 6 AND 30
    AND qty BETWEEN 1 AND 1000
    AND amount BETWEEN 500 AND 5000000
  );
CREATE POLICY "Admins view raffle" ON public.raffle_sales FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update raffle" ON public.raffle_sales FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete raffle" ON public.raffle_sales FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER raffle_sales_updated BEFORE UPDATE ON public.raffle_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. REGISTRATIONS - email optional + relax check
ALTER TABLE public.registrations ALTER COLUMN email DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
CREATE POLICY "Anyone can register" ON public.registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(full_name, '')) BETWEEN 2 AND 120
    AND (email IS NULL OR length(email) BETWEEN 5 AND 200)
    AND length(coalesce(phone, '')) BETWEEN 6 AND 30
    AND amount = ANY (ARRAY[10000, 20000, 50000])
    AND coalesce(guests_count, 0) BETWEEN 0 AND 20
    AND payment_method = ANY (ARRAY['pay_now', 'pay_at_venue'])
  );

-- 5. New lookup RPC: phone-only OR ref+email OR ref+phone
DROP FUNCTION IF EXISTS public.lookup_registration(text, text);

CREATE OR REPLACE FUNCTION public.lookup_registration(
  ref text DEFAULT NULL,
  phone_input text DEFAULT NULL,
  email_input text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, full_name text, title text, email text, phone text,
  tier text, amount integer, guests_count integer,
  payment_method text, payment_status text,
  payment_proof_url text, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  has_ref boolean := ref IS NOT NULL AND length(trim(ref)) >= 4;
  has_phone boolean := phone_input IS NOT NULL AND length(trim(phone_input)) >= 6;
  has_email boolean := email_input IS NOT NULL AND length(trim(email_input)) >= 5;
BEGIN
  IF NOT (has_ref OR has_phone) THEN
    RAISE EXCEPTION 'Provide a reference or a phone number';
  END IF;

  RETURN QUERY
  SELECT r.id, r.full_name, r.title, r.email, r.phone,
         r.tier::text, r.amount, r.guests_count,
         r.payment_method, r.payment_status::text,
         r.payment_proof_url, r.created_at
  FROM public.registrations r
  WHERE
    (has_ref AND upper(substring(r.id::text, 1, 8)) = upper(trim(ref))
      AND (
        (has_email AND lower(r.email) = lower(trim(email_input)))
        OR (has_phone AND regexp_replace(r.phone, '\D', '', 'g') = regexp_replace(trim(phone_input), '\D', '', 'g'))
        OR (NOT has_email AND NOT has_phone)
      )
    )
    OR
    (NOT has_ref AND has_phone
      AND regexp_replace(r.phone, '\D', '', 'g') = regexp_replace(trim(phone_input), '\D', '', 'g')
      AND (NOT has_email OR lower(coalesce(r.email,'')) = lower(trim(email_input)))
    )
  ORDER BY r.created_at DESC
  LIMIT 5;
END;
$$;

-- 6. Storage bucket for sponsor files (PRIVATE)
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsor-files', 'sponsor-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload sponsor files" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'sponsor-files');

CREATE POLICY "Admins view sponsor files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'sponsor-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete sponsor files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'sponsor-files' AND has_role(auth.uid(), 'admin'));
