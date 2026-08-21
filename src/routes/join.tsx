import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { KeyRound, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow,noarchive" }] }),
  component: JoinPage,
  errorComponent: ({ error }) => (
    
      <p className="text-destructive">{error.message}</p>
    
  ),
  notFoundComponent: () => (
    
      <p>Not found.</p>
    
  ),
});

function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      setError("Please enter a valid invite code.");
      return;
    }
    setError(null);
    navigate({ to: "/journey/$code", params: { code: trimmed } });
  }

  return (
    
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Enter your invite code</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Have an invite? Paste your code below to begin a private assessment.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              className="text-center tracking-[0.3em] font-mono text-lg h-14"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-12">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            Your responses are private and only shared with the person who invited you.
          </p>
        </div>
      </motion.div>
    
  );
}
