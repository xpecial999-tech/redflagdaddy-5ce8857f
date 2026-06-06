CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  email_invite_accepted BOOLEAN NOT NULL DEFAULT true,
  email_journey_complete BOOLEAN NOT NULL DEFAULT true,
  email_red_flag BOOLEAN NOT NULL DEFAULT true,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT false,
  in_app_messages BOOLEAN NOT NULL DEFAULT true,
  in_app_mentions BOOLEAN NOT NULL DEFAULT true,
  share_results_with_respondents BOOLEAN NOT NULL DEFAULT true,
  anonymous_analytics BOOLEAN NOT NULL DEFAULT false,
  discoverable_profile BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prefs"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own prefs"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own prefs"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();