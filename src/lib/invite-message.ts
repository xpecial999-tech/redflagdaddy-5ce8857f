/** Builds the friendly, personalised SMS copy used for journey invites. */
export function buildInviteSms(opts: {
  recipientName?: string | null;
  senderName?: string | null;
  title?: string | null;
  notes?: string | null;
  url: string;
}): string {
  const name = opts.recipientName?.trim();
  const sender = opts.senderName?.trim();
  const notes = opts.notes?.trim();

  const hello = name ? `Hey ${name}!` : "Hey there!";
  const who = sender ? `${sender} has invited you` : "You've been invited";

  const lines = [
    `${hello} ${who} to a RedFlagDaddy check-in 🚩`,
    "",
    "It's a quick, private set of questions about boundaries, safety and what you're into — honest answers, no judgement. Your responses stay confidential and build a clear compatibility picture for both of you.",
  ];

  if (notes) lines.push("", `Their note: "${notes}"`);

  lines.push("", `Ready when you are 👉 ${opts.url}`);

  return lines.join("\n");
}
