import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin-auth.functions";

export type Me = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  isAdmin: boolean;
};

export function useMe() {
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        if (!cancelled) {
          setMe(null);
          setLoading(false);
        }
        return;
      }
      const [{ data: profile }, adminStatus] = await Promise.all([
        supabase.from("users").select("id, email, name, role").eq("id", user.id).maybeSingle(),
        checkAdmin().catch(() => ({ isAdmin: false })),
      ]);
      if (cancelled) return;
      setMe({
        id: user.id,
        email: profile?.email ?? user.email ?? "",
        name: profile?.name ?? (user.user_metadata?.name as string) ?? null,
        role: (profile?.role as string) ?? null,
        isAdmin: !!adminStatus.isAdmin,
      });
      setLoading(false);
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  return { me, loading };
}
