import { NextRequest } from 'next/server';

function parseSSELine(line: string): { event?: string; data?: string } {
  const trimmed = line.trim();
  if (trimmed.startsWith('event: ')) return { event: trimmed.slice(7).trim() };
  if (trimmed.startsWith('data: ')) return { data: trimmed.slice(6).trim() };
  return {};
}

export async function POST(req: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const body = await req.json();
  const authorization = req.headers.get('authorization');

  const backendRes = await fetch(`${backendUrl}/api/visualizations/generate-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({ message: 'Backend error' }));
    return Response.json(err, { status: backendRes.status });
  }

  const reader = backendRes.body!.getReader();
  const decoder = new TextDecoder();

  // ── Buffer until we have the complete init SSE event ──
  // The init event arrives first and contains the viz id/title.
  // We need it before creating the response so we can set headers.
  let preamble = '';
  let initId: number | null = null;
  let initTitle: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    preamble += decoder.decode(value, { stream: true });

    // SSE events are separated by \n\n
    const eventEnd = preamble.indexOf('\n\n');
    if (eventEnd === -1) continue;

    // Parse all complete events from the preamble
    const parts = preamble.split('\n\n');
    for (let i = 0; i < parts.length - 1; i++) {
      const event = parts[i];
      let currentEvent = '';
      for (const line of event.split('\n')) {
        const parsed = parseSSELine(line);
        if (parsed.event) currentEvent = parsed.event;
        if (parsed.data && currentEvent === 'init') {
          try {
            const init = JSON.parse(parsed.data);
            initId = init.id;
            initTitle = init.title;
          } catch {/* skip */}
        }
      }
    }

    // If we found the init event, keep the leftover and start the stream
    if (initId !== null) {
      preamble = parts[parts.length - 1];
      break;
    }
  }

  // ── Create streaming plain-text response ──
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  if (initId != null) headers.set('X-Viz-Id', String(initId));
  if (initTitle) headers.set('X-Viz-Title', encodeURIComponent(initTitle));

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = preamble;
      let currentEvent = '';
      let streamEnded = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Accumulate new data into buffer, then split into complete lines
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // keep partial line for next iteration

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('event: ')) {
              currentEvent = trimmed.slice(7).trim();
            } else if (trimmed.startsWith('data: ')) {
              const payload = trimmed.slice(6).trim();
              try {
                const parsed = JSON.parse(payload);
                if (currentEvent === 'chunk' && parsed.text) {
                  controller.enqueue(new TextEncoder().encode(parsed.text));
                } else if (currentEvent === 'error') {
                  controller.error(new Error(parsed.message || 'Generation failed'));
                  streamEnded = true;
                  return;
                }
              } catch {/* skip malformed JSON */}
              currentEvent = '';
            }
          }
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'Generation failed') {
          controller.error(e);
          streamEnded = true;
        }
      } finally {
        reader.releaseLock();
        if (!streamEnded) {
          try { controller.close(); } catch { /* already closed */ }
        }
      }
    },
  });

  return new Response(stream, { headers });
}
