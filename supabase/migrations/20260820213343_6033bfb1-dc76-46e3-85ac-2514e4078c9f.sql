CREATE TABLE public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
  attempts integer NOT NULL DEFAULT 0,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_otps_phone_created ON public.phone_otps(phone, created_at DESC);
CREATE INDEX idx_phone_otps_expires ON public.phone_otps(expires_at);

GRANT ALL ON public.phone_otps TO service_role;

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No direct client access; server functions use supabaseAdmin (service role) which bypasses RLS.
CREATE POLICY "Deny all direct access" ON public.phone_otps
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.update_phone_otps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_phone_otps_updated_at
  BEFORE UPDATE ON public.phone_otps
  FOR EACH ROW EXECUTE FUNCTION public.update_phone_otps_updated_at();

-- Cleanup expired OTPs periodically via a simple delete trigger helper function.
CREATE OR REPLACE FUNCTION public.cleanup_expired_phone_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.phone_otps WHERE expires_at < now() OR used = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_phone_otps() TO service_role;