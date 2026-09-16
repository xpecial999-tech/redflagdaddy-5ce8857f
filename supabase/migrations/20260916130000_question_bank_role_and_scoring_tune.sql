-- Tighten the curated question bank after role/scoring review.
-- This updates already-applied databases; the base curated migration has the
-- same values for fresh environments.

UPDATE public.questions
SET applies_to = ARRAY['Dominant','submissive','switch','exhibitionist','voyeur']::text[]
WHERE order_index = 36
  AND question = 'If privacy is important, how should details about the relationship or play be shared?';

UPDATE public.questions
SET applies_to = ARRAY['Dominant','Master','sadist','rope top','service top','degradation giver','switch','primal','caregiver']::text[]
WHERE order_index IN (85, 87, 88, 89)
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Dominant Skills');

UPDATE public.questions
SET applies_to = ARRAY['Dominant','Master','service top','degradation giver','switch','caregiver']::text[]
WHERE order_index = 86
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Dominant Skills');

UPDATE public.questions
SET applies_to = ARRAY['submissive','slave','brat','little','pet','masochist','rope bottom','service bottom','degradation receiver','switch','primal']::text[]
WHERE order_index BETWEEN 90 AND 94
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

UPDATE public.questions
SET question = 'How confident are you asking for reassurance without making your partner responsible for constant regulation?'
WHERE order_index = 101
  AND question = 'How much reassurance feels healthy rather than compulsory?';

UPDATE public.questions
SET question = 'How comfortable are you seeking discreet, consent-aware outside support when needed?'
WHERE order_index = 108
  AND question = 'How important is discretion when seeking community support?';
