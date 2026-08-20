import { createFileRoute } from "@tanstack/react-router";
import { Copy, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveHistory } from "@/lib/storage";
import { copyText, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Workplace AI Chat | WorkFlow AI" },
      {
        name: "description",
        content:
          "Chat with an AI workplace assistant for communication, productivity, research and career guidance.",
      },
      { property: "og:title", content: "Workplace AI Chat | WorkFlow AI" },
      {
        property: "og:description",
        content: "An always-on AI colleague for workplace communication and productivity.",
      },
    ],
  }),
  component: ChatPage,
});

type Message = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are WorkFlow AI, a pragmatic workplace assistant for professionals.
Help with workplace communication, productivity advice, task organisation, research support, professional writing and career development.
Be concise and structured: short paragraphs, bullet points where useful, and always end with a concrete next step. Never invent facts about the user's company.`;

const SUGGESTIONS = [
  "Help me push back on an unrealistic deadline",
  "How do I run a better weekly team stand-up?",
  "Draft talking points for my performance review",
  "Give me a system to stop context switching",
];

function ChatPage() {
  const { generate, loading } = useAi();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi Nkosingiphile 👋 I'm your workplace AI assistant. Ask me about communication, planning, research or career growth — or pick a suggested prompt below.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const history = messages.filter((m, i) => !(i === 0 && m.role === "assistant"));
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    const reply = await generate({ system: SYSTEM, prompt: trimmed, history });
    if (!reply) return;
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
    saveHistory({
      kind: "chat",
      title: trimmed.slice(0, 70),
      preview: reply.slice(0, 140),
      content: `You: ${trimmed}\n\nWorkFlow AI: ${reply}`,
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Feature 05"
        title="Workplace AI Chat"
        description="Your always-on AI colleague for tricky messages, planning decisions and professional guidance."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              setMessages([{ role: "assistant", content: "New conversation started. What are we solving?" }])
            }
          >
            New chat
          </Button>
        }
      />

      <div className="glass-card flex h-[calc(100vh-19rem)] min-h-[26rem] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <span className="brand-gradient-bg mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground">
                  <Sparkles className="size-4" aria-hidden />
                </span>
              )}
              <div
                className={`group max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap md:max-w-[70%] ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 bg-card"
                }`}
              >
                {m.content}
                {m.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => void copyText(m.content)}
                    aria-label="Copy response"
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="size-3" /> Copy
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="brand-gradient-bg flex size-8 items-center justify-center rounded-lg text-primary-foreground">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <span className="flex gap-1" aria-label="Assistant is typing">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border/70 p-3 md:p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              aria-label="Message WorkFlow AI"
              placeholder="Ask anything about your work..."
              className="max-h-40 min-h-11 resize-none"
            />
            <Button type="submit" size="icon" className="size-11 shrink-0" disabled={loading} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}