# Deploying to Vercel

This project is a **TanStack Start** app (SSR + server functions + Lovable Cloud
backend). It is **not** a static SPA — do NOT add a `/(.*) -> /` rewrite rule.

## 1. Push to GitHub
In Lovable: chat **+ menu → GitHub → Connect project → Create Repository**.
Two-way sync stays active, so future Lovable edits keep flowing to GitHub
(and to Vercel via auto-deploy).

## 2. Import the repo on Vercel
- **Add New Project** → import the GitHub repo
- **Framework Preset:** Other
- **Build Command:** `npm run build` *(already set in `vercel.json`)*
- **Output Directory:** leave empty — TanStack Start's Vercel preset writes to
  `.vercel/output` automatically and Vercel detects it.
- **Install Command:** `npm install`

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)
Copy values from this project's `.env` (visible in Lovable) and from
**Lovable Cloud → Settings → Secrets**:

Client-exposed (must keep `VITE_` prefix):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Server-only (no `VITE_` prefix — never expose to client):
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY` *(only if you call Lovable AI from server functions)*

Set all of them for **Production**, **Preview**, and **Development** scopes.

## 4. Custom domain
Vercel → Project → Settings → Domains → add your domain and follow the DNS
instructions Vercel shows.

## 5. After every Lovable edit
The GitHub sync pushes the change; Vercel auto-deploys. No manual step.

## Troubleshooting

**404 on refresh of a route**
TanStack Start handles routing on the server. If you see a 404, the route
file under `src/routes/` doesn't exist — fix the route, don't add an SPA
rewrite. An SPA rewrite would break all server functions (registrations,
admin, receipts, sponsorship enquiries).

**Server functions return 500 / "Unauthorized"**
You're missing one of the server env vars above. Re-check the Environment
Variables panel in Vercel and redeploy.

**Build fails referencing Cloudflare / Workers**
Make sure `vite.config.ts` still has `cloudflare: false` and
`tanstackStart.target: "vercel"`. Lovable template updates may attempt to
re-add the Cloudflare adapter — keep these overrides.
