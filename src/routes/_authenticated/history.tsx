import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { riskColor } from "@/lib/risk";
import { format } from "date-fns";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Scan History — PVS ThreatLens" }] }),
  component: HistoryPage,
});

type Row = {
  id: string;
  input_type: string;
  threat_type: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
  input_text: string;
};

function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("scans")
        .select("id, input_type, threat_type, risk_level, risk_score, created_at, input_text")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.threat_type.toLowerCase().includes(q.toLowerCase()) ||
      r.input_type.toLowerCase().includes(q.toLowerCase()) ||
      r.input_text.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Module 03</p>
        <h1 className="mt-1 text-3xl font-bold glow-text">Scan History</h1>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by threat type or content…"
          className="pl-9"
        />
      </div>

      <Card className="glass-panel overflow-hidden">
        <div className="grid grid-cols-12 border-b border-border/60 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-4">Threat</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-2 text-right">Score</div>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No scans match.</div>
        )}
        <div className="divide-y divide-border/60">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to="/scan/$id"
              params={{ id: r.id }}
              className="grid grid-cols-12 items-center px-4 py-3 text-sm transition hover:bg-accent/5"
            >
              <div className="col-span-2 font-mono text-xs text-muted-foreground">
                {format(new Date(r.created_at), "MMM d, HH:mm")}
              </div>
              <div className="col-span-2 font-mono text-xs uppercase">{r.input_type}</div>
              <div className="col-span-4 truncate">{r.threat_type}</div>
              <div className="col-span-2">
                <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${riskColor(r.risk_level)}`}>
                  {r.risk_level}
                </span>
              </div>
              <div className="col-span-2 text-right font-mono font-bold">{r.risk_score}</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
