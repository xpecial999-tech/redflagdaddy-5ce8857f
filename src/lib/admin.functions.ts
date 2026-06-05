import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required.");
  return supabaseAdmin;
}

// ---------- Questions ----------

const OptionSchema = z.object({
  label: z.string().min(1).max(300),
  value: z.string().min(1).max(120),
  score: z.number().optional(),
});

const QuestionSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  question: z.string().trim().min(3).max(1000),
  question_type: z.enum([
    "single_choice",
    "multi_choice",
    "boolean",
    "scale",
    "slider",
    "text",
    "scenario",
  ]),
  answer_options: z.array(OptionSchema).max(20).default([]),
  weight: z.number().min(0).max(20).default(1),
  risk_level: z.enum(["low", "medium", "high", "critical"]).default("low"),
  active: z.boolean().default(true),
  order_index: z.number().int().default(0),
  branch_logic: z.record(z.string(), z.any()).default({}),
});

export const listQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        category_id: z.string().uuid().optional(),
        includeInactive: z.boolean().default(true),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    let q = sb
      .from("questions")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (!data.includeInactive) q = q.eq("active", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { questions: rows ?? [] };
  });

export const upsertQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QuestionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await sb.from("questions").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: inserted, error } = await sb
      .from("questions")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    const { error } = await sb.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    const { error } = await sb
      .from("questions")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        items: z
          .array(z.object({ id: z.string().uuid(), order_index: z.number().int() }))
          .min(1)
          .max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    await Promise.all(
      data.items.map((it) =>
        sb.from("questions").update({ order_index: it.order_index }).eq("id", it.id),
      ),
    );
    return { ok: true };
  });

// ---------- Categories ----------

const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const listCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await assertAdmin(context.userId);
    const { data, error } = await sb
      .from("question_categories")
      .select("id, name, description, created_at")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { categories: data ?? [] };
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CategorySchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await sb.from("question_categories").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: inserted, error } = await sb
      .from("question_categories")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    const { error } = await sb.from("question_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Journeys ----------

export const listJourneys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["draft", "pending", "in_progress", "completed", "expired"]).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    let q = sb
      .from("journeys")
      .select("id, title, status, participant_type, invite_code, recipient_email, creator_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    const { data: journeys, error } = await q;
    if (error) throw new Error(error.message);
    return { journeys: journeys ?? [] };
  });

// ---------- Analytics ----------

export const getAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await assertAdmin(context.userId);

    const [{ data: journeys, error: jErr }, { data: results, error: rErr }, { data: critQs, error: cErr }] =
      await Promise.all([
        sb.from("journeys").select("id, status, created_at"),
        sb
          .from("results")
          .select("journey_id, safety_score, compatibility_score, green_flag_score, red_flag_score, experience_score"),
        sb.from("questions").select("id").eq("risk_level", "critical").eq("active", true),
      ]);
    if (jErr) throw new Error(jErr.message);
    if (rErr) throw new Error(rErr.message);
    if (cErr) throw new Error(cErr.message);

    const total = journeys?.length ?? 0;
    const completed = (journeys ?? []).filter((j) => j.status === "completed").length;
    const inProgress = (journeys ?? []).filter((j) => j.status === "in_progress").length;
    const completionRate = total ? (completed / total) * 100 : 0;

    const avg = (key: "safety_score" | "compatibility_score" | "green_flag_score" | "red_flag_score" | "experience_score") => {
      const vals = (results ?? []).map((r) => Number(r[key])).filter((n) => Number.isFinite(n));
      return vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : 0;
    };

    const criticalIds = new Set((critQs ?? []).map((q) => q.id));
    let redFlagHits = 0;
    let criticalResponses = 0;
    if (criticalIds.size > 0) {
      const { data: resp, error: respErr } = await sb
        .from("responses")
        .select("question_id, score")
        .in("question_id", Array.from(criticalIds));
      if (respErr) throw new Error(respErr.message);
      criticalResponses = resp?.length ?? 0;
      redFlagHits = (resp ?? []).filter((r) => Number(r.score) > 0).length;
    }
    const redFlagFrequency = criticalResponses ? (redFlagHits / criticalResponses) * 100 : 0;

    return {
      totals: { journeys: total, completed, inProgress },
      completionRate,
      averages: {
        safety: avg("safety_score"),
        compatibility: avg("compatibility_score"),
        green: avg("green_flag_score"),
        red: avg("red_flag_score"),
        experience: avg("experience_score"),
      },
      redFlag: {
        criticalQuestions: criticalIds.size,
        criticalResponses,
        hits: redFlagHits,
        frequency: redFlagFrequency,
      },
    };
  });
