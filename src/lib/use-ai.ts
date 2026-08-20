import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { runAi } from "./ai.functions";

export function extractJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?/gm, "")
    .replace(/```$/gm, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export function useAi() {
  const call = useServerFn(runAi);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async (args: {
      system: string;
      prompt: string;
      json?: boolean;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    }) => {
      setLoading(true);
      try {
        const res = await call({ data: args });
        return res.text;
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI request failed.";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [call],
  );

  return { generate, loading };
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy");
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}