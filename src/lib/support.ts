import { z } from "zod";

export const SUPPORT_CATEGORIES = [
  "product_account",
  "privacy_data",
  "exposed_link",
  "safety_abuse",
  "accessibility",
  "other",
] as const;

export const SUPPORT_CONCERNS = ["own_account", "own_journey", "someone_else", "general"] as const;

export const SupportRequestSchema = z.object({
  replyEmail: z.string().trim().toLowerCase().email().max(254),
  category: z.enum(SUPPORT_CATEGORIES),
  concerns: z.enum(SUPPORT_CONCERNS),
  journeyReference: z
    .string()
    .trim()
    .uuid("Enter a journey ID, not a private link or access code.")
    .optional()
    .nullable(),
  message: z.string().trim().min(20).max(4000),
  turnstileToken: z.string().trim().min(1).max(2048),
  notEmergency: z.literal(true),
  website: z.string().max(0).optional(),
});

export const supportCategoryLabels: Record<(typeof SUPPORT_CATEGORIES)[number], string> = {
  product_account: "Product or account help",
  privacy_data: "Privacy or data request",
  exposed_link: "Exposed private link",
  safety_abuse: "Safety, abuse or stalking concern",
  accessibility: "Accessibility",
  other: "Other",
};

export const supportConcernLabels: Record<(typeof SUPPORT_CONCERNS)[number], string> = {
  own_account: "My own account",
  own_journey: "My own journey",
  someone_else: "Someone else or an exposed link",
  general: "General question",
};
