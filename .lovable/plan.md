
## Plan

Big request — grouped into 4 work streams. Each item maps to your message.

### 1. Database (one migration)

- `sponsorships` table (admin-managed): full_name, company, amount, message, logo_url, brochure_url, contact_email, contact_phone, status (`new` / `contacted` / `confirmed`), created_at. Public can INSERT, only admins read/update/delete.
- `awards` table (admin-managed): full_name, photo_url, citation, year, sort_order, created_at. Public read, admin write — same pattern as `board_members`.
- `raffle_sales` table (admin-managed): buyer_name, buyer_phone, buyer_email (nullable), pack (`single` / `pack20`), qty, amount, payment_status, reference. Public can INSERT, admin manages.
- Make `registrations.email` optional: drop NOT NULL, relax RLS WITH CHECK on length, replace `lookup_registration` RPC with one that accepts `(ref TEXT, phone TEXT, email TEXT)` and matches if phone matches OR (ref + email) match.
- New private storage bucket `sponsor-files` (signed URLs, admin-only) for logo + brochure uploads.

### 2. Public site changes

- **`src/lib/tiers.ts`** — Regular tier adds "Softcopy of event brochure". Gold tier adds "Hardcopy of event brochure" + "Custom souvenir".
- **`src/routes/sponsor.tsx`**
  - Make sponsor packages cumulative (₦250k inherits ₦100k perks, ₦500k inherits ₦250k, ₦1M inherits all). Each higher tier shows "Everything in <previous> plus…".
  - WhatsApp button → `+234 703 709 3388` (President) + a second button for `+234 803 357 7433` (President-Nominee).
  - New **Sponsorship enquiry form** at the bottom: name, company, amount, message, optional logo + brochure file upload (private bucket), saves to `sponsorships`. Shows confirmation with reference + Copy button.
  - **Copy payment reference** button next to the bank account block.
- **`src/routes/register.tsx`**
  - Email field becomes optional (with helper "Recommended — used to recover your slip").
  - Big "Copy reference" button on the success/receipt screen (in addition to the existing copy on the row).
  - Help text on success: "Save your reference. If you lose it, you can also recover your slip by phone number + email on the My slip page."
- **`src/routes/receipt.tsx`**
  - Lookup form: reference becomes optional; phone field added; if reference is empty, lookup uses phone + (email if provided). Backed by the new RPC.
- **`src/routes/index.tsx`**
  - New **Awards & Recognition** section: lists awardees from `awards` table, with the rules ("Of unquestionable character", "Contributed to humanitarian services", "Part or full sponsor to a club project"). Falls back to "Awardees will be announced soon" when empty.
  - Verify president fallback (already wired: uses official `/president-precious.png` when DB row is missing).
  - Footer adds: "Website by **webserve**".

### 3. Admin overhaul (`src/routes/admin.tsx`)

- Replace top tab bar with a **collapsible sidebar** (shadcn `Sidebar`) listing: Overview, Registrations, Sponsorships, Raffle, Awards, Leadership & Board, Settings, plus quick links "View site" and "Sign out". Header keeps `SidebarTrigger`.
- **Registrations row "View" action** → opens a detailed modal showing every field + payment proof + audit info (created_at, updated_at, status history derived from updated_at + current status) and a "Print slip" button that opens `/receipt`-style printable view in a new tab using a query-string token (admin-only print uses `id`).
- **Sponsorships panel**: list + signed-URL view for logo/brochure + status update.
- **Raffle panel**: record manual ticket sales (single ₦500 or pack of 20 ₦5,000), running total, mark paid.
- **Awards panel**: CRUD mirroring members (full_name, photo, citation, year, sort_order).
- Tooltip on "Display order" field: "Lower numbers appear first. Use 1, 2, 3… to reorder how members show on the homepage."

### 4. Notes & rationale (your open questions)

- **Reference recovery**: now possible by phone + email — users no longer need the 8-char ref to find their slip.
- **Display order** explanation surfaced inline in the admin form (as above).

### Out of scope (call out)

- I will not auto-email receipts (you opted out of email setup).
- Raffle ticket public purchase flow is recorded by admin only for now (public sale page can be added next iteration if you want it).

After implementation I will load `/`, `/register`, `/sponsor`, `/receipt`, `/admin` in the preview, run the linter, and verify no console errors before reporting done.
