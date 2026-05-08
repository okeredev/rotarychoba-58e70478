-- 1. Settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins write settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins update settings" ON public.app_settings;

CREATE POLICY "Public read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins write settings" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update settings" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (key, value) VALUES
  ('bank_name', 'Zenith Bank'),
  ('account_name', 'Rotary Club of Choba-Uniport'),
  ('account_number', '0000000000')
ON CONFLICT (key) DO NOTHING;

-- 2. Payment method on registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pay_at_venue';

-- 3. Replace insert policy with a simpler, more reliable one
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

CREATE POLICY "Anyone can register" ON public.registrations
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(coalesce(full_name,'')) BETWEEN 2 AND 120
  AND length(coalesce(email,'')) BETWEEN 5 AND 200
  AND length(coalesce(phone,'')) BETWEEN 6 AND 30
  AND amount = ANY (ARRAY[10000, 20000, 50000])
  AND coalesce(guests_count, 0) BETWEEN 0 AND 20
  AND payment_method IN ('pay_now','pay_at_venue')
);