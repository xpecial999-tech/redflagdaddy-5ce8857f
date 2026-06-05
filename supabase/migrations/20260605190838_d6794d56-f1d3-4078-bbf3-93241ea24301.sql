ALTER TABLE public.journeys ALTER COLUMN creator_id DROP NOT NULL;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS guest_email text;