CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  -- Trusted server-side contexts (service role / db owner) are unrestricted.
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF caller IS NOT NULL AND public.is_admin(caller) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_paid := false;
    NEW.paid_at := NULL;
    NEW.role := COALESCE(NEW.role, 'switch'::public.user_role);
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not authorized to change role';
  END IF;
  IF NEW.is_paid IS DISTINCT FROM OLD.is_paid OR NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
    RAISE EXCEPTION 'Not authorized to change subscription status';
  END IF;

  RETURN NEW;
END;
$$;