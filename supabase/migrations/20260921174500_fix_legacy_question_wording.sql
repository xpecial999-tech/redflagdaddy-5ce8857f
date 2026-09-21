-- Align legacy prompt wording with the response control and remove a rigid,
-- one-size-fits-all aftercare assumption found during the staging E2E run.
UPDATE public.questions
SET question = 'How important is it to schedule regular check-ins where a power-exchange dynamic can be reviewed or renegotiated?'
WHERE question = 'How often should a power exchange dynamic be formally ''checked-in'' on or re-negotiated? (on a scale of 1 to 10)';

UPDATE public.questions
SET
  question = 'How do you prefer to agree aftercare with a new partner?',
  answer_options = '[
    {"label":"Discuss our individual needs in advance and agree on a flexible plan.","value":"planned_flexible","score":10},
    {"label":"Check in immediately afterward and arrange any later follow-up either person needs.","value":"responsive_followup","score":8},
    {"label":"Use a familiar routine, but adapt it when my partner asks.","value":"routine_adaptable","score":5},
    {"label":"I usually leave without checking what either of us needs.","value":"no_checkin","score":-8}
  ]'::jsonb,
  weight = 3,
  risk_level = 'medium'::public.risk_level
WHERE question = 'In a scene with a new partner, what is your minimum time commitment for aftercare?';
