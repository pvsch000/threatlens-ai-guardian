import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ShieldCheck, Target, Zap, FileText, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { riskColor } from "@/lib/risk";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/scan/$id")({
  head: () => ({ meta: [{ title: "Threat Analysis — PVS ThreatLens" }] }),
  component: ScanDetail,
});

type Scan = {
  id: string;
  input_text: string;
  input_type: string;
  risk_score: number;
  risk_level: string;
  threat_type: string;
  confidence: number;
  attack_techniques: string[];
  explanation: string;
  recommendations: string[];
  created_at: string;
};

function ScanDetail() {
  const { id } = useParams({ from: "/_authenticated/scan/$id" });
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
      setScan(data as Scan | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading analysis…</div>;
  if (!scan) return <div className="p-10 text-center text-muted-foreground">Scan not found.</div>;

  const ringPct = scan.risk_score;
  const ringColor =
    scan.risk_level === "critical" || scan.risk_level === "high"
      ? "oklch(0.68 0.24 25)"
      : scan.risk_level === "medium"
      ? "oklch(0.82 0.17 75)"
      : "oklch(0.78 0.21 145)";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to history
          </Link>
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk gauge */}
        <Card className="glass-panel flex flex-col items-center p-6 lg:col-span-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Risk Score</p>
          <div
            className="relative mt-4 flex h-44 w-44 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} ${ringPct * 3.6}deg, oklch(0.28 0.04 250) 0deg)`,
            }}
          >
            <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-card">
              <span className="font-mono text-5xl font-bold" style={{ color: ringColor }}>
                {scan.risk_score}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <span
            className={`mt-4 rounded-md border px-3 py-1 font-mono text-xs uppercase tracking-wider ${riskColor(scan.risk_level)}`}
          >
            {scan.risk_level} risk
          </span>
          <div className="mt-4 w-full space-y-2 text-sm">
            <Row label="Threat type" value={scan.threat_type} icon={Target} />
            <Row label="Input" value={scan.input_type} icon={FileText} />
            <Row label="Confidence" value={`${scan.confidence}%`} icon={ShieldCheck} />
          </div>
        </Card>

        {/* Analysis */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="glass-panel p-6">
            <SectionTitle icon={Zap}>Attack techniques</SectionTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              {scan.attack_techniques.length === 0 && (
                <span className="text-sm text-muted-foreground">None detected.</span>
              )}
              {scan.attack_techniques.map((t) => (
                <span key={t} className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                  {t}
                </span>
              ))}
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <SectionTitle icon={AlertTriangle}>Threat explanation</SectionTitle>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {scan.explanation}
            </p>
          </Card>

          <Card className="glass-panel p-6">
            <SectionTitle icon={ListChecks}>Recommendations</SectionTitle>
            <ul className="mt-3 space-y-2 text-sm">
              {scan.recommendations.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="glass-panel p-6">
            <SectionTitle icon={FileText}>Original content</SectionTitle>
            <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-input/30 p-4 font-mono text-xs whitespace-pre-wrap break-words">
              {scan.input_text}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">{children}</h2>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
