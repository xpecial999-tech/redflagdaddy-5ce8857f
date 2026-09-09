-- Explicitly link an owner's self-assessment to the partner journey it belongs to.

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS pair_id uuid,
  ADD COLUMN IF NOT EXISTS pair_side text;

ALTER TABLE public.journeys
  DROP CONSTRAINT IF EXISTS journeys_pair_side_check,
  ADD CONSTRAINT journeys_pair_side_check CHECK (
    pair_side IS NULL OR pair_side IN ('owner', 'partner')
  );

CREATE TABLE IF NOT EXISTS public.journey_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  partner_journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  label text,
  both_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_journey_id, partner_journey_id),
  CONSTRAINT journey_pairs_distinct_journeys CHECK (owner_journey_id <> partner_journey_id)
);

CREATE INDEX IF NOT EXISTS idx_journey_pairs_owner ON public.journey_pairs(owner_id);
CREATE INDEX IF NOT EXISTS idx_journey_pairs_owner_journey ON public.journey_pairs(owner_journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_pairs_partner_journey ON public.journey_pairs(partner_journey_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_journeys_pair_owner_side
  ON public.journeys(pair_id, pair_side)
  WHERE pair_id IS NOT NULL AND pair_side IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journeys_pair_id_fkey'
  ) THEN
    ALTER TABLE public.journeys
      ADD CONSTRAINT journeys_pair_id_fkey
      FOREIGN KEY (pair_id) REFERENCES public.journey_pairs(id) ON DELETE SET NULL;
  END IF;
END $$;

GRANT SELECT ON public.journey_pairs TO authenticated;
GRANT ALL ON public.journey_pairs TO service_role;
ALTER TABLE public.journey_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read journey pairs" ON public.journey_pairs;
CREATE POLICY "Owners read journey pairs" ON public.journey_pairs
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.journeys j
    WHERE (j.id = owner_journey_id OR j.id = partner_journey_id)
      AND j.creator_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS trg_journey_pairs_updated_at ON public.journey_pairs;
CREATE TRIGGER trg_journey_pairs_updated_at
BEFORE UPDATE ON public.journey_pairs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
