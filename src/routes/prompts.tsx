import { createFileRoute } from "@tanstack/react-router";
import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePrompts, type PromptTemplate } from "@/lib/storage";
import { copyText } from "@/lib/use-ai";
import { toast } from "sonner";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "AI Prompt Library | Cadence" },
      {
        name: "description",
        content:
          "Browse, edit and save reusable prompt templates for emails, meetings, research, planning and chat.",
      },
      { property: "og:title", content: "AI Prompt Library | Cadence" },
      { property: "og:description", content: "Reusable, editable prompt templates for every workplace AI task." },
    ],
  }),
  component: PromptsPage,
});

const CATEGORIES: PromptTemplate["category"][] = ["Email", "Meetings", "Research", "Planning", "Chat"];

function PromptsPage() {
  const { prompts, save, remove, reset } = usePrompts();
  const [editing, setEditing] = useState<PromptTemplate | null>(null);

  const startNew = () =>
    setEditing({ id: crypto.randomUUID(), name: "", category: "Email", body: "", custom: true });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Prompt engineering"
        title="AI Prompt Library"
        description="The prompt patterns powering Cadence. Tune them to your team's voice or add your own."
        actions={
          <>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" /> Reset defaults
            </Button>
            <Button onClick={startNew}>
              <Plus className="size-4" /> New prompt
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {prompts.map((p) => (
          <article key={p.id} className="glass-card surface-hover flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary">{p.category}</Badge>
              {p.custom && <Badge className="bg-accent/20 text-accent-foreground">Custom</Badge>}
            </div>
            <h2 className="mt-3 text-sm font-semibold">{p.name}</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => void copyText(p.body)}>
                <Copy className="size-4" /> Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => remove(p.id)}
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogTrigger className="sr-only">Edit prompt</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.name ? "Edit prompt" : "New prompt"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Name</Label>
                <Input
                  id="p-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-cat">Category</Label>
                <Select
                  value={editing.category}
                  onValueChange={(v) =>
                    setEditing({ ...editing, category: v as PromptTemplate["category"] })
                  }
                >
                  <SelectTrigger id="p-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-body">Prompt</Label>
                <Textarea
                  id="p-body"
                  rows={7}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editing?.name.trim() || !editing.body.trim()) {
                  toast.error("Name and prompt body are required");
                  return;
                }
                save(editing);
                setEditing(null);
                toast.success("Prompt saved");
              }}
            >
              Save prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}