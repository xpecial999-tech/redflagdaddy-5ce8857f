CREATE TABLE public.sms_log (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  purpose text not null default 'general',
  content_preview text,
  provider_message_id text,
  status text not null default 'accepted',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX sms_log_created_at_idx ON public.sms_log (created_at DESC);
CREATE INDEX sms_log_provider_message_id_idx ON public.sms_log (provider_message_id);
GRANT SELECT ON public.sms_log TO authenticated;
GRANT ALL ON public.sms_log TO service_role;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read sms log" ON public.sms_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));