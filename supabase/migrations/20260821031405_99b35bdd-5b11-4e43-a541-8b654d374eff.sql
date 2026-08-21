ALTER TABLE public.phone_otps
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

CREATE INDEX IF NOT EXISTS phone_otps_ip_hash_created_at_idx ON public.phone_otps (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS phone_otps_phone_created_at_idx ON public.phone_otps (phone, created_at DESC);