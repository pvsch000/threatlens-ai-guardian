export type RiskLevel = "low" | "medium" | "high" | "critical";

export function riskColor(level: RiskLevel | string) {
  switch (level) {
    case "low":
      return "text-success border-success/40 bg-success/10";
    case "medium":
      return "text-warning border-warning/40 bg-warning/10";
    case "high":
      return "text-destructive border-destructive/40 bg-destructive/10";
    case "critical":
      return "text-destructive border-destructive/60 bg-destructive/20 shadow-danger";
    default:
      return "text-muted-foreground border-border bg-muted/30";
  }
}

export function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 55) return "high";
  if (score >= 25) return "medium";
  return "low";
}
