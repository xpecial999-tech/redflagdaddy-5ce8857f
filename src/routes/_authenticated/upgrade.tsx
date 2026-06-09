import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { startPeachCheckout, finalizePeachPayment } from "@/lib/payments.functions";
import { getEntitlement } from "@/lib/entitlement.functions";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({ meta: [{ title: "Upgrade — RedFlagDaddy" }] }),
  component: UpgradePage,
});

function UpgradePage() {
  const navigate = useNavigate();
  const startFn = useServerFn(startPeachCheckout);
  const finalizeFn = useServerFn(finalizePeachPayment);
  const entFn = useServerFn(getEntitlement);

  const ent = useQuery({ queryKey: ["entitlement"], queryFn: () => entFn() });

  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const returnedId = search?.get("id") ?? null;

  const finalizeMut = useMutation({
    mutationFn: (checkoutId: string) => finalizeFn({ data: { checkoutId } }),
  });

  useEffect(() => {
    if (returnedId) finalizeMut.mutate(returnedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedId]);

  const startMut = useMutation({
    mutationFn: () => startFn(),
  });

  // Inject Peach widget script when we have a checkoutId
  useEffect(() => {
    if (!startMut.data?.scriptUrl) return;
    const s = document.createElement("script");
    s.src = startMut.data.scriptUrl;
    s.async = true;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [startMut.data?.scriptUrl]);

  if (ent.data?.isPaid) {
    return (
      <div className="max-w-md mx-auto glass-strong rounded-3xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <h1 className="text-2xl font-display">You're on the full version</h1>
        <button onClick={() => navigate({ to: "/dashboard" })} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm">Back to dashboard</button>
      </div>
    );
  }

  if (finalizeMut.data?.ok) {
    return (
      <div className="max-w-md mx-auto glass-strong rounded-3xl p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <h1 className="text-2xl font-display">Payment successful</h1>
        <p className="text-sm text-muted-foreground">Full access unlocked. Enjoy.</p>
        <button onClick={() => navigate({ to: "/dashboard" })} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm">Go to dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Upgrade</p>
        <h1 className="text-3xl font-display font-semibold">Unlock full access</h1>
      </header>
      <div className="glass-strong rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">One-time payment</span>
          <span className="text-3xl font-display">$1.00</span>
        </div>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-aurora-2" /> Full 100-question assessments</li>
          <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-aurora-2" /> Category deep-dive journeys</li>
          <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-aurora-2" /> Unlimited journeys</li>
          <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-aurora-2" /> Downloadable PDF reports & share links</li>
        </ul>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secured by Peach Payments (sandbox)</p>
      </div>

      {!startMut.data && (
        <button
          onClick={() => startMut.mutate()}
          disabled={startMut.isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          {startMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</> : <>Pay $1 to unlock</>}
        </button>
      )}
      {startMut.error && (
        <p className="text-xs text-destructive">{(startMut.error as Error).message}</p>
      )}

      {startMut.data && (
        <div className="glass rounded-2xl p-4">
          <form
            action={`${typeof window !== "undefined" ? window.location.origin : ""}/upgrade?id=${startMut.data.checkoutId}`}
            className="paymentWidgets"
            data-brands="VISA MASTER AMEX"
          />
        </div>
      )}

      {finalizeMut.isPending && (
        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Verifying payment…
        </div>
      )}
      {finalizeMut.data && !finalizeMut.data.ok && (
        <p className="text-sm text-destructive text-center">
          Payment not confirmed: {finalizeMut.data.description || finalizeMut.data.code}
        </p>
      )}
    </div>
  );
}
