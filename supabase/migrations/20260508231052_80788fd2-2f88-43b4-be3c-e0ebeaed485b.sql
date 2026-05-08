ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS rotary_club text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS guests_count integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

CREATE POLICY "Anyone can register" ON public.registrations
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(full_name) BETWEEN 2 AND 120
  AND length(email) BETWEEN 5 AND 200
  AND length(phone) BETWEEN 6 AND 30
  AND amount = ANY (ARRAY[10000, 20000, 50000])
  AND (title IS NULL OR length(title) <= 20)
  AND (position IS NULL OR length(position) <= 120)
  AND (rotary_club IS NULL OR length(rotary_club) <= 160)
  AND (address IS NULL OR length(address) <= 300)
  AND guests_count BETWEEN 0 AND 20
);