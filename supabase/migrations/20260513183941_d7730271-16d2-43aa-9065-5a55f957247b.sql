
-- 1) Stricter has_role: must be approved; super_admin satisfies admin checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND COALESCE(status, 'approved') = 'approved'
      AND (
        role = _role
        OR (_role = 'admin'::app_role AND role = 'super_admin'::app_role)
      )
  )
$$;

-- 2) Self-signup: allow an authenticated user to create their own PENDING admin request
DROP POLICY IF EXISTS "Self pending signup" ON public.user_roles;
CREATE POLICY "Self pending signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::app_role
  AND COALESCE(status, 'pending') = 'pending'
);

-- 3) Allow approved admins (incl. super_admin via updated has_role) to UPDATE roles
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
CREATE POLICY "Admins update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
