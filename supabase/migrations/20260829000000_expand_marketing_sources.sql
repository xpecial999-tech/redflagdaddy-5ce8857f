-- Keep the privacy-safe attribution constraint aligned with the approved
-- browser/server source allowlist. Values remain an exact, non-free-text set.
ALTER TABLE public.marketing_events
  DROP CONSTRAINT IF EXISTS marketing_events_utm_source_check;

ALTER TABLE public.marketing_events
  ADD CONSTRAINT marketing_events_utm_source_check
  CHECK (
    utm_source IN (
      'fetlife',
      'reddit',
      'x',
      'tiktok',
      'instagram',
      'threads',
      'youtube'
    )
  );
