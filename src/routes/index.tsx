import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";
import { ConstructionPage } from "@/components/ConstructionPage";
import { getPublicSettings } from "@/lib/entitlement.functions";

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
          Navigate dynamics with <span className="text-gradient">clarity</span>.
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
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/10 bg-[#100b24]/80 px-7 py-2.5 text-base text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(236,72,153,0.10)] backdrop-blur-md transition hover:border-primary/40 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_30px_rgba(236,72,153,0.18)]"
          >
            <Compass className="h-5 w-5 text-primary" />
            About RedFlagDaddy
          </Link>
        </motion.div>
      </section>
      <p className="mx-auto max-w-2xl border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        For adults 18+. RedFlagDaddy is a structured conversation aid — not identity verification, a
        background check, a diagnosis, proof of consent, an emergency service or a guarantee of
        safety.
      </p>
    </div>
  );
}
