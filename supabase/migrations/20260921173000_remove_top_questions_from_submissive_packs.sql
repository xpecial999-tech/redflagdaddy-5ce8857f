-- A final role audit found top-side responsibility questions in otherwise
-- general categories. Keep them available to people who lead/top, but prevent
-- them from leaking into submissive-only packs.
UPDATE public.questions
SET applies_to = ARRAY[
  'Dominant','Master','sadist','rope top','service top',
  'degradation giver','switch','primal','caregiver'
]::text[]
WHERE question IN (
  'True or False: I believe it is my responsibility to ensure my partner fully understands the physical and emotional risks of a scene before we begin.',
  'A scene has just ended. What is your first instinctual action?',
  'If your "gut feeling" tells you something is wrong but no safeword has been used, what is your standard response?'
);
