/** Max characters we allow in one SMS body (GSM-7, ~3 parts) before trimming. */
const MAX_SMS_CHARS = 440;

/** Strip anything outside GSM-7 so the SMS stays 160-chars-per-part, not 70. */
function toGsm7(input: string): string {
  return (
    input
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\u2026]/g, "...")
      // drop emoji and any remaining non-GSM characters
      .replace(/[^\x20-\x7E\n]/g, "")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
}

/** Builds the friendly, personalised SMS copy used for journey invites. */
export function buildInviteSms(opts: {
  recipientName?: string | null;
  senderName?: string | null;
  notes?: string | null;
  url: string;
}): string {
  const name = toGsm7(opts.recipientName ?? "").slice(0, 40);
  const sender = toGsm7(opts.senderName ?? "").slice(0, 40);
  const notes = toGsm7(opts.notes ?? "");
  const url = toGsm7(opts.url);

  if (!url || url.length > 300) {
    throw new Error("The invitation link could not be included in the SMS.");
  }

  const hello = name ? `Hey ${name}!` : "Hey there!";
  const who = sender ? `${sender} has invited you` : "You've been invited";

  const tail = `Jump in here: ${url}`;
  const intro =
    `${hello} ${who} to a RedFlagDaddy check-in. ` +
    "It's a quick, private set of questions on boundaries, safety and what you're into - honest answers, no judgement. Your replies stay confidential and build a clear compatibility picture for you both.";

  const base = `${intro}\n\n${tail}`;
  if (base.length > MAX_SMS_CHARS) {
    const introRoom = MAX_SMS_CHARS - tail.length - 2;
    if (introRoom < 20) {
      throw new Error("The invitation link could not be included in the SMS.");
    }
    return `${intro.slice(0, introRoom).trimEnd()}\n\n${tail}`;
  }

  if (!notes) return base;

  const notePrefix = 'Their note: "';
  const noteSuffix = '"';
  const noteRoom = MAX_SMS_CHARS - base.length - 4 - notePrefix.length - noteSuffix.length;
  if (noteRoom < 12) return base;
  const boundedNote =
    notes.length > noteRoom ? `${notes.slice(0, noteRoom - 3).trimEnd()}...` : notes;

  return `${intro}\n\n${notePrefix}${boundedNote}${noteSuffix}\n\n${tail}`;
}
