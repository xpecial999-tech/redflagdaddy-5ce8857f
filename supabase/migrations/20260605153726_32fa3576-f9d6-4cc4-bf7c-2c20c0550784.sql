
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branch_logic jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'slider';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'scenario';
