-- Normalize any existing NULL statuses
UPDATE public.user_roles SET status = 'pending' WHERE status IS NULL;

-- Lock down the column
ALTER TABLE public.user_roles ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.user_roles ALTER COLUMN status SET NOT NULL;

-- Tighten self-signup: status MUST be exactly 'pending', not NULL
DROP POLICY IF EXISTS "Self pending signup" ON public.user_roles;
CREATE POLICY "Self pending signup"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'admin'::app_role
    AND status = 'pending'
  );

-- has_role: require explicit approved status (no NULL coalesce)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND status = 'approved'
      AND (
        role = _role
        OR (_role = 'admin'::app_role AND role = 'super_admin'::app_role)
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;