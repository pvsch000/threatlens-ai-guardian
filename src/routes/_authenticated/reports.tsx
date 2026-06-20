import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — PVS ThreatLens" }] }),
  component: ReportsPage,
});

const COLORS = ["#22d3ee", "#4ade80", "#f59e0b", "#ef4444", "#a78bfa"];

function ReportsPage() {
  const [trend, setTrend] = useState<{ date: string; scans: number; threats: number }[]>([]);
  const [byType, setByType] = useState<{ name: string; value: number }[]>([]);
  const [bySeverity, setBySeverity] = useState<{ level: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("scans")
        .select("risk_level, input_type, created_at")
        .eq("user_id", u.user.id);
      const rows = data ?? [];

      // Trend last 14 days
      const days: Record<string, { scans: number; threats: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = startOfDay(subDays(new Date(), i));
        days[format(d, "MMM d")] = { scans: 0, threats: 0 };
      }
      rows.forEach((r) => {
        const key = format(startOfDay(new Date(r.created_at)), "MMM d");
        if (days[key]) {
          days[key].scans += 1;
          if (r.risk_level === "high" || r.risk_level === "critical") days[key].threats += 1;
        }
      });
      setTrend(Object.entries(days).map(([date, v]) => ({ date, ...v })));

      // Category
      const tMap: Record<string, number> = {};
      rows.forEach((r) => (tMap[r.input_type] = (tMap[r.input_type] ?? 0) + 1));
      setByType(Object.entries(tMap).map(([name, value]) => ({ name, value })));

      // Severity
      const levels = ["low", "medium", "high", "critical"];
      const sMap: Record<string, number> = Object.fromEntries(levels.map((l) => [l, 0]));
      rows.forEach((r) => (sMap[r.risk_level] = (sMap[r.risk_level] ?? 0) + 1));
      setBySeverity(levels.map((l) => ({ level: l, count: sMap[l] })));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Module 04</p>
        <h1 className="mt-1 text-3xl font-bold glow-text">Reports</h1>
        <p className="mt-2 text-muted-foreground">Visual breakdown of your threat landscape.</p>
      </header>

      <Card className="glass-panel p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Threat Volume Trend · 14 days</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="scans" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel p-6">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Category Distribution</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" outerRadius={90} label>
                  {byType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">Severity Analysis</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="level" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {bySeverity.map((s, i) => {
                    const c =
                      s.level === "critical" ? "#ef4444" :
                      s.level === "high" ? "#f97316" :
                      s.level === "medium" ? "#f59e0b" : "#22c55e";
                    return <Cell key={i} fill={c} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
