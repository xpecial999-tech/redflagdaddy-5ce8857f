
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS results_share_token_idx ON public.results(share_token) WHERE share_token IS NOT NULL;

-- Allow anonymous reads ONLY when sharing is enabled and a token is present.
GRANT SELECT ON public.results TO anon;

DROP POLICY IF EXISTS "Public can read shared results" ON public.results;
CREATE POLICY "Public can read shared results"
  ON public.results
  FOR SELECT
  TO anon, authenticated
  USING (share_enabled = true AND share_token IS NOT NULL);
