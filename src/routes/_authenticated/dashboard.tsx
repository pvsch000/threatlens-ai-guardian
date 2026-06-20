import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ScanSearch, Shield, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { riskColor } from "@/lib/risk";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PVS ThreatLens" }] }),
  component: Dashboard,
});

type ScanRow = {
  id: string;
  input_type: string;
  threat_type: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
};

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, highRisk: 0, todayCount: 0 });
  const [recent, setRecent] = useState<ScanRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: scans } = await supabase
        .from("scans")
        .select("id, input_type, threat_type, risk_level, risk_score, created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      const all = scans ?? [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStats({
        total: all.length,
        highRisk: all.filter((s) => s.risk_level === "high" || s.risk_level === "critical").length,
        todayCount: all.filter((s) => new Date(s.created_at) >= today).length,
      });
      setRecent(all.slice(0, 6));
    })();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Command Center</p>
          <h1 className="mt-1 text-3xl font-bold glow-text">Threat Dashboard</h1>
        </div>
        <Button asChild className="bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
          <Link to="/scanner">
            <ScanSearch className="mr-2 h-4 w-4" /> Quick Scan
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Scans" value={stats.total} icon={Shield} accent="primary" />
        <StatCard label="High-Risk Threats" value={stats.highRisk} icon={AlertTriangle} accent="danger" />
        <StatCard label="Scans Today" value={stats.todayCount} icon={Activity} accent="accent" />
      </div>

      <Card className="glass-panel">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <div>
            <h2 className="font-mono text-lg font-semibold">Recent Activity</h2>
            <p className="text-xs text-muted-foreground">Your latest scans</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-border/60">
          {recent.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No scans yet. <Link to="/scanner" className="text-primary underline">Run your first scan</Link>.
            </div>
          )}
          {recent.map((s) => (
            <Link
              key={s.id}
              to="/scan/$id"
              params={{ id: s.id }}
              className="flex items-center justify-between gap-4 p-4 transition hover:bg-accent/5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-muted-foreground">{s.input_type}</span>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-mono uppercase ${riskColor(s.risk_level)}`}>
                    {s.risk_level}
                  </span>
                </div>
                <p className="mt-1 truncate font-medium">{s.threat_type}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold">{s.risk_score}</div>
                <div className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "accent" | "danger";
}) {
  const styles = {
    primary: "text-primary border-primary/40",
    accent: "text-accent border-accent/40",
    danger: "text-destructive border-destructive/40",
  }[accent];
  return (
    <Card className="glass-panel relative overflow-hidden p-6">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${styles}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 font-mono text-4xl font-bold">{value}</div>
    </Card>
  );
}
