import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
  if (isServerless) return NextResponse.json({ error: "Ollama not available on serverless" }, { status: 503 });

  try {
    const res = await fetch("http://127.0.0.1:11434/api/show", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Model not found: ${name}` }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Ollama not reachable" }, { status: 503 });
  }
}
