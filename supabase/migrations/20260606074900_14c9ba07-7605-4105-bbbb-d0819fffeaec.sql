DROP POLICY IF EXISTS "Admins select admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins insert admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins update admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins delete admin list" ON public.admin_users;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id = auth.uid(), false)
    AND EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE user_id = auth.uid()
    )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

CREATE POLICY "Users can read own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);