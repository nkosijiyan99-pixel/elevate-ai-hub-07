import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { copyText, downloadText, extractJson, useAi } from "@/lib/use-ai";
import { saveHistory } from "@/lib/storage";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | WorkFlow AI" },
      {
        name: "description",
        content:
          "Generate polished workplace emails with tone control, professionalism scoring and clarity feedback.",
      },
      { property: "og:title", content: "Smart Email Generator | WorkFlow AI" },
      {
        property: "og:description",
        content: "AI-written workplace emails with tone control and quality scoring.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Persuasive", "Executive", "Follow-Up", "Apology"];

type EmailResult = {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  professionalism: number;
  clarity: number;
  improvements: string[];
};

const SYSTEM = `You are an executive communications specialist. You write concise, high-signal workplace emails.
Respond with ONLY a JSON object with keys: subject (string), greeting (string), body (string, 2-4 short paragraphs separated by \\n\\n), closing (string), professionalism (integer 0-100), clarity (integer 0-100), improvements (array of 3 short strings).`;

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}/100</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function EmailPage() {
  const { generate, loading } = useAi();
  const [form, setForm] = useState({
    recipient: "",
    subject: "",
    purpose: "",
    context: "",
    tone: "Professional",
  });
  const [result, setResult] = useState<EmailResult | null>(null);
  const [draft, setDraft] = useState("");

  const asText = (r: EmailResult) =>
    `Subject: ${r.subject}\n\n${r.greeting}\n\n${r.body}\n\n${r.closing}`;

  async function run() {
    const prompt = `Recipient: ${form.recipient || "colleague"}
Subject hint: ${form.subject || "not specified"}
Purpose: ${form.purpose}
Additional context: ${form.context || "none"}
Tone: ${form.tone}`;

    const text = await generate({ system: SYSTEM, prompt, json: true });
    if (!text) return;
    const parsed = extractJson<EmailResult>(text);
    if (!parsed) return;
    setResult(parsed);
    setDraft(asText(parsed));
    saveHistory({
      kind: "email",
      title: parsed.subject,
      preview: parsed.body.slice(0, 140),
      content: asText(parsed),
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Feature 01"
        title="Smart Email Generator"
        description="Turn a rough intention into a polished, on-tone workplace email — with professionalism and clarity scoring."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <form
          className="glass-card space-y-4 p-5 lg:col-span-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              placeholder="Head of Finance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Q3 budget approval"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Email purpose</Label>
            <Textarea
              id="purpose"
              required
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Request sign-off on the revised Q3 budget before Friday."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Additional context</Label>
            <Textarea
              id="context"
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              placeholder="We reduced tooling spend by 12% and reallocated to hiring."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={form.tone} onValueChange={(tone) => setForm({ ...form, tone })}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            Generate email
          </Button>
        </form>

        <div className="space-y-4 lg:col-span-3">
          {loading && (
            <div className="glass-card space-y-3 p-5">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {!loading && !result && (
            <div className="glass-card flex h-full min-h-64 flex-col items-center justify-center gap-2 p-8 text-center">
              <Sparkles className="size-6 text-accent" aria-hidden />
              <p className="text-sm font-medium">Your generated email will appear here</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Describe the purpose, pick a tone and WorkFlow AI will draft a ready-to-send message.
              </p>
            </div>
          )}

          {!loading && result && (
            <>
              <section className="glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Generated draft</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void copyText(draft)}>
                      <Copy className="size-4" aria-hidden /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadText("workflow-ai-email.txt", draft)}
                    >
                      <Download className="size-4" aria-hidden /> Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void run()}>
                      <RefreshCcw className="size-4" aria-hidden /> Regenerate
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Subject line</p>
                <p className="text-base font-semibold">{result.subject}</p>
                <Label htmlFor="draft" className="mt-4 block text-xs text-muted-foreground">
                  Editable draft
                </Label>
                <Textarea
                  id="draft"
                  className="mt-2 min-h-72 font-mono text-[13px] leading-relaxed"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </section>

              <section className="glass-card space-y-4 p-5">
                <h2 className="text-sm font-semibold">Quality analysis</h2>
                <ScoreBar label="Professionalism" value={result.professionalism} />
                <ScoreBar label="Clarity" value={result.clarity} />
                <div>
                  <p className="mb-2 text-xs font-medium">Suggested improvements</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {result.improvements?.map((tip) => (
                      <li key={tip} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}