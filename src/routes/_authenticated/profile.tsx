import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — PVS ThreatLens" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", u.user.id)
        .maybeSingle();
      setName(p?.full_name ?? "");
      setAvatar(p?.avatar_url ?? "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (roles?.some((r) => r.role === "admin")) setRole("admin");
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, avatar_url: avatar, updated_at: new Date().toISOString() })
      .eq("id", u.user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Account</p>
        <h1 className="mt-1 text-3xl font-bold glow-text">Profile</h1>
      </header>

      <Card className="glass-panel p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-primary/40">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-gradient-cyber text-primary-foreground font-mono">
              {(name || email).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-mono font-bold">{name || "Operator"}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
            <span className="mt-1 inline-block rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {role}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
          <Button onClick={save} disabled={loading} className="bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
