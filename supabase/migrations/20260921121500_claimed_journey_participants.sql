-- A journey is owned by its initiator, but the invited respondent may also
-- save their completed side to a separate account. Keep those relationships
-- distinct so claiming access never overwrites the initiator.

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS participant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_journeys_participant_user
  ON public.journeys(participant_user_id)
  WHERE participant_user_id IS NOT NULL;

DROP POLICY IF EXISTS "Participants read claimed journeys" ON public.journeys;
CREATE POLICY "Participants read claimed journeys"
ON public.journeys FOR SELECT TO authenticated
USING (auth.uid() = participant_user_id);

DROP POLICY IF EXISTS "Participants read claimed invites" ON public.invites;
CREATE POLICY "Participants read claimed invites"
ON public.invites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.participant_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants read claimed results" ON public.results;
CREATE POLICY "Participants read claimed results"
ON public.results FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.participant_user_id = auth.uid()
  )
);

COMMENT ON COLUMN public.journeys.participant_user_id IS
  'Account that claimed the invited respondent side after completion; distinct from creator_id.';
