-- A journey is owned by its initiator, but the invited respondent may also
-- save their completed side to a separate account. Keep those relationships
-- distinct so claiming access never overwrites the initiator.

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS participant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_journeys_participant_user
  ON public.journeys(participant_user_id)
  WHERE participant_user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND policyname = 'Participants read claimed journeys'
  ) THEN
    CREATE POLICY "Participants read claimed journeys"
    ON public.journeys FOR SELECT TO authenticated
    USING (auth.uid() = participant_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invites'
      AND policyname = 'Participants read claimed invites'
  ) THEN
    CREATE POLICY "Participants read claimed invites"
    ON public.invites FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.journeys j
        WHERE j.id = journey_id AND j.participant_user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'results'
      AND policyname = 'Participants read claimed results'
  ) THEN
    CREATE POLICY "Participants read claimed results"
    ON public.results FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.journeys j
        WHERE j.id = journey_id AND j.participant_user_id = auth.uid()
      )
    );
  END IF;
END
$$;

COMMENT ON COLUMN public.journeys.participant_user_id IS
  'Account that claimed the invited respondent side after completion; distinct from creator_id.';
