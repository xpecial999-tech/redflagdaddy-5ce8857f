-- Freeze each journey's randomized question set so it remains stable when the
-- bank changes and can be reused exactly by the other side of a paired journey.

ALTER TABLE public.journeys
  ADD COLUMN IF NOT EXISTS assigned_question_ids uuid[];

COMMENT ON COLUMN public.journeys.assigned_question_ids IS
  'Ordered question IDs assigned on first assessment load; paired journeys share this exact set.';
