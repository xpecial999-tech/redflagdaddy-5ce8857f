-- Reactivate a vetted subset of legacy imported questions to expand the random assessment pool.
-- Deliberately excludes legacy free-text, raw scale/slider rows, partner-judgement wording,
-- and highly technical/niche rows that can skew short assessments.

WITH legacy_questions(question) AS (
  VALUES
    ('How comfortable do you feel expressing your desires or boundaries to your partner(s)?'), -- Communication #0
    ('Do you have a pre-negotiated safeword or signal that is used to halt all activity immediately?'), -- Communication #1
    ('How often do you engage in formal negotiation prior to a scene or high-intensity play?'), -- Communication #2
    ('Do you have a non-verbal way to communicate "Slow Down" if you are unable to speak (e.g., due to a gag or intense sensation)?'), -- Communication #9
    ('In your BDSM relationship, how honest can you be about your level of enjoyment or discomfort?'), -- Communication #16
    ('Scenario: During a scene, you notice your partner appears visibly distressed or ''checked out,'' but they haven''t used their safeword yet. What is your response?'), -- Consent #32
    ('Do you agree that consent can be withdrawn at any time, for any reason, even after a scene has started?'), -- Consent #27
    ('Do you take active responsibility for ensuring your partner is in a state of mind to provide ''Continuous Consent'' throughout a session?'), -- Consent #36
    ('Which best describes your understanding of ''Informed Consent''?'), -- Consent #41
    ('Scenario: You have planned a high-intensity scene for weeks. Right before starting, your partner expresses they are too tired and want to cancel. How do you respond?'), -- Consent #42
    ('Scenario: You are in the middle of an intense scene and your partner uses a pre-agreed Safeword. What is your immediate response?'), -- Boundaries #58
    ('Scenario: A partner attempts to introduce a ''Hard Limit'' activity into a scene without asking, claiming they ''thought you''d like it''. What is your response?'), -- Boundaries #74
    ('Scenario: Your partner is crying during a heavy impact scene, but they have not used their safeword. How do you respect their boundary?'), -- Boundaries #67
    ('Do you believe you have the right to revoke consent at any point during a scene, regardless of prior agreements?'), -- Boundaries #54
    ('How would you describe your current understanding of your personal hard limits (tasks or acts you will never engage in)?'), -- Boundaries #53
    ('How do you typically implement safewords during a scene?'), -- Safety Practices #237
    ('When using "hoods" or "sensory deprivation," do you ensure the partner’s airway is constantly monitored and visible?'), -- Safety Practices #249
    ('Scenario: You accidentally hit a "no-go" zone (like the kidney) during impact play. What is your immediate action?'), -- Safety Practices #252
    ('Do all mechanical restraints/locks you use have an emergency release or an easily accessible key?'), -- Safety Practices #255
    ('Scenario: A partner asks for a high-risk activity (e.g., blood play) that you have never done. What is your process?'), -- Safety Practices #260
    ('Are you willing to remain with your partner until they have physically and emotionally returned to a ''baseline'' state?'), -- Aftercare #455
    ('Do you consider aftercare to be a mandatory part of a BDSM encounter, regardless of the scene''s length?'), -- Aftercare #449
    ('As a dominant/top, are you comfortable providing emotional labor and nurturing after exerting power?'), -- Aftercare #458
    ('In a scenario where you are feeling neglected after a scene, how do you respond?'), -- Aftercare #463
    ('Do you agree to never engage in BDSM activities while under the influence of substances that impair judgment or coordination?'), -- Trust #318
    ('Scenario: You accidentally crossed a minor boundary your partner set. How do you respond when they bring it up?'), -- Trust #327
    ('Scenario: A partner reveals they have past trauma that affects their ability to trust in certain positions. How do you react?'), -- Trust #335
    ('Do you believe that consent can be revoked at any time, for any reason, regardless of prior agreements?'), -- Trust #323
    ('Is consent in a Power Exchange dynamic an ongoing process or a one-time agreement?'), -- Power Exchange #444
    ('What role does ''Aftercare'' play in your power exchange experience? Select all that apply.'), -- Power Exchange #433
    ('Do you believe that ''owning'' a person in a D/s context means they no longer have the legal or moral right to say ''No''?'), -- Power Exchange #434
    ('In a ''Master/slave'' or ''Dominant/submissive'' scenario, how should a ''Yellow Light'' (slow down/check-in) be handled?'), -- Power Exchange #429
    ('Scenario: During a scene, you notice your partner''s body language suggests they are in distress, but they haven''t used a safeword. What is your conflict-prevention move?'), -- Conflict Resolution #271
    ('Scenario: You accidentally used a trigger word that wasn''t on the ''hard limit'' list, causing your partner distress. How do you handle the aftermath?'), -- Conflict Resolution #285
    ('Scenario: Mid-way through a multi-day protocol, a partner realizes a previously ''okay'' act is now a ''hard limit''. How do you resolve this immediate shift?'), -- Conflict Resolution #289
    ('Are you willing to take full responsibility and offer a sincere apology if you realize you have violated a partner''s boundary?'), -- Conflict Resolution #265
    ('Scenario: You and your partner have a fundamental disagreement on a non-kink life decision (e.g., finances). How should this be handled within your desired dynamic?'), -- Relationship Goals #139
    ('Scenario: Your partner expresses a hard limit on a kink that is a major goal for you. How do you respond?'), -- Relationship Goals #152
    ('Is maintaining a regular ''check-in'' schedule for discussing the health of the relationship a goal for you?'), -- Relationship Goals #140
    ('What is your goal for continuing education and skill-building within the relationship?'), -- Relationship Goals #149
    ('If you sense a subtle shift in your partner''s energy that suggests discomfort—even if they haven''t used a safeword—how do you respond?'), -- Emotional Intelligence #84
    ('When you are feeling irritable or emotionally ''raw'' from external stress, how do you manage that transition into a BDSM space?'), -- Emotional Intelligence #87
    ('Can you hold space for your partner’s difficult emotions without feeling the need to immediately ''fix'' them or make them go away?'), -- Emotional Intelligence #82
    ('When a partner provides feedback that a specific action caused them emotional distress, what is your primary reaction?'), -- Emotional Intelligence #85
    ('While topping, you realize you used a technique your partner explicitly listed as a ''Hard Limit.'' What is your immediate response?'), -- Accountability #110
    ('Scenario: Your partner is using the agreed-upon ''yellow'' light (slow down/check in), but their body language suggests they are actually in ''red'' (stop). What do you do?'), -- Accountability #127
    ('A partner tells you that a specific action you took felt ''coercive'' rather than ''consensual.'' What is your most likely reaction?'), -- Accountability #117
    ('Do you hold yourself accountable to a ''Sober Play'' policy (no alcohol/drugs before or during high-risk scenes)?'), -- Accountability #130
    ('Do you have a consistent practice for ''Aftercare'' or debriefing following an intense scene to address emotional needs and physical safety?'), -- Accountability #106
    ('Scenario: You notice your partner’s breathing has become erratic and they have stopped moving during a scene. What is your response?'), -- BDSM Experience #231
    ('Are you familiar with safety frameworks like SSC (Safe, Sane, Consensual) or RACK (Risk-Aware Consensual Kink)?'), -- BDSM Experience #212
    ('Scenario: Your partner seems emotionally fragile or tearful after a heavy session. How do you handle this?'), -- BDSM Experience #224
    ('How do you view your responsibility toward a partner''s physical safety when you are in a dominant/top role?'), -- BDSM Experience #236
    ('Scenario: During a scene, your partner expresses a new boundary they hadn''t mentioned before. How do you respond?'), -- Dominant Skills #165
    ('Do you proactively research the specific physical risks (e.g., nerve damage, circulation issues) associated with the impact or restraint tools you use?'), -- Dominant Skills #159
    ('Are you willing to stop a scene immediately if a ''Safe Word'' is used, regardless of your personal level of arousal or the flow of the scene?'), -- Dominant Skills #160
    ('Do you understand that consent can be withdrawn at any time, including mid-scene, even if it contradicts the ''role'' being played?'), -- Dominant Skills #178
    ('Do you keep a safety kit (e.g., safety shears, antiseptic, extra water) reachable during all play sessions?'), -- Dominant Skills #166
    ('Scenario: You are in an intense scene and realize your hand has gone numb, but your partner is highly focused on the activity. What do you do?'), -- Submissive Skills #201
    ('Scenario: A partner attempts to introduce a new tool or act that was explicitly listed as a ''Hard Limit'' during negotiation. How do you respond?'), -- Submissive Skills #206
    ('How would you describe your ability to maintain your own physical and emotional safety boundaries during a scene without relying solely on your partner?'), -- Submissive Skills #184
    ('If a scene is moving in a direction that triggers a ''hard limit'' you previously set, what is your most likely response?'), -- Submissive Skills #188
    ('Do you believe that you have the right to revoke consent at any time, for any reason, regardless of the ''role'' you are playing?'), -- Submissive Skills #186
    ('In your current dynamic, do you ever feel pressured or coerced into giving money or gifts against your better judgment?'), -- Financial Responsibility #290
    ('In a scenario where one partner loses their primary income, what is the agreed-upon protocol for financial BDSM?'), -- Financial Responsibility #298
    ('Do you have a "Soft Bound" or "Veto Power" that allows you to stop a transaction mid-way if you feel it''s unsafe?'), -- Financial Responsibility #313
    ('Do you have a pre-established "hard limit" or maximum budget for financial play/tribute per month?'), -- Financial Responsibility #293
    ('Imagine you have just finished a high-intensity scene and your partner needs to leave. What is your internal narrative?'), -- Attachment Style #402
    ('Do you find yourself looking for hidden meanings or ''tests'' in your partner''s actions?'), -- Attachment Style #403
    ('How does your attachment style typically manifest in your BDSM scenes?'), -- Attachment Style #409
    ('If a partner becomes temporarily emotionally unavailable due to stress, how do you respond?') -- Attachment Style #415
), updated AS (
  UPDATE public.questions q
  SET active = true
  FROM legacy_questions l
  WHERE q.question = l.question
    AND q.active = false
  RETURNING q.id
)
SELECT count(*) AS reactivated_legacy_questions FROM updated;
