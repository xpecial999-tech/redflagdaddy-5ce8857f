ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS applies_to text[] NOT NULL DEFAULT ARRAY['Dominant','submissive','switch']::text[];

CREATE INDEX IF NOT EXISTS questions_applies_to_idx ON public.questions USING GIN (applies_to);