ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key ON public.users (phone) WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, name)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    NULLIF(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;