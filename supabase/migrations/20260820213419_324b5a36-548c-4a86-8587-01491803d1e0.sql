REVOKE EXECUTE ON FUNCTION public.cleanup_expired_phone_otps() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_phone_otps() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_phone_otps() FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_phone_otps() TO service_role;