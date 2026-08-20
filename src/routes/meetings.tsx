import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { saveHistory } from "@/lib/storage";
import { copyText, downloadText, extractJson, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Cadence" },
      {
        name: "description",
        content:
          "Turn long meeting notes into executive summaries, decisions, owned action items, risks and follow-ups.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Cadence" },
      {
        property: "og:description",
        content: "Executive summaries, decisions and action items extracted from raw meeting notes.",
      },
    ],
  }),
  component: MeetingsPage,
});

type ActionItem = { task: string; owner: string; priority: string; deadline: string };
type MeetingResult = {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  risks: string[];
  followUps: string[];
};

const SYSTEM = `You are a chief of staff who converts messy meeting notes into executive-ready summaries.
Respond with ONLY a JSON object with keys: summary (string, 3-5 sentences), decisions (array of strings), actionItems (array of objects with task, owner, priority one of High/Medium/Low, deadline), risks (array of strings), followUps (array of strings). If an owner or deadline is unknown, use "Unassigned" or "TBD".`;

const SAMPLE = `Roadmap sync — attendees: Thabo (Eng), Lerato (Design), Sam (PM), Kim (Support).
Sam: onboarding drop-off is 34% at step 3. We agreed to ship the simplified 2-step flow before end of month.
Thabo: needs a decision on migrating billing service, risk of downtime over month-end close.
Lerato will deliver revised onboarding designs by Tuesday. Kim raised that support macros are outdated.
Open question: do we delay the analytics dashboard to Q4? Sam to confirm with leadership by Friday.`;

function priorityTone(priority: string) {
  const p = priority?.toLowerCase();
  if (p === "high") return "bg-destructive/15 text-destructive hover:bg-destructive/15";
  if (p === "medium") return "bg-warning/20 text-warning-foreground hover:bg-warning/20";
  return "bg-success/15 text-success hover:bg-success/15";
}

function MeetingsPage() {
  const { generate, loading } = useAi();
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MeetingResult | null>(null);

  const asText = (r: MeetingResult) =>
    [
      "EXECUTIVE SUMMARY",
      r.summary,
      "",
      "KEY DECISIONS",
      ...r.decisions.map((d) => `- ${d}`),
      "",
      "ACTION ITEMS",
      ...r.actionItems.map((a) => `- ${a.task} | ${a.owner} | ${a.priority} | ${a.deadline}`),
      "",
      "RISKS",
      ...r.risks.map((d) => `- ${d}`),
      "",
      "FOLLOW-UPS",
      ...r.followUps.map((d) => `- ${d}`),
    ].join("\n");

  async function run() {
    if (!notes.trim()) return;
    const text = await generate({ system: SYSTEM, prompt: notes, json: true });
    if (!text) return;
    const parsed = extractJson<MeetingResult>(text);
    if (!parsed) return;
    setResult(parsed);
    saveHistory({
      kind: "meeting",
      title: parsed.summary.split(".")[0]?.slice(0, 70) || "Meeting summary",
      preview: parsed.summary.slice(0, 140),
      content: asText(parsed),
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Feature 02"
        title="Meeting Notes Summarizer"
        description="Paste raw notes or a transcript. Cadence extracts decisions, owned action items, risks and follow-ups."
        actions={
          <Button variant="outline" onClick={() => setNotes(SAMPLE)}>
            Load sample notes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="glass-card space-y-3 p-5 lg:col-span-2">
          <Label htmlFor="notes">Meeting notes</Label>
          <Textarea
            id="notes"
            rows={16}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your meeting notes or transcript here..."
            className="min-h-80 text-[13px]"
          />
          <Button className="w-full" onClick={() => void run()} disabled={loading || !notes.trim()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Summarize meeting
          </Button>
        </section>

        <div className="space-y-4 lg:col-span-3">
          {loading && (
            <div className="glass-card space-y-3 p-5">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!loading && !result && (
            <div className="glass-card flex min-h-64 flex-col items-center justify-center gap-2 p-8 text-center">
              <Sparkles className="size-6 text-accent" aria-hidden />
              <p className="text-sm font-medium">Structured meeting analysis appears here</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Executive summary, decisions, an action-item table, risks and follow-up recommendations.
              </p>
            </div>
          )}

          {!loading && result && (
            <>
              <section className="glass-card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Executive summary</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void copyText(asText(result))}>
                      <Copy className="size-4" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadText("meeting-summary.txt", asText(result))}
                    >
                      <Download className="size-4" /> Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void run()}>
                      <RefreshCcw className="size-4" /> Regenerate
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
              </section>

              <section className="glass-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Key decisions</h2>
                <ul className="space-y-2 text-sm">
                  {result.decisions?.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="glass-card overflow-hidden p-5">
                <h2 className="mb-3 text-sm font-semibold">Action items</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.actionItems?.map((a) => (
                        <TableRow key={a.task}>
                          <TableCell className="max-w-64 text-sm">{a.task}</TableCell>
                          <TableCell className="text-sm">{a.owner}</TableCell>
                          <TableCell>
                            <Badge className={priorityTone(a.priority)}>{a.priority}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{a.deadline}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="glass-card p-5">
                  <h2 className="mb-3 text-sm font-semibold">Risks identified</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.risks?.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="glass-card p-5">
                  <h2 className="mb-3 text-sm font-semibold">Follow-up recommendations</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.followUps?.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}