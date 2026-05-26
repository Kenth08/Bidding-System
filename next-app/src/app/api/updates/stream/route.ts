import sse from "@/lib/sse";

export async function GET() {
  return sse.streamHandler();
}
