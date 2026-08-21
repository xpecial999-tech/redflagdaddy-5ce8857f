import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { validateInvite, startInvite } from "@/lib/invites.functions";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Compass,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/journey/$code")({
  component: JourneyInviteRoute,
  errorComponent: ({ error }) => (
    
      <div className="glass rounded-2xl p-6 max-w-md mx-auto">
        <p className="text-destructive">{error.message}</p>
      </div>
    
  ),
  notFoundComponent: () => (
    
      <p>Not found.</p>
    
  ),
});

export function JourneyInvitePage({ code }: { code: string }) {
  const navigate = useNavigate();
  const validateFn = useServerFn(validateInvite);
  const startFn = useServerFn(startInvite);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invite", code],
    queryFn: () => validateFn({ data: { code } }),
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => startFn({ data: { code } }),
    onSuccess: () => {
      navigate({ to: "/assessment/$code", params: { code } });
    },
  });

  if (isLoading) {
    return (
      
        <div className="glass rounded-2xl p-8 max-w-md mx-auto text-center">
          <Compass className="w-6 h-6 mx-auto animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-3">Validating your invite…</p>
        </div>
      
    );
  }

  if (error) {
    return (
      
        <InvalidState
          title="We couldn't validate this invite"
          description={error.message}
        />
      
    );
  }

  if (!data?.ok) {
    const messages: Record<string, { title: string; desc: string }> = {
      not_found: {
        title: "Invite not found",
        desc: "Double-check the code with the person who invited you.",
      },
      expired: {
        title: "This invite has expired",
        desc: "Invite links are valid for a limited time. Ask for a fresh link.",
      },
      completed: {
        title: "Already completed",
        desc: "This invite has already been used. Each invite can only be completed once.",
      },
    };
    const m = messages[data?.reason ?? "not_found"] ?? messages.not_found;
    return (
      
        <InvalidState title={m.title} description={m.desc} />
      
    );
  }

  const { journey, estimatedMinutes, invite } = data;
  const expiresLabel = invite.expiresAt
    ? new Date(invite.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-5"
      >
        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-aurora-2" />
            Verified invite
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
            {journey.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            You've been invited to complete a private compatibility, consent &amp; safety assessment.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <InfoTile
              icon={Compass}
              label="Assessment type"
              value={
                journey.participantType.charAt(0).toUpperCase() +
                journey.participantType.slice(1)
              }
            />
            <InfoTile
              icon={Clock}
              label="Estimated time"
              value={`~${estimatedMinutes} minutes`}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-aurora-1" />
            <h2 className="font-medium">Privacy notice</h2>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Your responses are encrypted and only shared with the person who invited you.</li>
            <li>This is not a dating tool — it is a consent, compatibility &amp; safety assessment.</li>
            <li>You can pause at any time. Nothing is final until you submit.</li>
            <li>This invite is single-use{expiresLabel ? ` and expires on ${expiresLabel}` : ""}.</li>
          </ul>
        </div>

        {startMutation.error && (
          <p className="text-sm text-destructive text-center">
            {(startMutation.error as Error).message}
          </p>
        )}

        <Button
          size="lg"
          className="w-full h-14 text-base"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          {startMutation.isPending ? "Starting…" : "Begin assessment"}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          By continuing you confirm you are 18+ and consenting freely.
        </p>
      </motion.div>
    
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function InvalidState({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-strong rounded-3xl p-8 max-w-md mx-auto text-center">
      <div className="w-12 h-12 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h1 className="font-display text-xl font-semibold tracking-tight mt-4">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      <div className="mt-6 flex flex-col gap-2">
        <Link to="/join" className="text-sm text-aurora-1 hover:underline">
          Enter a different code
        </Link>
        <Link to="/" className="text-xs text-muted-foreground hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}


function JourneyInviteRoute() {
  const { code } = Route.useParams();
  return <JourneyInvitePage code={code} />;
}
