// Provider-agnostic LLM layer.
//
// Every supported provider exposes an OpenAI-compatible /chat/completions
// endpoint with function/tool calling, so one client drives all of them.
// Pick with AI_PROVIDER in .env; override the model with AI_MODEL.

export type ProviderName = "openrouter" | "gemini" | "groq" | "mistral";

type ProviderConfig = {
  baseURL: string;
  apiKey: string | undefined;
  defaultModel: string;
  extraHeaders?: Record<string, string>;
};

function configFor(name: ProviderName): ProviderConfig {
  switch (name) {
    case "openrouter":
      return {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultModel: "google/gemini-2.5-flash",
        extraHeaders: {
          "HTTP-Referer": "https://africhain.app",
          "X-Title": "Africhain",
        },
      };
    case "gemini":
      return {
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: process.env.GEMINI_API_KEY,
        defaultModel: "gemini-2.5-flash",
      };
    case "groq":
      return {
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
        defaultModel: "llama-3.3-70b-versatile",
      };
    case "mistral":
      return {
        baseURL: "https://api.mistral.ai/v1",
        apiKey: process.env.MISTRAL_API_KEY,
        defaultModel: "mistral-large-latest",
      };
  }
}

export function activeProvider(): ProviderName {
  const p = (process.env.AI_PROVIDER || "").toLowerCase() as ProviderName;
  if (p === "openrouter" || p === "gemini" || p === "groq" || p === "mistral") return p;
  // Auto-pick the first provider that actually has a key.
  const order: ProviderName[] = ["openrouter", "gemini", "groq", "mistral"];
  for (const name of order) if (configFor(name).apiKey) return name;
  return "openrouter";
}

// ---- OpenAI-compatible chat types (only what we use) ----

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatResponse = {
  choices: {
    message: { role: "assistant"; content: string | null; tool_calls?: ToolCall[] };
    finish_reason: string;
  }[];
};

export async function chat(
  messages: ChatMessage[],
  tools: ToolDef[]
): Promise<ChatResponse["choices"][number]["message"]> {
  const name = activeProvider();
  const cfg = configFor(name);
  if (!cfg.apiKey) {
    throw new Error(
      `No API key for provider "${name}". Add its key to .env (e.g. OPENROUTER_API_KEY) or set AI_PROVIDER.`
    );
  }
  const model = process.env.AI_MODEL || cfg.defaultModel;

  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.extraHeaders || {}),
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${name} error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as ChatResponse;
  return data.choices[0].message;
}
