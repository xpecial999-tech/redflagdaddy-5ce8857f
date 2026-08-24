export const EXPORT_FAILURE_MESSAGE =
  "We couldn't create a complete data export. No file was downloaded. Please try again.";

export const DELETE_FAILURE_MESSAGE = "Account deletion did not finish. Please try again.";

export const PROFILE_EXPORT_FIELDS =
  "id, email, name, role, phone, is_paid, paid_at, created_at, updated_at";
export const PREFERENCES_EXPORT_FIELDS =
  "user_id, anonymous_analytics, discoverable_profile, email_invite_accepted, email_journey_complete, email_red_flag, email_weekly_digest, in_app_mentions, in_app_messages, share_results_with_respondents, created_at, updated_at";
export const JOURNEY_EXPORT_FIELDS =
  "id, title, participant_type, status, category_ids, question_limit, recipient_email, guest_email, guest_phone, created_at, updated_at";
export const INVITE_EXPORT_FIELDS = "id, journey_id, email, created_at, expires_at, completed_at";
export const RESPONSE_EXPORT_FIELDS = "id, journey_id, question_id, answer, score, created_at";
export const RESULT_EXPORT_FIELDS =
  "id, journey_id, safety_score, compatibility_score, red_flag_score, green_flag_score, experience_score, ai_summary, share_enabled, created_at, updated_at";
export const PAYMENT_EXPORT_FIELDS =
  "id, provider, provider_ref, amount_cents, currency, status, created_at, updated_at";

type QueryResult<T> = {
  data: T;
  error: { message?: string } | null;
};

export function requirePrivacyResult<T>(
  result: QueryResult<T>,
  operation: string,
  publicMessage: string,
): T {
  if (result.error) {
    console.error(
      `[data-privacy] ${operation} failed:`,
      result.error.message ?? "unknown database error",
    );
    throw new Error(publicMessage);
  }
  return result.data;
}

export function smsLogPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
