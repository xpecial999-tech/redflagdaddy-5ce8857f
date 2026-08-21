import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  HelpCircle,
  Loader2,
  Lock,
  LogOut,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useMe } from "@/hooks/use-me";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/phone";
import { exportMyData, deleteMyAccount } from "@/lib/data-privacy.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — RedFlagDaddy" }] }),
  component: Profile,
});

function Profile() {
  const { me, loading } = useMe();
  const navigate = useNavigate();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  if (loading || !me) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const displayName = me.name || formatPhone(me.phone) || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const role = me.role || "member";

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-aurora-1 to-aurora-2 mx-auto flex items-center justify-center text-2xl font-display font-semibold text-primary-foreground">
          {initial}
        </div>
        <h1 className="mt-3 text-xl font-display font-semibold">{displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {role}
          {me.isAdmin ? " · admin" : ""}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{formatPhone(me.phone)}</p>
      </motion.section>

      <section className="space-y-2">
        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Privacy & data</div>
                <div className="text-xs text-muted-foreground">
                  Manage what's stored and shared.
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <PrivacyModal onClose={() => setPrivacyOpen(false)} />
          </DialogContent>
        </Dialog>
        <ProfileLink
          to="/profile/safety"
          icon={Shield}
          label="Safety center"
          desc="Review account access, private-link and crisis guidance."
        />
        <ProfileLink
          to="/profile/help"
          icon={HelpCircle}
          label="Help & consent guides"
          desc="Read published product, consent and privacy guidance."
        />
      </section>

      <button
        onClick={signOut}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}

function ProfileLink({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: "/profile/safety" | "/profile/help";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="w-full text-left glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  const runExport = useServerFn(exportMyData);
  const runDelete = useServerFn(deleteMyAccount);
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setErr(null);
    try {
      const res = await runExport({});
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "redflagdaddy-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data download started");
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not download your data.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toLowerCase() !== "delete my account") return;
    setDeleting(true);
    setErr(null);
    try {
      await runDelete();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted");
      navigate({ to: "/login", replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete your account.");
      setDeleting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Privacy & data</DialogTitle>
        <DialogDescription>
          You control your information. Download a copy or permanently remove your account.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4">
        <Button
          variant="outline"
          className="w-full justify-start h-auto py-3 px-4"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="w-5 h-5 mr-3 text-primary" />
          <div className="text-left">
            <div className="text-sm font-medium">Download your data</div>
            <div className="text-xs text-muted-foreground">
              Get a JSON copy of journeys, responses and results.
            </div>
          </div>
          {exporting && <Loader2 className="w-4 h-4 ml-auto animate-spin" />}
        </Button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-5 h-5 mr-3 text-destructive" />
              <div className="text-left">
                <div className="text-sm font-medium text-destructive">Delete your account</div>
                <div className="text-xs text-muted-foreground">
                  Permanently remove your account and all data.
                </div>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your profile, journeys, responses, results and payment
                history. Type{" "}
                <span className="font-semibold text-foreground">delete my account</span> below to
                confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="my-2"
              autoComplete="off"
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmText.trim().toLowerCase() !== "delete my account" || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Permanently delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {err && !confirmOpen && <p className="text-xs text-destructive">{err}</p>}
    </>
  );
}
