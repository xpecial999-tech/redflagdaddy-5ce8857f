-- A guest can voluntarily turn a no-contact journey into an account-owned one.
-- The existing owner code is the proof of possession; its hash is cleared as
-- part of the same update so it cannot remain a second access path.

CREATE OR REPLACE FUNCTION public.claim_anonymous_journey(
  p_owner_code_hash text,
  p_owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  claimed_id uuid;
BEGIN
  UPDATE public.journeys
  SET
    creator_id = p_owner_id,
    anonymous_no_contact = false,
    anonymous_owner_code_hash = NULL,
    anonymous_owner_expires_at = NULL,
    updated_at = now()
  WHERE anonymous_no_contact = true
    AND creator_id IS NULL
    AND anonymous_owner_code_hash = p_owner_code_hash
    AND anonymous_owner_expires_at > now()
  RETURNING id INTO claimed_id;

  RETURN claimed_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_anonymous_journey(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_anonymous_journey(text, uuid) TO service_role;
