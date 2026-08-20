import { useCallback, useEffect, useState } from "react";

export type HistoryKind = "email" | "meeting" | "research" | "plan" | "chat";

export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  title: string;
  preview: string;
  content: string;
  createdAt: string;
};

const HISTORY_KEY = "workflow-ai:history";
const PROMPTS_KEY = "workflow-ai:prompts";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("workflow-ai:store", { detail: key }));
}

export function saveHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
  const items = read<HistoryItem[]>(HISTORY_KEY, []);
  const entry: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  write(HISTORY_KEY, [entry, ...items].slice(0, 200));
  return entry;
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const sync = useCallback(() => setItems(read<HistoryItem[]>(HISTORY_KEY, [])), []);

  useEffect(() => {
    sync();
    const handler = () => sync();
    window.addEventListener("workflow-ai:store", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("workflow-ai:store", handler);
      window.removeEventListener("storage", handler);
    };
  }, [sync]);

  const remove = useCallback((id: string) => {
    write(
      HISTORY_KEY,
      read<HistoryItem[]>(HISTORY_KEY, []).filter((i) => i.id !== id),
    );
  }, []);

  const clear = useCallback(() => write(HISTORY_KEY, []), []);

  return { items, remove, clear };
}

export type PromptTemplate = {
  id: string;
  name: string;
  category: "Email" | "Meetings" | "Research" | "Planning" | "Chat";
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

export function usePrompts() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);

  useEffect(() => {
    setPrompts(read<PromptTemplate[]>(PROMPTS_KEY, DEFAULT_PROMPTS));
    const handler = () => setPrompts(read<PromptTemplate[]>(PROMPTS_KEY, DEFAULT_PROMPTS));
    window.addEventListener("workflow-ai:store", handler);
    return () => window.removeEventListener("workflow-ai:store", handler);
  }, []);

  const save = useCallback((prompt: PromptTemplate) => {
    const current = read<PromptTemplate[]>(PROMPTS_KEY, DEFAULT_PROMPTS);
    const exists = current.some((p) => p.id === prompt.id);
    write(
      PROMPTS_KEY,
      exists ? current.map((p) => (p.id === prompt.id ? prompt : p)) : [prompt, ...current],
    );
  }, []);

  const remove = useCallback((id: string) => {
    write(
      PROMPTS_KEY,
      read<PromptTemplate[]>(PROMPTS_KEY, DEFAULT_PROMPTS).filter((p) => p.id !== id),
    );
  }, []);

  const reset = useCallback(() => write(PROMPTS_KEY, DEFAULT_PROMPTS), []);

  return { prompts, save, remove, reset };
}