# Community setup (Supabase) — ~15 minutes

The community section (publish a tier list, browse others', like them) needs a
free Supabase backend. You do these steps once; then paste two keys and I wire
up the rest. **You never share a password with me** — the two keys below are
public and safe to ship.

## 1. Create the project
1. Go to **https://supabase.com** → sign up (GitHub or email) → **New project**.
2. Name it `tier-deck`, pick a strong database password (save it in your own
   password manager — you won't need it in the app), choose the region closest
   to your users, and create. Wait ~2 min for it to provision.

## 2. Run the database schema
1. Left sidebar → **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy the
   whole file, paste it in, and click **Run**. You should see "Success".
   (Safe to re-run anytime — it's idempotent.)

## 3. Turn on Google & Apple sign-in
1. Left sidebar → **Authentication** → **Providers**.
2. **Google**: toggle on. You'll need a Google OAuth client
   (console.cloud.google.com → APIs & Services → Credentials → OAuth client ID,
   type "Web application"). Paste the Client ID + Secret into Supabase.
   - In the Google console, add this to **Authorized redirect URIs**:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (Supabase shows the exact URL on the Google provider page — copy it.)
3. **Apple**: toggle on (optional at first — Google alone is fine to launch).
   Apple requires a paid Apple Developer account, so you can skip it for now
   and add it later. Google covers the common case.
4. **Authentication → URL Configuration → Redirect URLs**: add
   `https://tier-deck.netlify.app/app` (and `http://localhost:8081/app` for
   local testing) so sign-in can return to the app.

## 4. Get the two keys
Left sidebar → **Project Settings** → **API**. Copy:
- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (⚠️ NOT the `service_role` secret — that one must stay private.)

## 5. Hand them over
- **Local:** put both in your `.env` (see [`.env.example`](.env.example)).
- **Live site:** add both in **Netlify → Site settings → Environment variables**
  (same place as your affiliate tag), then redeploy.

Then tell me "keys are in" (you can paste the URL + anon key to me — they're
public) and I'll build and verify the Community tab.

## Moderation (your responsibility)
- Reported lists land in the `reports` table — review them in the Supabase
  dashboard (Table Editor). You can delete any published list from there.
- The app never reads reports; only you (via the dashboard) can.
- Comments are a later phase — they raise the moderation bar, so we're doing
  publish + like first.
