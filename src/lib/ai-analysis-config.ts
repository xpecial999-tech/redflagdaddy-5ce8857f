type AiAnalysisEnvironment = Record<string, string | undefined>;

export function isAiAnalysisEnabled(env: AiAnalysisEnvironment = process.env): boolean {
  return (
    env.AI_ANALYSIS_MODE?.trim().toLowerCase() === "enabled" && Boolean(env.LOVABLE_API_KEY?.trim())
  );
}

export async function runWhenAiAnalysisEnabled<T>(
  operation: () => Promise<T>,
  env: AiAnalysisEnvironment = process.env,
): Promise<T | null> {
  if (!isAiAnalysisEnabled(env)) return null;
  return operation();
}
