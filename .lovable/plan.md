## Goal

Make every slider/scale question in the assessment use the same "on a scale of 1 to 10" format — both in the wording shown to the user and in the underlying answer config used by the slider UI.

Today there are 121 `slider` + `scale` questions, with a mix of ranges (1–4, 1–5, 1–6, 0–100) and inconsistent prompt wording ("On a scale of 1 to 4…", "Rate the…", "How comfortable…").

## Changes

### 1. Database migration — normalize all slider/scale questions

For every question where `question_type IN ('slider','scale')`:

- **`answer_options`** → set to `[{"min": 1, "max": 10, "step": 1}]`
  (This is the shape the slider UI already reads from `answer_options[0]`. The `scale` renderer is already hardcoded to 1–10 and will keep working.)
- **`question` text** → rewrite any "on a scale of 1 to N" / "On a scale of 1-N" phrase to "on a scale of 1 to 10". Questions that don't currently mention a scale (e.g. "How important is aftercare to you?") get " (on a scale of 1 to 10)" appended so the rubric is explicit.

Scoring continues to work via the existing `computeScore` path for `slider`/`scale`: `score = answer * weight`. Per-option `score` values in the old `answer_options` are dropped — they were only meaningful for the old non-uniform ranges.

### 2. Frontend — no code changes required

`src/routes/assessment.$code.tsx` already:
- Renders `scale` as a 1–10 slider regardless of options.
- Renders `slider` from `{min, max, step}` in `answer_options[0]`, defaulting to mid-range, with the NaN guards we added previously.

After the migration both branches will render identical 1–10 sliders.

### 3. Existing responses

Old responses with answers like `"3"` (on a 1–4 scale) will keep their stored value, but they'll display on a 1–10 slider. We won't back-fill historical responses — only new submissions use the unified 1–10 scale. If you'd rather we wipe or rescale historical responses, say so and I'll add that to the migration.

## Out of scope

- No change to question categories, weights, branching, or which questions apply to which participant type.
- No change to `single_choice`, `multi_choice`, `boolean`, `scenario`, or `text` questions.
- No change to results calculation logic.
