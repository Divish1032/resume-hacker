import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Tells the client which providers have API keys configured in the environment.
// Never exposes actual key values — only booleans.
export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  });
}
