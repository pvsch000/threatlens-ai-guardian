# PVS ThreatLens — Build Plan

A dark-themed cybersecurity SaaS that uses AI to analyze pasted content (emails, SMS, URLs, job offers) and flags phishing, scams, and social-engineering attacks.

## 1. Backend (Lovable Cloud)
- Enable Lovable Cloud (Supabase).
- **Auth**: Google sign-in + email/password fallback. Redirect to `/dashboard` after login.
- **Tables**:
  - `profiles` — id (FK auth.users), full_name, avatar_url, created_at.
  - `user_roles` — id, user_id, role enum (`admin`,`user`). Security-definer `has_role()` function. Trigger auto-assigns `user` on signup.
  - `scans` — id, user_id, input_text, input_type (email/sms/url/job/other), risk_score (0-100), risk_level (low/medium/high/critical), threat_type, confidence, attack_techniques (jsonb), explanation, recommendations (jsonb), created_at.
- RLS: users read/write own scans; admins read all. Profiles: own + admin read. Roles: admin manage; user read own.
- Grants for `authenticated` + `service_role` on every public table.

## 2. AI Analysis
- TanStack server function `analyzeThreat` using Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured Output (zod schema matching the scans table fields).
- Auth via `requireSupabaseAuth`; inserts row into `scans` and returns analysis.
- Graceful 429/402 handling surfaced in UI.

## 3. Routes (TanStack Start)
Public:
- `/auth` — Login page with Google + email.

Protected (`_authenticated/`):
- `/dashboard` — totals, high-risk count, recent activity, Quick Scan CTA.
- `/scanner` — large textarea + input-type selector + Analyze button → routes to result.
- `/scan/$id` — Threat Analysis page (risk gauge, type, confidence, techniques, explanation, recommendations).
- `/history` — table of past scans, filter by risk/type, click → analysis page.
- `/reports` — charts (Recharts): threat volume trend (line), category distribution (pie), severity analysis (bar).
- `/profile` — avatar, name, email, sign out.
- `/admin` — admin-only (gated by `has_role`): total users, total scans, high-risk count, recent reports table.

## 4. Design System
Dark cybersecurity theme in `src/styles.css`:
- Deep navy/black background, neon cyan + electric green accents, danger red, amber warning.
- Mono display font (JetBrains Mono via Google Fonts <link> in __root) + Inter body.
- Glass panels, subtle grid background, glowing borders on risk badges, gradient hero on auth.
- Semantic tokens only; custom Button/Card variants (`glow`, `danger`, `panel`).

## 5. Layout
- Persistent collapsible sidebar (shadcn) with: Dashboard, Scanner, History, Reports, Profile, Admin (conditional).
- Topbar with SidebarTrigger + user menu.

## 6. Tech Notes
- Recharts for analytics.
- React Query + loaders pattern.
- Zod validation on scanner input (10–20000 chars).
- n8n/Gemini "future integration" — Gemini is wired now via Lovable AI; n8n left as a documented webhook stub (`/api/public/n8n-webhook`) verified by shared secret, ready to consume.

Ready to build on approval.