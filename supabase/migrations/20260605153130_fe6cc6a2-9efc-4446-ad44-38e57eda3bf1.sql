
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.user_role AS ENUM ('Dominant', 'submissive', 'switch');
CREATE TYPE public.journey_status AS ENUM ('draft', 'pending', 'in_progress', 'completed', 'expired');
CREATE TYPE public.participant_type AS ENUM ('Dominant', 'submissive', 'switch', 'any');
CREATE TYPE public.question_type AS ENUM ('single_choice', 'multi_choice', 'scale', 'boolean', 'text');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- =========================================================
-- updated_at helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- USERS (profile table; PK = auth.users.id)
-- =========================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  role        public.user_role NOT NULL DEFAULT 'switch',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create a profile row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- ADMIN USERS + security-definer admin check (avoids RLS recursion)
-- =========================================================
CREATE TABLE public.admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id);
$$;

-- =========================================================
-- USERS policies
-- =========================================================
CREATE POLICY "Users read own profile"     ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"   ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"   ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles"   ON public.users FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update all profiles" ON public.users FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- =========================================================
-- ADMIN_USERS policies
-- =========================================================
CREATE POLICY "Admins read admin list"   ON public.admin_users FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage admin list" ON public.admin_users FOR ALL    TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- JOURNEYS
-- =========================================================
CREATE TABLE public.journeys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  participant_type public.participant_type NOT NULL DEFAULT 'any',
  invite_code      TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(9), 'base64'),
  invite_url       TEXT,
  recipient_email  TEXT,
  status           public.journey_status NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journeys_creator ON public.journeys(creator_id);
CREATE INDEX idx_journeys_invite_code ON public.journeys(invite_code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journeys TO authenticated;
GRANT ALL ON public.journeys TO service_role;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_journeys_updated_at
BEFORE UPDATE ON public.journeys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Creators manage own journeys" ON public.journeys FOR ALL TO authenticated
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Admins read all journeys" ON public.journeys FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- =========================================================
-- INVITES
-- =========================================================
CREATE TABLE public.invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(12), 'base64'),
  email        TEXT,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_journey ON public.invites(journey_id);
CREATE INDEX idx_invites_code ON public.invites(code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own invites" ON public.invites FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journeys j WHERE j.id = journey_id AND j.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.journeys j WHERE j.id = journey_id AND j.creator_id = auth.uid()));
CREATE POLICY "Admins read invites" ON public.invites FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- =========================================================
-- QUESTION CATEGORIES
-- =========================================================
CREATE TABLE public.question_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.question_categories TO authenticated;
GRANT ALL ON public.question_categories TO service_role;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads categories" ON public.question_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.question_categories FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- QUESTIONS
-- =========================================================
CREATE TABLE public.questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES public.question_categories(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  question_type   public.question_type NOT NULL DEFAULT 'single_choice',
  answer_options  JSONB NOT NULL DEFAULT '[]'::jsonb,
  weight          NUMERIC NOT NULL DEFAULT 1,
  risk_level      public.risk_level NOT NULL DEFAULT 'low',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_category ON public.questions(category_id);

GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads active questions" ON public.questions FOR SELECT TO authenticated USING (active = true OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- RESPONSES
-- =========================================================
CREATE TABLE public.responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer      JSONB NOT NULL,
  score       NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (journey_id, question_id)
);

CREATE INDEX idx_responses_journey ON public.responses(journey_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators read own responses" ON public.responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journeys j WHERE j.id = journey_id AND j.creator_id = auth.uid()));
CREATE POLICY "Creators delete own responses" ON public.responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journeys j WHERE j.id = journey_id AND j.creator_id = auth.uid()));
CREATE POLICY "Admins read all responses" ON public.responses FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
-- INSERT/UPDATE intentionally restricted: respondent writes go through a server function using the invite code.

-- =========================================================
-- RESULTS
-- =========================================================
CREATE TABLE public.results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id           UUID NOT NULL UNIQUE REFERENCES public.journeys(id) ON DELETE CASCADE,
  safety_score         NUMERIC,
  compatibility_score  NUMERIC,
  red_flag_score       NUMERIC,
  green_flag_score     NUMERIC,
  experience_score     NUMERIC,
  ai_summary           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated;
GRANT ALL ON public.results TO service_role;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_results_updated_at
BEFORE UPDATE ON public.results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Creators read own results" ON public.results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journeys j WHERE j.id = journey_id AND j.creator_id = auth.uid()));
CREATE POLICY "Admins read all results" ON public.results FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
-- Writes to results happen server-side (scoring + AI summary).
