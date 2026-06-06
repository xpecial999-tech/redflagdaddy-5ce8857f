import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dynamic Compass — Consent, Compatibility & Safety" },
      { name: "description", content: "Structured assessments for Dominants, submissives and switches." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="space-y-10 pt-8">
      <section className="text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0 }}
          className="text-5xl md:text-6xl font-display font-semibold leading-[1.05]"
        >
          Navigate dynamics with <span className="text-gradient">clarity</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          Dynamic Compass helps Dominants, submissives and switches assess consent,
          compatibility, safety and red flags — with structure, not guesswork.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
        >
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:scale-[1.02] transition"
          >
            Start a journey <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/guest"
            className="inline-flex items-center justify-center rounded-xl glass px-5 py-3 text-sm font-medium hover:bg-white/5 transition"
          >
            Continue as guest
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            I have an account
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
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Learn how it works <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
