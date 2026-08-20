import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type HistoryKind = "email" | "meeting" | "research" | "plan" | "chat";

export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  title: string;
  preview: string;
  content: string;
  createdAt: string;
};

const CHANGE_EVENT = "workflow-ai:store";

function notify(scope: "history" | "prompts") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: scope }));
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function saveHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("history_items")
    .insert({
      user_id: userId,
      kind: item.kind,
      title: item.title,
      preview: item.preview,
      content: item.content,
    })
    .select("id, kind, title, preview, content, created_at")
    .single();

  if (error) {
    toast.error("Could not save to your history.");
    return null;
  }

  notify("history");
  return {
    id: data.id,
    kind: data.kind as HistoryKind,
    title: data.title,
    preview: data.preview,
    content: data.content,
    createdAt: data.created_at,
  } satisfies HistoryItem;
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(async () => {
    const { data, error } = await supabase
      .from("history_items")
      .select("id, kind, title, preview, content, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setItems(
        data.map((row) => ({
          id: row.id,
          kind: row.kind as HistoryKind,
          title: row.title,
          preview: row.preview,
          content: row.content,
          createdAt: row.created_at,
        })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void sync();
    const handler = (event: Event) => {
      if ((event as CustomEvent).detail === "prompts") return;
      void sync();
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [sync]);

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("history_items").delete().eq("id", id);
      if (error) return toast.error("Could not delete that item.");
      await sync();
    },
    [sync],
  );

  const clear = useCallback(async () => {
    const userId = await currentUserId();
    if (!userId) return;
    const { error } = await supabase.from("history_items").delete().eq("user_id", userId);
    if (error) return toast.error("Could not clear your history.");
    await sync();
  }, [sync]);

  return { items, loading, remove, clear };
}

export type PromptCategory = "Email" | "Meetings" | "Research" | "Planning" | "Chat";

export type PromptTemplate = {
  id: string;
  name: string;
  category: PromptCategory;
  body: string;
  custom?: boolean;
};

export const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: "email-professional",
    name: "Professional email draft",
    category: "Email",
    body: "Write a concise professional email to {recipient} about {subject}. Purpose: {purpose}. Keep it under 180 words, action oriented, with a clear closing.",
  },
  {
    id: "email-followup",
    name: "Polite follow-up",
    category: "Email",
    body: "Draft a polite follow-up email referencing our previous message about {subject}. Restate the ask, add urgency without pressure, propose two next steps.",
  },
  {
    id: "meeting-exec",
    name: "Executive meeting summary",
    category: "Meetings",
    body: "Summarise these meeting notes into an executive summary, key decisions, action items (task, owner, priority, deadline), risks and follow-ups.",
  },
  {
    id: "meeting-actions",
    name: "Action item extraction",
    category: "Meetings",
    body: "Extract only the action items from these notes. For each: task, owner, priority (High/Medium/Low) and deadline. Flag anything with no owner.",
  },
  {
    id: "research-brief",
    name: "Business research brief",
    category: "Research",
    body: "Research {topic} and produce a business brief: summary, key insights, opportunities, risks, recommendations and quick facts.",
  },
  {
    id: "plan-day",
    name: "Time-blocked day plan",
    category: "Planning",
    body: "Given these tasks, priorities and deadlines, build a time-blocked schedule for a {hours}-hour workday with deep-work blocks and recovery breaks.",
  },
  {
    id: "chat-coach",
    name: "Workplace coaching",
    category: "Chat",
    body: "Act as a pragmatic workplace productivity coach. Ask clarifying questions, then give concrete, prioritised advice with next steps.",
  },
];

const HIDDEN_DEFAULTS_KEY = "workflow-ai:hidden-default-prompts";

function readHiddenDefaults(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HIDDEN_DEFAULTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeHiddenDefaults(ids: string[]) {
  window.localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify(ids));
}

export function usePrompts() {
  const [custom, setCustom] = useState<PromptTemplate[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  const sync = useCallback(async () => {
    setHidden(readHiddenDefaults());
    const { data, error } = await supabase
      .from("prompt_templates")
      .select("id, name, category, body")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCustom(
        data.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category as PromptCategory,
          body: row.body,
          custom: true,
        })),
      );
    }
  }, []);

  useEffect(() => {
    void sync();
    const handler = (event: Event) => {
      if ((event as CustomEvent).detail === "history") return;
      void sync();
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [sync]);

  const save = useCallback(
    async (prompt: PromptTemplate) => {
      const userId = await currentUserId();
      if (!userId) return;

      const payload = {
        user_id: userId,
        name: prompt.name,
        category: prompt.category,
        body: prompt.body,
      };

      const { error } = prompt.custom
        ? await supabase.from("prompt_templates").update(payload).eq("id", prompt.id)
        : await supabase.from("prompt_templates").insert(payload);

      if (error) return toast.error("Could not save that prompt.");
      toast.success(prompt.custom ? "Prompt updated" : "Prompt saved to your library");
      await sync();
    },
    [sync],
  );

  const remove = useCallback(
    async (id: string) => {
      if (custom.some((p) => p.id === id)) {
        const { error } = await supabase.from("prompt_templates").delete().eq("id", id);
        if (error) return toast.error("Could not delete that prompt.");
      } else {
        const next = [...new Set([...readHiddenDefaults(), id])];
        writeHiddenDefaults(next);
      }
      await sync();
    },
    [custom, sync],
  );

  const reset = useCallback(async () => {
    writeHiddenDefaults([]);
    const userId = await currentUserId();
    if (userId) await supabase.from("prompt_templates").delete().eq("user_id", userId);
    await sync();
  }, [sync]);

  const prompts = [...custom, ...DEFAULT_PROMPTS.filter((p) => !hidden.includes(p.id))];

  return { prompts, save, remove, reset };
}
