import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, Loader2, Sparkles, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { completionRates, focusByHour, productivityTrend, toolUsage } from "@/lib/demo-data";
import { extractJson, useAi } from "@/lib/use-ai";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Productivity Insights | WorkFlow AI" },
      {
        name: "description",
        content:
          "An AI insights engine that scores your productivity, spots bottlenecks and recommends focus changes.",
      },
      { property: "og:title", content: "AI Productivity Insights | WorkFlow AI" },
      {
        property: "og:description",
        content: "Productivity scoring, performance summaries and smart recommendations powered by AI.",
      },
    ],
  }),
  component: InsightsPage,
});

type Insights = {
  score: number;
  summary: string;
  recommendations: string[];
  strengths: string[];
  bottlenecks: string[];
  opportunities: string[];
};

const SYSTEM = `You are an executive productivity analyst. Given workplace activity metrics, produce an intelligent assessment.
Respond with ONLY a JSON object with keys: score (integer 0-100), summary (string, 3-4 sentences referencing concrete numbers and time-of-day patterns), recommendations (array of 4 short actionable strings), strengths (array of 3 strings), bottlenecks (array of 3 strings), opportunities (array of 3 strings).`;

const METRICS = `Tasks completed this month: 121. Tasks overdue: 20. Average focused hours per weekday: 5.2.
Daily productivity scores (Mon-Sun): 68, 74, 71, 83, 88, 52, 46.
Focus level by hour: 07:00 32, 09:00 86, 11:00 92, 13:00 54, 15:00 71, 17:00 44.
AI tool usage: Chat 58, Email 42, Meetings 27, Research 23, Planner 19.
Weekly completed vs overdue: W1 24/6, W2 31/4, W3 28/7, W4 38/3.
Average context switches per day: 34. Meetings per week: 14.`;

const FALLBACK: Insights = {
  score: 87,
  summary:
    "Your productivity increased by 18% this week, driven by a strong Thursday and Friday where you completed 23 tasks combined. Most completed work was high-priority, and your focus peaks between 09:00 and 12:00. Overdue items cluster after 13:00, when context switching spikes to 34 per day.",
  recommendations: [
    "Protect 09:00–12:00 as a no-meeting deep work block.",
    "Batch email and chat replies into two 20-minute windows.",
    "Move high-priority deadlines earlier in the week.",
    "Cap daily meetings at three to reduce fragmentation.",
  ],
  strengths: [
    "Consistent completion of high-priority work",
    "Strong morning focus and follow-through",
    "Growing leverage from AI drafting tools",
  ],
  bottlenecks: [
    "34 context switches per day fragments deep work",
    "Afternoon energy dip between 13:00 and 15:00",
    "Overdue tasks concentrated in low-priority admin",
  ],
  opportunities: [
    "Automate recurring status updates with saved prompts",
    "Use the planner to pre-block Monday mornings",
    "Delegate or archive the low-priority backlog",
  ],
};

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function FocusList({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: typeof Target;
  tone: string;
}) {
  return (
    <section className="glass-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className={`size-4 ${tone}`} aria-hidden />
        {title}
      </h2>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${tone.replace("text-", "bg-")}`} aria-hidden />
            {i}
          </li>
        ))}
      </ul>
    </section>
  );
}

function InsightsPage() {
  const { generate, loading } = useAi();
  const [data, setData] = useState<Insights>(FALLBACK);

  async function analyze() {
    const text = await generate({ system: SYSTEM, prompt: METRICS, json: true });
    if (!text) return;
    const parsed = extractJson<Insights>(text);
    if (parsed) setData(parsed);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Signature feature"
        title="AI Productivity Insights Engine"
        description="WorkFlow AI analyses your activity patterns, scores your week and recommends the changes with the highest payoff."
        actions={
          <Button onClick={() => void analyze()} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Re-analyze my week
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="glass-card flex flex-col items-center justify-center p-5">
          <h2 className="self-start text-sm font-semibold">Productivity score</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[{ name: "score", value: data.score }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} fill="var(--chart-1)" background />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="-mt-32 text-4xl font-bold">{data.score}</p>
          <p className="mt-28 text-xs text-muted-foreground">out of 100 · top 12% of your team</p>
        </section>

        <section className="glass-card p-5 xl:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">Performance summary</h2>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
          )}
          <h3 className="mt-5 mb-3 text-sm font-semibold">Smart recommendations</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.recommendations.map((r) => (
              <li
                key={r}
                className="flex gap-2 rounded-xl border border-border/70 bg-card/60 p-3 text-sm"
              >
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <FocusList title="Strengths" items={data.strengths} icon={Target} tone="text-success" />
        <FocusList title="Bottlenecks" items={data.bottlenecks} icon={AlertTriangle} tone="text-destructive" />
        <FocusList title="Opportunities" items={data.opportunities} icon={TrendingUp} tone="text-primary" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Weekly performance</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityTrend} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="score" stroke="var(--chart-1)" strokeWidth={2.5} />
                <Line type="monotone" dataKey="tasks" stroke="var(--chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Focus by hour</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusByHour} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="focus" radius={[6, 6, 0, 0]}>
                  {focusByHour.map((d) => (
                    <Cell
                      key={d.hour}
                      fill={d.focus > 80 ? "var(--chart-3)" : "var(--chart-2)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Task completion statistics</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionRates} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="completed" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="overdue" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold">AI usage analytics</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolUsage} layout="vertical" margin={{ left: 24, right: 12, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="tool" {...axis} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="uses" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </AppShell>
  );
}