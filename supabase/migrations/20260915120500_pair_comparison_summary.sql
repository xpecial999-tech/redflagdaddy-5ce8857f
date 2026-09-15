-- Store deterministic pair comparison reports separately from individual results.

ALTER TABLE public.journey_pairs
  ADD COLUMN IF NOT EXISTS comparison_summary jsonb;
