import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Calendar,
  Mail,
  MessagesSquare,
  NotebookPen,
  Telescope,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { activityFeed, completionRates, productivityTrend, toolUsage } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkFlow AI — Intelligent Workplace Productivity Dashboard" },
      {
        name: "description",
        content:
          "WorkFlow AI unifies email drafting, meeting summaries, task planning, research and productivity insights in one enterprise AI workspace.",
      },
      { property: "og:title", content: "WorkFlow AI — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "One AI workspace for emails, meetings, planning, research and productivity insights.",
      },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Emails Generated", value: "128", delta: "+12%", icon: Mail, to: "/email" as const },
  { label: "Meetings Summarized", value: "46", delta: "+8%", icon: NotebookPen, to: "/meetings" as const },
  { label: "Tasks Planned", value: "312", delta: "+21%", icon: Calendar, to: "/planner" as const },
  { label: "Research Requests", value: "57", delta: "+5%", icon: Telescope, to: "/research" as const },
  { label: "AI Conversations", value: "94", delta: "+17%", icon: MessagesSquare, to: "/chat" as const },
  { label: "Productivity Score", value: "87", delta: "+18%", icon: TrendingUp, to: "/insights" as const },
];

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function Dashboard() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Executive overview"
        title="Good morning, Nkosingiphile"
        description="Your AI workspace is running smoothly. Productivity is up 18% week over week, with deep-work focus peaking between 09:00 and 12:00."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/insights">View insights</Link>
            </Button>
            <Button asChild>
              <Link to="/email">New AI draft</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, delta, icon: Icon, to }) => (
          <Link key={label} to={to} className="glass-card surface-hover block p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-success/15 text-success hover:bg-success/15">{delta}</Badge>
              <span className="text-xs text-muted-foreground">vs last week</span>
              <ArrowUpRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Productivity trend" subtitle="Daily score across the last 7 days">
            <AreaChart data={productivityTrend} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#scoreFill)"
              />
            </AreaChart>
          </ChartCard>
        </div>

        <section className="glass-card p-5">
          <h2 className="text-sm font-semibold">Weekly goals</h2>
          <p className="text-xs text-muted-foreground">Progress across focus commitments</p>
          <div className="mt-5 space-y-5">
            {[
              { label: "Deep work hours", value: 78 },
              { label: "Inbox zero streak", value: 64 },
              { label: "High-priority tasks", value: 91 },
              { label: "Meeting follow-ups", value: 55 },
            ].map((goal) => (
              <div key={goal.label}>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-medium">{goal.label}</span>
                  <span className="text-muted-foreground">{goal.value}%</span>
                </div>
                <Progress value={goal.value} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Task completion" subtitle="Completed versus overdue by week">
          <BarChart data={completionRates} margin={{ left: -18, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="completed" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="overdue" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="AI usage" subtitle="Requests per tool this month">
          <LineChart data={toolUsage} margin={{ left: -18, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="tool" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="uses"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartCard>

        <section className="glass-card p-5">
          <h2 className="text-sm font-semibold">Activity timeline</h2>
          <p className="text-xs text-muted-foreground">Recent AI actions across your workspace</p>
          <ol className="mt-4 space-y-4">
            {activityFeed.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.tool} · {item.time}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
