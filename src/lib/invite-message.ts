/** Max characters we allow in one SMS body (GSM-7, ~3 parts) before trimming. */
const MAX_SMS_CHARS = 440;

/** Strip anything outside GSM-7 so the SMS stays 160-chars-per-part, not 70. */
function toGsm7(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    // drop emoji and any remaining non-GSM characters
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Builds the friendly, personalised SMS copy used for journey invites. */
export function buildInviteSms(opts: {
  recipientName?: string | null;
  senderName?: string | null;
  title?: string | null;
  notes?: string | null;
  url: string;
}): string {
  const name = toGsm7(opts.recipientName ?? "");
  const sender = toGsm7(opts.senderName ?? "");
  let notes = toGsm7(opts.notes ?? "");

  const hello = name ? `Hey ${name}!` : "Hey there!";
  const who = sender ? `${sender} has invited you` : "You've been invited";

  const tail = `Jump in here: ${opts.url}`;
  const intro =
    `${hello} ${who} to a RedFlagDaddy check-in. ` +
    "It's a quick, private set of questions on boundaries, safety and what you're into - honest answers, no judgement. Your replies stay confidential and build a clear compatibility picture for you both.";

  // Keep the note, but never at the cost of the link.
  const room = MAX_SMS_CHARS - intro.length - tail.length - 20;
  if (notes.length > room) notes = room > 12 ? `${notes.slice(0, room - 3)}...` : "";

  const parts = [intro];
  if (notes) parts.push(`Their note: "${notes}"`);
  parts.push(tail);

  return parts.join("\n\n").slice(0, MAX_SMS_CHARS);
}
