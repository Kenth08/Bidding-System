const clients: Map<number, { controller: ReadableStreamDefaultController<Uint8Array> }> = new Map();
let seq = 1;

function encode(data: string) {
  return new TextEncoder().encode(data);
}

export function streamHandler() {
  const id = seq++;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clients.set(id, { controller });
      // send a connected ping
      controller.enqueue(encode(`event: connected\ndata: {"id":${id}}\n\n`));
    },
    cancel() {
      clients.delete(id);
    },
  });

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  return new Response(stream, { headers });
}

export function publishEvent(name: string, payload: unknown) {
  const data = `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`;
  const buf = encode(data);
  for (const [, { controller }] of clients) {
    try { controller.enqueue(buf); } catch (e) { /* ignore individual client errors */ }
  }
}

export default { streamHandler, publishEvent };
