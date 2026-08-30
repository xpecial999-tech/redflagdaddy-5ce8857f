ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS construction_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS construction_mode_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.admin_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting text NOT NULL,
  previous_value jsonb NOT NULL,
  new_value jsonb NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_settings_audit_setting_changed_at_idx
  ON public.admin_settings_audit (setting, changed_at DESC);

GRANT SELECT ON public.admin_settings_audit TO authenticated;
GRANT ALL ON public.admin_settings_audit TO service_role;

ALTER TABLE public.admin_settings_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_settings_audit'
      AND policyname = 'admins read settings audit'
  ) THEN
    CREATE POLICY "admins read settings audit"
      ON public.admin_settings_audit
      FOR SELECT
      TO authenticated
      USING (public.is_admin(auth.uid()));
  END IF;
END
$$;

COMMENT ON COLUMN public.app_settings.construction_mode_enabled IS
  'When true, public account access and new journey creation are paused.';
COMMENT ON TABLE public.admin_settings_audit IS
  'Private administrator audit history for application setting changes.';
