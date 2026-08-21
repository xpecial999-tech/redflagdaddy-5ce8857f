-- 1. Pin search_path on SECURITY DEFINER helpers
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';

-- 2. Revoke public/anon/authenticated EXECUTE on SECURITY DEFINER functions.
--    These are invoked by cron (postgres) and by internal triggers, never by clients.
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_expired_phone_otps() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_role_self_escalation() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_phone_otps() TO postgres, service_role;

-- 3. Block privilege / entitlement escalation on INSERT as well as UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_is_admin boolean := caller IS NOT NULL AND public.is_admin(caller);
BEGIN
  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- A self-created profile row can never arrive pre-entitled.
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

REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_role_self_escalation ON public.users;
DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.users;
CREATE TRIGGER prevent_profile_privilege_escalation
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();