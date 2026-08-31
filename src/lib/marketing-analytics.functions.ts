import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  analyticsMode,
  MARKETING_EVENT_NAMES,
  MARKETING_FLOWS,
  MARKETING_SOURCES,
} from "./marketing-attribution";

const AttributionSchema = z
  .object({
    source: z.enum(MARKETING_SOURCES).nullable(),
    medium: z.literal("organic_social").nullable(),
    campaign: z
      .string()
      .regex(/^[a-z0-9][a-z0-9_-]{0,79}$/)
      .nullable(),
    content: z
      .string()
      .regex(/^[a-z0-9][a-z0-9_-]{0,79}$/)
      .nullable(),
  })
  .nullable();

const EventSchema = z.object({
  eventName: z.enum(MARKETING_EVENT_NAMES),
  environment: z.enum(["staging", "production"]),
  flow: z.enum(MARKETING_FLOWS),
  sessionId: z.string().uuid(),
  attribution: AttributionSchema,
});

export const recordMarketingEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => EventSchema.parse(data))
  .handler(async ({ data }) => {
    const serverEnvironment = analyticsMode();
    if (!serverEnvironment || data.environment !== serverEnvironment) {
      throw new Error("Analytics event was not recorded");
    }

    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits([
      { action: "marketing_event_ip", value: callerIp(), windowSeconds: 60 * 60, maxEvents: 200 },
      {
        action: "marketing_event_session",
        value: data.sessionId,
        windowSeconds: 60 * 60,
        maxEvents: 50,
      },
    ]);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("marketing_events").insert({
      event_name: data.eventName,
      environment: serverEnvironment,
      session_id: data.sessionId,
      flow: data.flow,
      utm_source: data.attribution?.source ?? null,
      utm_medium: data.attribution?.medium ?? null,
      utm_campaign: data.attribution?.campaign ?? null,
      utm_content: data.attribution?.content ?? null,
    });
    if (error) {
      if (error.code === "23505") return { recorded: true as const };
      console.error("[marketing-analytics] Event insert failed", { code: error.code });
      throw new Error("Analytics event was not recorded");
    }

    return { recorded: true as const };
  });
