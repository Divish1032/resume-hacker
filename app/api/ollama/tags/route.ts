import { NextResponse } from "next/server";

export async function GET() {
  // On serverless platforms like Vercel, Ollama (local) is never available.
  // Return available: false so the UI can gracefully disable the Ollama option.
  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
  if (isServerless) {
    return NextResponse.json({ models: [], available: false }, { status: 200 });
  }

  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: AbortSignal.timeout(3000), // 3s timeout, don't hang
    });

    if (!response.ok) {
      return NextResponse.json({ models: [], available: false }, { status: 200 });
    }

    const data = await response.json();
    const models = data.models ?? [];
    return NextResponse.json({ models, available: models.length > 0 });
  } catch {
    // Ollama not running locally — not an error, just unavailable
    return NextResponse.json({ models: [], available: false }, { status: 200 });
  }
}
