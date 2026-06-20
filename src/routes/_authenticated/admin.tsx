import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { riskColor } from "@/lib/risk";
import { format } from "date-fns";
import { Users, Shield, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PVS ThreatLens" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (!data?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

type Row = {
  id: string;
  user_id: string;
  threat_type: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
};

function AdminPage() {
  const [stats, setStats] = useState({ users: 0, scans: 0, high: 0 });
  const [recent, setRecent] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { data: scans }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("scans")
          .select("id, user_id, threat_type, risk_level, risk_score, created_at")
          .order("created_at", { ascending: false }),
      ]);
      const all = (scans ?? []) as Row[];
      setStats({
        users: users ?? 0,
        scans: all.length,
        high: all.filter((s) => s.risk_level === "high" || s.risk_level === "critical").length,
      });
      setRecent(all.slice(0, 12));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Admin Console</p>
        <h1 className="mt-1 text-3xl font-bold glow-text">Admin Dashboard</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Users" value={stats.users} icon={Users} />
        <Stat label="Total Scans" value={stats.scans} icon={Shield} />
        <Stat label="High-Risk Threats" value={stats.high} icon={AlertTriangle} accent="danger" />
      </div>

      <Card className="glass-panel">
        <div className="border-b border-border/60 p-5">
          <h2 className="font-mono text-lg font-semibold">Recent Reports</h2>
          <p className="text-xs text-muted-foreground">Most recent scans across all users</p>
        </div>
        <div className="grid grid-cols-12 border-b border-border/60 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-3">Date</div>
          <div className="col-span-3">User</div>
          <div className="col-span-3">Threat</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-1 text-right">Score</div>
        </div>
        <div className="divide-y divide-border/60">
          {recent.map((r) => (
            <Link
              key={r.id}
              to="/scan/$id"
              params={{ id: r.id }}
              className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-accent/5"
            >
              <div className="col-span-3 font-mono text-xs text-muted-foreground">
                {format(new Date(r.created_at), "MMM d, HH:mm")}
              </div>
              <div className="col-span-3 truncate font-mono text-xs text-muted-foreground">
                {r.user_id.slice(0, 8)}…
              </div>
              <div className="col-span-3 truncate">{r.threat_type}</div>
              <div className="col-span-2">
                <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${riskColor(r.risk_level)}`}>
                  {r.risk_level}
                </span>
              </div>
              <div className="col-span-1 text-right font-mono font-bold">{r.risk_score}</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "danger";
}) {
  const cls = accent === "danger" ? "text-destructive border-destructive/40" : "text-primary border-primary/40";
  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${cls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 font-mono text-4xl font-bold">{value}</div>
    </Card>
  );
}
