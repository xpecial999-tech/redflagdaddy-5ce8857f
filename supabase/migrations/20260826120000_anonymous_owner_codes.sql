ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS anonymous_no_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_owner_code_hash text,
  ADD COLUMN IF NOT EXISTS anonymous_owner_expires_at timestamptz;

ALTER TABLE public.journeys
  DROP CONSTRAINT IF EXISTS journeys_anonymous_owner_code_check,
  ADD CONSTRAINT journeys_anonymous_owner_code_check CHECK (
    (
      anonymous_no_contact = false
      AND anonymous_owner_code_hash IS NULL
      AND anonymous_owner_expires_at IS NULL
    )
    OR
    (
      anonymous_no_contact = true
      AND creator_id IS NULL
      AND guest_phone IS NULL
      AND anonymous_owner_code_hash ~ '^[0-9a-f]{64}$'
      AND anonymous_owner_expires_at IS NOT NULL
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS journeys_anonymous_owner_code_hash_idx
  ON public.journeys (anonymous_owner_code_hash)
  WHERE anonymous_owner_code_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.delete_expired_anonymous_journeys()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM public.journeys
  WHERE anonymous_no_contact = true
    AND anonymous_owner_expires_at <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_expired_anonymous_journeys() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_anonymous_journeys() TO service_role;

-- Supabase provides pg_cron. This keeps expired journeys out of storage even
-- when nobody returns to the site; application reads also enforce expiry.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

DO $block$
DECLARE
  existing_job bigint;
BEGIN
  SELECT jobid INTO existing_job
  FROM cron.job
  WHERE jobname = 'delete-expired-anonymous-journeys';

  IF existing_job IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job);
  END IF;

  PERFORM cron.schedule(
    'delete-expired-anonymous-journeys',
    '17 * * * *',
    'SELECT public.delete_expired_anonymous_journeys()'
  );
END;
$block$;
