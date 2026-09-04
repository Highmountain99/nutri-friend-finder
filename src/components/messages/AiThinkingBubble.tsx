/**
 * Frosted-glass placeholder bubble shown while the AI coach is composing a reply.
 * The bubble appears first, then shimmering lines hint that text is on its way.
 */
export function AiThinkingBubble() {
  return (
    <div className="flex justify-start animate-bubble-in">
      <div className="relative overflow-hidden max-w-[80%] rounded-2xl rounded-bl-md border border-white/40 bg-white/30 px-4 py-3 shadow-sm backdrop-blur-xl">
        <div className="space-y-2">
          <div className="h-3 w-40 rounded-full bg-foreground/10" />
          <div className="h-3 w-28 rounded-full bg-foreground/10" />
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-sweep" />
        </div>
      </div>
    </div>
  );
}
