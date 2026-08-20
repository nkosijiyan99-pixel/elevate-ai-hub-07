import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Loader2, Sparkles, Telescope } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { saveHistory } from "@/lib/storage";
import { copyText, downloadText, extractJson, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | WorkFlow AI" },
      {
        name: "description",
        content:
          "Get structured business research briefs with insights, opportunities, risks, recommendations and quick facts.",
      },
      { property: "og:title", content: "AI Research Assistant | WorkFlow AI" },
      {
        property: "og:description",
        content: "Professional research reports generated from any workplace topic or question.",
      },
    ],
  }),
  component: ResearchPage,
});

type ResearchResult = {
  summary: string;
  insights: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
  quickFacts: Array<{ label: string; value: string }>;
};

const SYSTEM = `You are a senior business analyst producing concise executive research briefs.
Respond with ONLY a JSON object with keys: summary (string, 4-6 sentences), insights (array of 4 strings), opportunities (array of 3 strings), risks (array of 3 strings), recommendations (array of 4 strings), quickFacts (array of 4 objects with label and value). Be specific and avoid inventing precise statistics you cannot support; qualify uncertain figures.`;

function ListBlock({ title, items, dot }: { title: string; items?: string[]; dot: string }) {
  return (
    <section className="glass-card p-5">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {(items ?? []).map((i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
            {i}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResearchPage() {
  const { generate, loading } = useAi();
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  const asText = (r: ResearchResult) =>
    [
      "SUMMARY",
      r.summary,
      "",
      "KEY INSIGHTS",
      ...r.insights.map((i) => `- ${i}`),
      "",
      "OPPORTUNITIES",
      ...r.opportunities.map((i) => `- ${i}`),
      "",
      "RISKS",
      ...r.risks.map((i) => `- ${i}`),
      "",
      "RECOMMENDATIONS",
      ...r.recommendations.map((i) => `- ${i}`),
    ].join("\n");

  async function run() {
    if (!topic.trim()) return;
    const text = await generate({ system: SYSTEM, prompt: topic, json: true });
    if (!text) return;
    const parsed = extractJson<ResearchResult>(text);
    if (!parsed) return;
    setResult(parsed);
    saveHistory({
      kind: "research",
      title: topic.slice(0, 70),
      preview: parsed.summary.slice(0, 140),
      content: asText(parsed),
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Feature 04"
        title="AI Research Assistant"
        description="Ask a workplace question, paste an article or name a topic — receive a structured, decision-ready brief."
      />

      <section className="glass-card space-y-3 p-5">
        <Label htmlFor="topic">Research topic, article or question</Label>
        <Textarea
          id="topic"
          rows={4}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="How should a 40-person operations team adopt AI workflow automation in 2026?"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void run()} disabled={loading || !topic.trim()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Telescope className="size-4" />}
            Generate report
          </Button>
          {result && (
            <>
              <Button variant="outline" onClick={() => void copyText(asText(result))}>
                <Copy className="size-4" /> Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadText("research-brief.txt", asText(result))}
              >
                <Download className="size-4" /> Export
              </Button>
            </>
          )}
        </div>
      </section>

      {loading && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !result && (
        <div className="glass-card mt-4 flex min-h-56 flex-col items-center justify-center gap-2 p-8 text-center">
          <Sparkles className="size-6 text-accent" aria-hidden />
          <p className="text-sm font-medium">Your research report will appear here</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Summary, key insights, opportunities, risks, recommendations and quick facts.
          </p>
        </div>
      )}

      {!loading && result && (
        <div className="mt-4 space-y-4">
          <section className="glass-card p-5">
            <h2 className="mb-2 text-sm font-semibold">Summary</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {result.quickFacts?.map((f) => (
              <div key={f.label} className="glass-card surface-hover p-5">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="mt-1 text-lg font-semibold">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock title="Key insights" items={result.insights} dot="bg-primary" />
            <ListBlock title="Opportunities" items={result.opportunities} dot="bg-success" />
            <ListBlock title="Risks" items={result.risks} dot="bg-destructive" />
            <ListBlock title="Recommendations" items={result.recommendations} dot="bg-accent" />
          </div>
        </div>
      )}
    </AppShell>
  );
}