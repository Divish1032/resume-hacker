import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
  if (isServerless) {
    return new Response(JSON.stringify({ error: "Ollama not available on serverless" }), { status: 503 });
  }

  const { name } = await req.json();
  if (!name) return new Response(JSON.stringify({ error: "name required" }), { status: 400 });

  const encoder = new TextEncoder();

  // Use the request's own abort signal so that when the client disconnects
  // (or explicitly cancels), the upstream Ollama fetch is also aborted.
  const signal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      // If client already disconnected before we even started
      if (signal.aborted) {
        controller.close();
        return;
      }

      // Close the stream immediately when the client aborts
      signal.addEventListener("abort", () => {
        try { controller.close(); } catch { /* already closed */ }
      });

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        const ollamaRes = await fetch("http://127.0.0.1:11434/api/pull", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, stream: true }),
          signal, // ← propagate abort to Ollama
        });

        if (!ollamaRes.ok || !ollamaRes.body) {
          send({ error: `Ollama returned ${ollamaRes.status}` });
          controller.close();
          return;
        }

        reader = ollamaRes.body.getReader();
        const dec = new TextDecoder();
        let buf = "";

        while (true) {
          // Bail out early if the client cancelled
          if (signal.aborted) break;

          const { value, done } = await reader.read();
          if (done) break;

          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              send(parsed);
            } catch {
              // Skip malformed lines
            }
          }
        }

        // Only send success if NOT aborted
        if (!signal.aborted) {
          send({ status: "success" });
        }
      } catch (err) {
        // AbortError is expected when user cancels — don't send an error event
        if (err instanceof Error && err.name === "AbortError") {
          // Intentional cancel — nothing to do
        } else {
          send({ error: String(err) });
        }
      } finally {
        try { reader?.cancel(); } catch { /* ignore */ }
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
