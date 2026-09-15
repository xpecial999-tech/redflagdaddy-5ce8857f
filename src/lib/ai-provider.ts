const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "nex-agi/nex-n2.5-pro:free";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  enum?: string[];
  description?: string;
};

export type StructuredAiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JsonSchema;
  };
};

export type StructuredAiRequest = {
  messages: OpenRouterMessage[];
  tools: StructuredAiTool[];
  toolName: string;
  maxTokens?: number;
  temperature?: number;
};

function getOpenRouterModel(env: Record<string, string | undefined> = process.env): string {
  return env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

function getAppOrigin(env: Record<string, string | undefined> = process.env): string {
  return env.PUBLIC_SITE_URL?.trim() || env.PUBLIC_APP_URL?.trim() || "https://redflagdaddy.com";
}

function parseStructuredPayload(json: unknown, toolName: string): unknown {
  const message = (json as any)?.choices?.[0]?.message;
  const toolCall =
    message?.tool_calls?.find?.((call: any) => call?.function?.name === toolName) ??
    message?.tool_calls?.[0];
  const toolArguments = toolCall?.function?.arguments;
  if (toolArguments) return JSON.parse(toolArguments);

  const content = message?.content;
  if (typeof content === "string" && content.trim()) {
    const trimmed = content.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim();
    return JSON.parse(fenced || trimmed);
  }

  throw new Error("AI did not return structured output.");
}

export async function callStructuredAi<T>({
  messages,
  tools,
  toolName,
  maxTokens = 2500,
  temperature = 0.25,
}: StructuredAiRequest): Promise<T> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key?.trim()) throw new Error("OPENROUTER_API_KEY not configured");

  const resp = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getAppOrigin(),
      "X-OpenRouter-Title": "RedFlagDaddy",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages,
      tools,
      tool_choice: { type: "function", function: { name: toolName } },
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) throw new Error("AI rate limits exceeded, please try again later.");
    if (resp.status === 402) {
      throw new Error("OpenRouter credits exhausted or the selected model is unavailable.");
    }
    throw new Error(`OpenRouter AI error (${resp.status}): ${text.slice(0, 200)}`);
  }

  return parseStructuredPayload(await resp.json(), toolName) as T;
}
