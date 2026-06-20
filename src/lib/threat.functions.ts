import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  input_text: z.string().min(5).max(20000),
  input_type: z.enum(["email", "sms", "url", "job", "other"]),
});

const ResultSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  threat_type: z.string(),
  confidence: z.number().min(0).max(100),
  attack_techniques: z.array(z.string()),
  explanation: z.string(),
  recommendations: z.array(z.string()),
});

export const analyzeThreat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const system = `You are PVS ThreatLens, an elite cybersecurity AI analyst. Analyze the user-submitted content (which may be an email, SMS, URL, job offer, or other text) for phishing, scams, social engineering, malware delivery, fraud, or impersonation. Be strict and decisive. Respond ONLY with the requested JSON.

Risk levels by score: 0-24 low, 25-54 medium, 55-79 high, 80-100 critical.
attack_techniques: short labels like "Urgency manipulation", "Spoofed sender", "Credential harvesting URL", "Fake recruiter", "Pretexting", "Smishing", "Typosquatting domain".
recommendations: 3-6 concise actionable steps.`;

    const user = `Input type: ${data.input_type}\n\nContent:\n"""${data.input_text}"""`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_threat_analysis",
            description: "Return the structured threat analysis",
            parameters: {
              type: "object",
              properties: {
                risk_score: { type: "number", minimum: 0, maximum: 100 },
                risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                threat_type: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                attack_techniques: { type: "array", items: { type: "string" } },
                explanation: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["risk_score", "risk_level", "threat_type", "confidence", "attack_techniques", "explanation", "recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_threat_analysis" } },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace settings.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no analysis");
    const parsed = ResultSchema.parse(typeof args === "string" ? JSON.parse(args) : args);

    const { data: row, error } = await context.supabase
      .from("scans")
      .insert({
        user_id: context.userId,
        input_text: data.input_text,
        input_type: data.input_type,
        ...parsed,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id, ...parsed };
  });
