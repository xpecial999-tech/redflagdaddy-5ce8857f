import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const CallbackSearch = z.object({
  code: z.string().max(2048).optional(),
  next: z.enum(["/admin", "/dashboard", "/profile"]).catch("/dashboard"),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: CallbackSearch,
  head: () => ({
    meta: [
      { title: "Finishing sign in — RedFlagDaddy" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const { code, next } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError("This sign-in link is invalid or has expired.");
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (!cancelled) setError("This sign-in link is invalid or has expired.");
          return;
        }
      }
      if (!cancelled) navigate({ to: next, replace: true });
    }
    void finish();
    return () => {
      cancelled = true;
    };
  }, [code, navigate, next]);

  return (
    <div className="max-w-sm mx-auto pt-16 text-center glass-strong rounded-3xl p-6">
      {error ? (
        <>
          <h1 className="font-display text-xl font-semibold">We couldn't sign you in</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <a href="/login" className="inline-flex mt-5 text-sm text-primary">
            Return to sign in
          </a>
        </>
      ) : (
        <>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
          <h1 className="mt-3 font-display text-xl font-semibold">Finishing your sign in…</h1>
        </>
      )}
    </div>
  );
}
