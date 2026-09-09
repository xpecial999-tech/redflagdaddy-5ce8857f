import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Compass, Download, Search } from "lucide-react";
import { ConstructionPage } from "@/components/ConstructionPage";
import { getPublicSettings } from "@/lib/entitlement.functions";
import { lookupAnonymousJourney } from "@/lib/guest.functions";
import { ReportView } from "@/components/ReportView";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await getPublicSettings();
    } catch (error) {
      console.error("[construction-mode] Landing settings unavailable", error);
      return {
        constructionModeEnabled: true,
        constructionModeUpdatedAt: null,
        settingsAvailable: false,
      };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "RedFlagDaddy — Structured conversations for adults" },
      {
        name: "description",
        content:
          "Private, role-aware prompts that help adults discuss consent, compatibility, boundaries and safety.",
      },
      { property: "og:title", content: "RedFlagDaddy — Navigate dynamics with clarity" },
      {
        property: "og:description",
        content:
          "Private, role-aware conversation prompts for adults discussing consent, compatibility, boundaries and safety.",
      },
      { property: "og:url", content: "https://redflagdaddy.com/" },
      ...(loaderData?.constructionModeEnabled
        ? [{ name: "robots", content: "noindex,nofollow,noarchive" }]
        : []),
    ],
    links: [{ rel: "canonical", href: "https://redflagdaddy.com/" }],
  }),
  component: Landing,
});

function Landing() {
  const settings = Route.useLoaderData();
  if (settings.constructionModeEnabled) return <ConstructionPage />;

  return (
    <div className="space-y-10 pt-8">
      <section className="text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0 }}
          className="pb-2 text-5xl md:text-6xl font-display font-semibold leading-[1.16]"
        >
          Navigate dynamics with{" "}
          <span className="inline-block pb-[0.08em] text-gradient">clarity</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          RedFlagDaddy helps Dominants, submissives, switches and the full spectrum of BDSM
          archetypes discuss consent, compatibility, safety practices and potential red flags — with
          structure, not guesswork.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
        >
          <Link
            to="/guest"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:scale-[1.02] transition"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.4 }}
          className="pt-4"
        >
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <Compass className="h-3.5 w-3.5 text-primary" />
            About RedFlagDaddy
          </Link>
        </motion.div>
      </section>
      <p className="mx-auto max-w-2xl border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        For adults 18+. RedFlagDaddy is a structured conversation aid — not identity verification, a
        background check, a diagnosis, proof of consent, an emergency service or a guarantee of
        safety.
      </p>
      <JourneyLookup />
    </div>
  );
}

function JourneyLookup() {
  const lookupFn = useServerFn(lookupAnonymousJourney);
  const [ownerCode, setOwnerCode] = useState("");
  const lookup = useMutation({
    mutationFn: () => lookupFn({ data: { ownerCode } }),
  });

  const result = lookup.data;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2.8 }}
      className="glass mx-auto max-w-lg rounded-2xl p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <Search className="mt-0.5 h-4 w-4 text-primary/80" />
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight">
            Returning to a journey?
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your secret code to check progress or view your summary.
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row no-print"
        onSubmit={(event) => {
          event.preventDefault();
          lookup.mutate();
        }}
      >
        <Input
          value={ownerCode}
          onChange={(event) => {
            setOwnerCode(event.target.value.toUpperCase());
            if (lookup.data) lookup.reset();
          }}
          aria-label="Secret code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          placeholder="XXXXXXXX-XXXXXXXX"
          className="min-h-10 font-mono text-xs tracking-wide"
        />
        <button
          disabled={lookup.isPending || !ownerCode.trim()}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary/90 px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          <Search className="h-3.5 w-3.5" /> {lookup.isPending ? "Checking…" : "Check code"}
        </button>
      </form>

      {lookup.error && (
        <p className="text-xs text-destructive">
          Could not check this code. Please wait and try again.
        </p>
      )}
      {result?.status === "unavailable" && (
        <p className="rounded-xl border border-border bg-input p-4 text-xs text-muted-foreground">
          This code is invalid, expired, or no longer available. For privacy, we cannot recover
          anonymous codes.
        </p>
      )}
      {(result?.status === "waiting" || result?.status === "in_progress") && (
        <p className="rounded-xl border border-border bg-input p-4 text-xs text-muted-foreground">
          {result.status === "waiting"
            ? "The partner assessment has not started yet."
            : "The partner assessment is still in progress."}{" "}
          Return with the same code later. This journey expires{" "}
          {new Date(result.expiresAt).toLocaleDateString()}.
        </p>
      )}
      {result?.status === "completed" && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-end no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-input px-4 py-2.5 text-sm font-medium"
            >
              <Download className="h-4 w-4" /> Save / print report
            </button>
          </div>
          <ReportView
            title={result.journey.title}
            participantType={result.journey.participantType}
            scores={result.scores}
            analysis={result.analysis}
          />
          <p className="text-center text-xs text-muted-foreground no-print">
            Available until {new Date(result.expiresAt).toLocaleDateString()}.
          </p>
        </div>
      )}
    </motion.section>
  );
}
