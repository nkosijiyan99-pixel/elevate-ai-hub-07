import { createFileRoute } from "@tanstack/react-router";
import { Copy, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistory, type HistoryKind } from "@/lib/storage";
import { copyText } from "@/lib/use-ai";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Saved History | Cadence" },
      {
        name: "description",
        content:
          "Search, filter and manage every email, meeting summary, research report, plan and chat Cadence created for you.",
      },
      { property: "og:title", content: "Saved History | Cadence" },
      { property: "og:description", content: "All your AI-generated workplace output in one searchable place." },
    ],
  }),
  component: HistoryPage,
});

const LABELS: Record<HistoryKind, string> = {
  email: "Email",
  meeting: "Meeting summary",
  research: "Research report",
  plan: "Task schedule",
  chat: "Chat",
};

function HistoryPage() {
  const { items, remove, clear } = useHistory();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | HistoryKind>("all");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (filter === "all" || i.kind === filter) &&
          (i.title + i.preview + i.content).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, filter, query],
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace memory"
        title="Saved History"
        description="Everything Cadence has generated for you, saved securely to your account."
        actions={
          items.length > 0 ? (
            <Button variant="outline" onClick={clear}>
              Clear all
            </Button>
          ) : undefined
        }
      />

      <div className="glass-card mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved outputs..."
            aria-label="Search history"
            className="pl-9"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">Emails</TabsTrigger>
            <TabsTrigger value="meeting">Meetings</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="plan">Plans</TabsTrigger>
            <TabsTrigger value="chat">Chats</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card flex min-h-56 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm font-medium">Nothing saved yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Generate an email, meeting summary, research brief or plan and it will be stored here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="glass-card surface-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{LABELS[item.kind]}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="mt-3 line-clamp-2 text-sm font-semibold">{item.title}</h2>
              <p className="mt-1.5 line-clamp-3 flex-1 text-xs text-muted-foreground">{item.preview}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void copyText(item.content)}>
                  <Copy className="size-4" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(item.id)}
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}