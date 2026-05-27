export const runtime = 'edge';

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // send an initial comment to establish the SSE connection
      controller.enqueue(encoder.encode(': connected\n\n'));
    },
    cancel() {
      // no-op
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
