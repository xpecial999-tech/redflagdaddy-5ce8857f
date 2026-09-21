-- Rebalance the submissive-side experience. The original block over-focused on
-- danger and self-protection, which made a healthy submissive role sound like a
-- problem to diagnose. Dedicated consent, boundaries and safety categories
-- retain those safeguards; these questions now assess positive role fit,
-- agency, trust, reliability and two-way feedback.

-- Staging originally retained the inherited ~500-question bank. Retire its
-- Submissive Skills block so new journeys cannot randomly draw the old,
-- repetitive and predominantly danger-framed questions.
UPDATE public.questions
SET active = false
WHERE category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

-- Seed the curated rows when the full curated-bank migration was not applied.
-- The following UPDATE statements also make this safe for databases where the
-- rows already exist.
WITH submissive_category AS (
  SELECT id FROM public.question_categories WHERE name = 'Submissive Skills' LIMIT 1
), seed(question, question_type, answer_options, weight, risk_level, order_index) AS (
  VALUES
    ('What makes submission feel meaningful and fulfilling to you?', 'multi_choice'::public.question_type, '[]'::jsonb, 2, 'low'::public.risk_level, 90),
    ('When a direction challenges you but remains within your agreements, what helps you stay connected and choose your response?', 'single_choice'::public.question_type, '[]'::jsonb, 4, 'high'::public.risk_level, 91),
    ('What helps a Dominant or top earn and maintain your trust?', 'multi_choice'::public.question_type, '[]'::jsonb, 4, 'high'::public.risk_level, 92),
    ('How do you want to handle commitments such as service, protocol, tasks, or rules when real life interferes?', 'single_choice'::public.question_type, '[]'::jsonb, 3, 'medium'::public.risk_level, 93),
    ('After a scene or period of protocol, how do you prefer to share feedback about what worked and what should change?', 'single_choice'::public.question_type, '[]'::jsonb, 4, 'high'::public.risk_level, 94)
)
INSERT INTO public.questions (
  category_id, question, question_type, answer_options, weight, risk_level,
  active, order_index, branch_logic, applies_to
)
SELECT
  c.id, s.question, s.question_type, s.answer_options, s.weight, s.risk_level,
  true, s.order_index, '{}'::jsonb,
  ARRAY['submissive','slave','brat','little','pet','masochist','rope bottom','service bottom','degradation receiver','switch','primal']::text[]
FROM seed s
CROSS JOIN submissive_category c
WHERE NOT EXISTS (
  SELECT 1 FROM public.questions q
  WHERE q.category_id = c.id AND q.order_index = s.order_index
);

UPDATE public.questions
SET
  question = 'What makes submission feel meaningful and fulfilling to you?',
  question_type = 'multi_choice'::public.question_type,
  answer_options = '[{"label":"Choosing to trust and surrender within clear agreements","value":"trust","score":2},{"label":"Service, structure, or following direction","value":"service","score":2},{"label":"Intensity, challenge, or sensation","value":"intensity","score":2},{"label":"Playfulness, connection, or personal growth","value":"connection","score":2},{"label":"I am still discovering what submission means to me","value":"discovering","score":1}]'::jsonb,
  weight = 2,
  risk_level = 'low'::public.risk_level,
  active = true
WHERE order_index = 90
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

UPDATE public.questions
SET
  question = 'When a direction challenges you but remains within your agreements, what helps you stay connected and choose your response?',
  question_type = 'single_choice'::public.question_type,
  answer_options = '[{"label":"Clear intent, trust, and knowing I can pause or ask questions.","value":"strong","score":10},{"label":"Encouragement and a check-in before continuing.","value":"developing","score":5},{"label":"Time to understand what is being asked of me.","value":"reflective","score":4},{"label":"I tend to comply even when I am no longer choosing it freely.","value":"risk","score":-10}]'::jsonb,
  weight = 4,
  risk_level = 'high'::public.risk_level,
  active = true
WHERE order_index = 91
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

UPDATE public.questions
SET
  question = 'What helps a Dominant or top earn and maintain your trust?',
  question_type = 'multi_choice'::public.question_type,
  answer_options = '[{"label":"Consistency between their words and actions","value":"consistency","score":3},{"label":"Curiosity about my needs, desires, and limits","value":"curiosity","score":3},{"label":"Calm leadership when plans need to change","value":"adaptability","score":3},{"label":"Welcoming honest feedback without punishment","value":"feedback","score":3},{"label":"I expect trust to be automatic once roles are agreed","value":"automatic","score":-8}]'::jsonb,
  weight = 4,
  risk_level = 'high'::public.risk_level,
  active = true
WHERE order_index = 92
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

UPDATE public.questions
SET
  question = 'How do you want to handle commitments such as service, protocol, tasks, or rules when real life interferes?',
  question_type = 'single_choice'::public.question_type,
  answer_options = '[{"label":"Communicate early, explain what changed, and agree on an adjustment.","value":"strong","score":10},{"label":"Ask for flexibility while still taking the commitment seriously.","value":"developing","score":5},{"label":"Wait and see whether my partner notices I could not follow through.","value":"unclear","score":0},{"label":"Hide the problem because admitting it would make me a bad submissive.","value":"risk","score":-8}]'::jsonb,
  weight = 3,
  risk_level = 'medium'::public.risk_level,
  active = true
WHERE order_index = 93
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

UPDATE public.questions
SET
  question = 'After a scene or period of protocol, how do you prefer to share feedback about what worked and what should change?',
  question_type = 'single_choice'::public.question_type,
  answer_options = '[{"label":"An honest debrief where appreciation and adjustments are both welcome.","value":"strong","score":10},{"label":"A later conversation once I have processed the experience.","value":"developing","score":6},{"label":"Gentle prompts from my partner help me put it into words.","value":"supported","score":5},{"label":"I avoid feedback because it feels incompatible with submission.","value":"risk","score":-9}]'::jsonb,
  weight = 4,
  risk_level = 'high'::public.risk_level,
  active = true
WHERE order_index = 94
  AND category_id IN (SELECT id FROM public.question_categories WHERE name = 'Submissive Skills');

-- These legacy questions assess the person leading or topping. They had been
-- reactivated with broad inherited tags and could therefore leak into a
-- submissive pack from otherwise-neutral categories.
UPDATE public.questions
SET applies_to = ARRAY['Dominant','Master','sadist','rope top','service top','degradation giver','switch','primal','caregiver']::text[]
WHERE question IN (
  'Do you take active responsibility for ensuring your partner is in a state of mind to provide ''Continuous Consent'' throughout a session?',
  'Scenario: During a scene, you notice your partner appears visibly distressed or ''checked out,'' but they haven''t used their safeword yet. What is your response?',
  'Scenario: Your partner is crying during a heavy impact scene, but they have not used their safeword. How do you respect their boundary?',
  'When using "hoods" or "sensory deprivation," do you ensure the partner’s airway is constantly monitored and visible?',
  'Scenario: You accidentally hit a "no-go" zone (like the kidney) during impact play. What is your immediate action?',
  'Do all mechanical restraints/locks you use have an emergency release or an easily accessible key?',
  'Scenario: A partner asks for a high-risk activity (e.g., blood play) that you have never done. What is your process?',
  'As a dominant/top, are you comfortable providing emotional labor and nurturing after exerting power?',
  'Scenario: During a scene, you notice your partner''s body language suggests they are in distress, but they haven''t used a safeword. What is your conflict-prevention move?',
  'If you sense a subtle shift in your partner''s energy that suggests discomfort—even if they haven''t used a safeword—how do you respond?',
  'While topping, you realize you used a technique your partner explicitly listed as a ''Hard Limit.'' What is your immediate response?',
  'Scenario: Your partner is using the agreed-upon ''yellow'' light (slow down/check in), but their body language suggests they are actually in ''red'' (stop). What do you do?',
  'Scenario: You notice your partner’s breathing has become erratic and they have stopped moving during a scene. What is your response?',
  'Scenario: Your partner seems emotionally fragile or tearful after a heavy session. How do you handle this?',
  'How do you view your responsibility toward a partner''s physical safety when you are in a dominant/top role?'
);

-- No question in the Dominant Skills category belongs in a submissive pack,
-- even if the inherited row carried the broad default role tags.
UPDATE public.questions
SET applies_to = ARRAY['Dominant','Master','sadist','rope top','service top','degradation giver','switch','primal','caregiver']::text[]
WHERE category_id IN (SELECT id FROM public.question_categories WHERE name = 'Dominant Skills');

-- Conversely, keep the legacy submissive-skill checks on the receiving side.
UPDATE public.questions
SET applies_to = ARRAY['submissive','slave','brat','little','pet','masochist','rope bottom','service bottom','degradation receiver','switch','primal']::text[]
WHERE question IN (
  'Scenario: You are in an intense scene and realize your hand has gone numb, but your partner is highly focused on the activity. What do you do?',
  'Scenario: A partner attempts to introduce a new tool or act that was explicitly listed as a ''Hard Limit'' during negotiation. How do you respond?',
  'How would you describe your ability to maintain your own physical and emotional safety boundaries during a scene without relying solely on your partner?',
  'If a scene is moving in a direction that triggers a ''hard limit'' you previously set, what is your most likely response?',
  'Do you believe that you have the right to revoke consent at any time, for any reason, regardless of the ''role'' you are playing?'
);
