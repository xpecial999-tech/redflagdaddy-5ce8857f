import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, LifeBuoy, LockKeyhole, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportRequest } from "@/lib/support.functions";

const SUPPORT_EMAIL = "support@redflagdaddy.com";
const TURNSTILE_SITE_KEY = import.meta.env["VITE_TURNSTILE_SITE_KEY"] ?? "";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — RedFlagDaddy" },
      {
        name: "description",
        content:
          "Contact RedFlagDaddy for product, account, privacy, accessibility or safety support.",
      },
      { property: "og:title", content: "Support — RedFlagDaddy" },
      { property: "og:url", content: "https://redflagdaddy.com/support" },
    ],
    links: [{ rel: "canonical", href: "https://redflagdaddy.com/support" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  const submitRequest = useServerFn(submitSupportRequest);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
    if (!turnstileToken) {
      setError("Complete the security check before sending your request.");
      return;
    }

    setSending(true);
    try {
      const result = await submitRequest({
        data: {
          replyEmail: String(formData.get("replyEmail") ?? ""),
          category: String(formData.get("category") ?? ""),
          concerns: String(formData.get("concerns") ?? ""),
          journeyReference: String(formData.get("journeyReference") ?? "") || null,
          message: String(formData.get("message") ?? ""),
          website: String(formData.get("website") ?? ""),
          turnstileToken,
          notEmergency: formData.get("notEmergency") === "on",
        },
      });
      setReference(result.reference);
      form.reset();
      const turnstileWindow = window as Window & { turnstile?: { reset: () => void } };
      turnstileWindow.turnstile?.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your request could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <LifeBuoy aria-hidden="true" className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-semibold">RedFlagDaddy support</h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          Ask for product, account, privacy or accessibility help, or report an exposed private link
          or safety concern involving the service.
        </p>
      </header>

      <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-2">
            <h2 className="font-semibold">Not for emergencies</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This inbox is not continuously monitored and RedFlagDaddy cannot provide emergency or
              crisis help. If anyone may be in immediate danger, contact the emergency service where
              they are now. For verified local helplines, visit{" "}
              <a
                href="https://findahelpline.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
              >
                Find A Helpline
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {reference ? (
        <section role="status" className="glass-strong rounded-3xl p-6 text-center">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-success" />
          <h2 className="mt-3 font-display text-2xl font-semibold">Request sent</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Save this reference in case you need to follow up.
          </p>
          <p className="mt-3 font-mono text-base font-semibold text-primary">{reference}</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setReference(null)}>
              Send another request
            </Button>
            <Button asChild>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(reference)}`}>
                Follow up by email
              </a>
            </Button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="glass-strong space-y-5 rounded-3xl p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="support-email">Your reply email</Label>
            <Input
              id="support-email"
              name="replyEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="support-category">What do you need help with?</Label>
              <select
                id="support-category"
                name="category"
                required
                defaultValue=""
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="product_account">Product or account help</option>
                <option value="privacy_data">Privacy or data request</option>
                <option value="exposed_link">Exposed private link</option>
                <option value="safety_abuse">Safety, abuse or stalking concern</option>
                <option value="accessibility">Accessibility</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-concerns">This concerns</Label>
              <select
                id="support-concerns"
                name="concerns"
                required
                defaultValue=""
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Select one
                </option>
                <option value="own_account">My own account</option>
                <option value="own_journey">My own journey</option>
                <option value="someone_else">Someone else or an exposed link</option>
                <option value="general">General question</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="journey-reference">Journey ID, if relevant (optional)</Label>
            <Input
              id="journey-reference"
              name="journeyReference"
              maxLength={36}
              autoComplete="off"
              placeholder="Do not paste a private link or access code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-message">How can we help?</Label>
            <Textarea
              id="support-message"
              name="message"
              minLength={20}
              maxLength={4000}
              required
              className="min-h-40 resize-y"
              placeholder="Describe the issue without passwords, one-time codes, intimate images, identity documents, full assessment answers or another person's contact details."
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              RedFlagDaddy may ask you to verify control of your account before disclosing, changing
              or deleting account data. We will never ask for your password or one-time code.
            </p>
          </div>

          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="support-website">Website</Label>
            <Input id="support-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4 text-sm">
            <input
              name="notEmergency"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span>
              I understand this form is not monitored continuously and is not for emergencies.
            </span>
          </label>

          {TURNSTILE_SITE_KEY ? (
            <>
              <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div
                className="cf-turnstile"
                data-sitekey={TURNSTILE_SITE_KEY}
                data-theme="dark"
                data-action="support_request"
              />
            </>
          ) : (
            <div
              role="status"
              className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"
            >
              The secure form is being configured. Email{" "}
              <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>{" "}
              instead.
            </div>
          )}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={sending || !TURNSTILE_SITE_KEY}
          >
            <Send aria-hidden="true" />
            {sending ? "Sending securely…" : "Send support request"}
          </Button>

          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Your submission is used to handle this request, not for marketing or product
              analytics. Read the current{" "}
              <Link
                to="/consent-safety"
                className="inline-flex min-h-11 items-center text-primary underline"
              >
                consent, safety and analytics guidance
              </Link>
              .
            </p>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Prefer email? Write to{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          {SUPPORT_EMAIL}
        </a>
        . Do not include private access links or one-time codes.
      </p>
    </div>
  );
}
