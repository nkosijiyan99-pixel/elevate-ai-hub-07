import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { AI_DISCLAIMER } from "@/lib/demo-data";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | WorkFlow AI" },
      {
        name: "description",
        content: "Manage your WorkFlow AI profile, default tone, notifications and responsible-AI preferences.",
      },
      { property: "og:title", content: "Settings | WorkFlow AI" },
      { property: "og:description", content: "Profile, workspace and responsible AI preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ display_name: "", job_title: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("display_name, job_title")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ display_name: data.display_name ?? "", job_title: data.job_title ?? "" });
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: profile.display_name, job_title: profile.job_title });
    setSavingProfile(false);
    if (error) {
      toast.error("Could not save your profile.");
      return;
    }
    toast.success("Profile saved");
  };

  const [toggles, setToggles] = useState({
    weeklyDigest: true,
    deadlineAlerts: true,
    autoSave: true,
    reviewReminder: true,
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Personalise how WorkFlow AI writes, plans and notifies you."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-card space-y-4 p-5">
          <h2 className="text-sm font-semibold">Profile</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={profile.job_title}
              onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
              placeholder="Operations Lead"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" value={user?.email ?? ""} readOnly disabled />
          </div>
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save profile
          </Button>
        </section>

        <section className="glass-card space-y-4 p-5">
          <h2 className="text-sm font-semibold">AI defaults</h2>
          <div className="space-y-2">
            <Label htmlFor="tone">Default email tone</Label>
            <Select defaultValue="Professional">
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Professional", "Friendly", "Persuasive", "Executive"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Default working hours</Label>
            <Input id="hours" defaultValue="09:00 - 17:00" />
          </div>
          <Separator />
          {[
            ["autoSave", "Auto-save generated output to history"],
            ["reviewReminder", "Always remind me to review AI output"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={key} className="text-sm font-normal">
                {label}
              </Label>
              <Switch
                id={key}
                checked={toggles[key as keyof typeof toggles]}
                onCheckedChange={(v) => setToggles({ ...toggles, [key as string]: v })}
              />
            </div>
          ))}
        </section>

        <section className="glass-card space-y-4 p-5">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {[
            ["weeklyDigest", "Weekly productivity digest"],
            ["deadlineAlerts", "Deadline and overdue alerts"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={key} className="text-sm font-normal">
                {label}
              </Label>
              <Switch
                id={key}
                checked={toggles[key as keyof typeof toggles]}
                onCheckedChange={(v) => setToggles({ ...toggles, [key as string]: v })}
              />
            </div>
          ))}
        </section>

        <section className="glass-card space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            Responsible AI
          </h2>
          <p className="text-sm text-muted-foreground">{AI_DISCLAIMER}</p>
          <p className="text-xs text-muted-foreground">
            Your generated content is stored locally in this browser and never shared with other users of
            this workspace.
          </p>
        </section>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
      </div>
    </AppShell>
  );
}