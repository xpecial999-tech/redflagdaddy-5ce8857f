
-- admin_users: split ALL policy into explicit per-command policies
DROP POLICY IF EXISTS "Admins manage admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins read admin list" ON public.admin_users;

CREATE POLICY "Admins select admin list" ON public.admin_users
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert admin list" ON public.admin_users
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update admin list" ON public.admin_users
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete admin list" ON public.admin_users
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- responses: explicit deny for direct client writes (writes go through server functions using service role)
CREATE POLICY "No direct client inserts on responses" ON public.responses
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);

CREATE POLICY "No direct client updates on responses" ON public.responses
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

-- results: explicit deny for direct client writes (writes go through server functions using service role)
CREATE POLICY "No direct client inserts on results" ON public.results
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);

CREATE POLICY "No direct client updates on results" ON public.results
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

CREATE POLICY "No direct client deletes on results" ON public.results
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);
