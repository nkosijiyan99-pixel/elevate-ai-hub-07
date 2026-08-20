import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function displayNameOf(user: User | null) {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta["display_name"] === "string" && meta["display_name"]) ||
    (typeof meta["full_name"] === "string" && meta["full_name"]) ||
    user?.email?.split("@")[0] ||
    "";
  return name as string;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}
