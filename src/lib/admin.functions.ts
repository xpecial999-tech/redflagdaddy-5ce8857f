import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { ALL_ROLES, type Role } from "./roles";

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

const RoleSchema = z.enum(ALL_ROLES);

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
  applies_to: z.array(RoleSchema).min(1).max(20).default(["Dominant", "submissive", "switch"]),
});

export const listQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        category_id: z.string().uuid().optional(),
        includeInactive: z.boolean().default(true),
        risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
        applies_to: RoleSchema.optional(),
        search: z.string().trim().max(200).optional(),
        limit: z.number().int().min(1).max(1000).default(50),
        offset: z.number().int().min(0).default(0),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    let q = sb
      .from("questions")
      .select("*", { count: "exact" })
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (!data.includeInactive) q = q.eq("active", true);
    if (data.risk_level) q = q.eq("risk_level", data.risk_level);
    if (data.applies_to) q = q.contains("applies_to", [data.applies_to]);
    if (data.search) q = q.ilike("question", `%${data.search}%`);
    q = q.range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { questions: rows ?? [], total: count ?? 0 };
  });

export const bulkSetAppliesTo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(2000),
        applies_to: z.array(RoleSchema).min(1).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    const { error } = await sb
      .from("questions")
      .update({ applies_to: data.applies_to })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true as const, updated: data.ids.length };
  });

// ---------- AI-assisted retag ----------

const AI_SYSTEM_PROMPT = `You categorize BDSM / power-exchange assessment questions by which participant role(s) they meaningfully apply to.

Available roles:
Top / leading family: Dominant, Master, sadist, rope top, service top, degradation giver, exhibitionist
Bottom / receiving family: submissive, slave, brat, little, pet, masochist, rope bottom, service bottom, degradation receiver, voyeur
Switch / fluid family: switch, primal, caregiver, exhibitionist, voyeur

Rules:
- Every question must be tagged with at least one role.
- Use a SPECIFIC archetype only when the question clearly targets that dynamic (e.g., bratting, littlespace, rope suspension, service submission, primal play).
- Use the broad roles "Dominant", "submissive", or "switch" for questions that apply to the whole family but are not archetype-specific.
- For fully role-neutral questions (general safety, consent, communication, hard limits negotiation between equals), tag the three broad roles: Dominant, submissive, switch.
- "exhibitionist" and "voyeur" apply to either side of a dynamic; use them only when the question is specifically about showing or watching.
- Prefer fewer, precise tags over many broad ones.
- Return ONLY the structured tool call.`;

export const aiSuggestAndApplyAppliesTo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        apply: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);
    const { data: rows, error } = await sb
      .from("questions")
      .select("id, question, applies_to, question_categories(name)")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    const items = (rows ?? []).map((r: any) => ({
      id: r.id as string,
      question: r.question as string,
      category: r.question_categories?.name ?? null,
      current: (r.applies_to ?? []) as string[],
    }));

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const tool = {
      type: "function",
      function: {
        name: "submit_tags",
        description: "Submit role tags for each question.",
        parameters: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  applies_to: {
                    type: "array",
                    items: { type: "string", enum: ["Dominant", "submissive", "switch"] },
                  },
                },
                required: ["id", "applies_to"],
                additionalProperties: false,
              },
            },
          },
          required: ["results"],
          additionalProperties: false,
        },
      },
    };

    // Chunk to keep prompt size reasonable
    const chunks: typeof items[] = [];
    const CHUNK = 40;
    for (let i = 0; i < items.length; i += CHUNK) chunks.push(items.slice(i, i + CHUNK));

    const suggestions = new Map<string, ("Dominant" | "submissive" | "switch")[]>();
    for (const chunk of chunks) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: AI_SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ questions: chunk }) },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "submit_tags" } },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        if (resp.status === 429) throw new Error("Rate limits exceeded, try again shortly.");
        if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace.");
        throw new Error(`AI gateway error (${resp.status}): ${t.slice(0, 200)}`);
      }
      const json = await resp.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) throw new Error("AI did not return structured tags.");
      const parsed = JSON.parse(call.function.arguments) as {
        results: { id: string; applies_to: ("Dominant" | "submissive" | "switch")[] }[];
      };
      for (const r of parsed.results ?? []) {
        const roles = Array.from(new Set(r.applies_to)).filter((x) =>
          ["Dominant", "submissive", "switch"].includes(x),
        ) as ("Dominant" | "submissive" | "switch")[];
        if (roles.length > 0) suggestions.set(r.id, roles);
      }
    }

    let updated = 0;
    if (data.apply && suggestions.size > 0) {
      // Group by identical role set to minimize update calls
      const groups = new Map<string, string[]>();
      for (const [id, roles] of suggestions) {
        const k = [...roles].sort().join("|");
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(id);
      }
      for (const [k, ids] of groups) {
        const roles = k.split("|") as ("Dominant" | "submissive" | "switch")[];
        const { error: uErr } = await sb
          .from("questions")
          .update({ applies_to: roles })
          .in("id", ids);
        if (uErr) throw new Error(uErr.message);
        updated += ids.length;
      }
    }

    return {
      ok: true as const,
      suggested: suggestions.size,
      updated,
      suggestions: Array.from(suggestions, ([id, applies_to]) => ({ id, applies_to })),
    };
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

export const adminResetJourneys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(500),
        mode: z.enum(["results_only", "delete_all"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = await assertAdmin(context.userId);

    // Always clear results + responses for the selected journeys
    const { error: rErr } = await sb.from("results").delete().in("journey_id", data.ids);
    if (rErr) throw new Error(rErr.message);
    const { error: respErr } = await sb.from("responses").delete().in("journey_id", data.ids);
    if (respErr) throw new Error(respErr.message);

    if (data.mode === "delete_all") {
      const { error: iErr } = await sb.from("invites").delete().in("journey_id", data.ids);
      if (iErr) throw new Error(iErr.message);
      const { error: jErr } = await sb.from("journeys").delete().in("id", data.ids);
      if (jErr) throw new Error(jErr.message);
    } else {
      // Reset journey status back to draft + clear completion timestamps on invites
      const { error: jErr } = await sb
        .from("journeys")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .in("id", data.ids);
      if (jErr) throw new Error(jErr.message);
      const { error: iErr } = await sb
        .from("invites")
        .update({ completed_at: null })
        .in("journey_id", data.ids);
      if (iErr) throw new Error(iErr.message);
    }

    return { ok: true, count: data.ids.length, mode: data.mode };
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
