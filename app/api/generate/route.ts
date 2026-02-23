import { ollama } from 'ai-sdk-ollama';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText, LanguageModel } from 'ai';

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const { prompt, model, provider, apiKey } = body;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return jsonError("Prompt is required and cannot be empty", 400);
  }

  // ── Serverless guard: Ollama requires a local server, not available on Vercel ──
  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
  if (isServerless && (provider === "ollama" || !provider)) {
    return jsonError(
      "Ollama is only available when running locally. Please select a cloud provider (OpenAI, Anthropic, Gemini, DeepSeek) and enter your API key.",
      400
    );
  }

  if (!model || typeof model !== "string" || !model.trim()) {
    return jsonError("Model name is required. Please select a model from the settings.", 400);
  }

  // Cloud provider key checks (server-side fallback check)
  const cloudProviders = ["openai", "anthropic", "google", "deepseek"];
  if (cloudProviders.includes(provider)) {
    const envKeys: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
    };
    const resolvedKey = apiKey || envKeys[provider];
    if (!resolvedKey) {
      return jsonError(
        `No API key provided for ${provider}. Add it in the settings or set it in your .env file.`,
        401
      );
    }
  }

  // ── Build model instance ──────────────────────────────────────────────────
  let modelInstance: LanguageModel;

  try {
    switch (provider) {
      case 'openai': {
        const openai = createOpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        modelInstance = openai(model);
        break;
      }
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
        modelInstance = anthropic(model);
        break;
      }
      case 'google': {
        const google = createGoogleGenerativeAI({ apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY });
        modelInstance = google(model);
        break;
      }
      case 'deepseek': {
        const deepseek = createDeepSeek({ apiKey: apiKey || process.env.DEEPSEEK_API_KEY });
        modelInstance = deepseek(model);
        break;
      }
      case 'ollama':
        modelInstance = ollama(model);
        break;
      default:
        return jsonError(
          `Unknown provider "${provider}". Please select a valid provider from the settings.`,
          400
        );
    }
  } catch (err) {
    console.error("Failed to initialize model:", err);
    return jsonError("Failed to initialize the AI model. Check your provider and model settings.", 500);
  }

  // ── Stream ────────────────────────────────────────────────────────────────
  try {
    const result = streamText({
      model: modelInstance,
      prompt: prompt.trim(),
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("Generation error:", error);

    // Surface helpful Ollama errors
    if (provider === "ollama" || !provider) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
        return jsonError(
          "Cannot connect to Ollama. Make sure Ollama is running locally (ollama serve).",
          503
        );
      }
      if (msg.toLowerCase().includes("model") && msg.toLowerCase().includes("not found")) {
        return jsonError(`Ollama model "${model}" is not installed. Run: ollama pull ${model}`, 404);
      }
    }

    const errorMessage = error instanceof Error ? error.message : "An error occurred during generation";
    return new Response(errorMessage, { status: 500 });
  }
}
