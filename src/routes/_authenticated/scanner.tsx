import { createFileRoute, useNavigate, useServerFn } from "@tanstack/react-router";
import { useState } from "react";
import { ScanSearch, Loader2, Mail, MessageSquare, Link2, Briefcase, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { analyzeThreat } from "@/lib/threat.functions";

export const Route = createFileRoute("/_authenticated/scanner")({
  head: () => ({ meta: [{ title: "Threat Scanner — PVS ThreatLens" }] }),
  component: Scanner,
});

const TYPES = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "url", label: "URL", icon: Link2 },
  { id: "job", label: "Job Offer", icon: Briefcase },
  { id: "other", label: "Other", icon: FileText },
] as const;

function Scanner() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeThreat);
  const [text, setText] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("email");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5) return toast.error("Please paste at least a few characters.");
    setLoading(true);
    try {
      const result = await analyze({ data: { input_text: text, input_type: type } });
      navigate({ to: "/scan/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Module 01</p>
        <h1 className="mt-1 text-3xl font-bold glow-text">Threat Scanner</h1>
        <p className="mt-2 text-muted-foreground">
          Paste any suspicious email, SMS, URL or job offer. The AI will return a risk verdict in seconds.
        </p>
      </header>

      <Card className="glass-panel p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Input type
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TYPES.map((t) => {
                const active = type === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-glow"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Suspicious content
            </label>
            <Textarea
              id="content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full message, link, or job description here…"
              className="mt-2 min-h-[260px] bg-input/40 font-mono text-sm"
              maxLength={20000}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Never enter real passwords or full credit card numbers.</span>
              <span>{text.length} / 20000</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing threat…</>
            ) : (
              <><ScanSearch className="mr-2 h-4 w-4" /> Analyze Threat</>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
