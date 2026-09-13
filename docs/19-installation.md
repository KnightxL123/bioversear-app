# 19 — Installation & Setup (for a brand‑new developer)

This assumes you have **never seen the project**. Good news: there is **no build step and no npm
install** — it's static files. The only real setup is a **Supabase** backend.

> ⚠️ **`supabase/SETUP.md` is partly OUTDATED.** It describes the original design (“enable Anonymous
> Sign‑Ins… no password”). The current app uses **username + password**. Follow **this** guide, not
> the old SETUP.md, for the Auth steps.

## 1. Required software

| Tool | Why | Version |
|---|---|---|
| A modern **browser** (Chrome/Edge/Safari) | Run & test the app | Current |
| **Git** | Clone the repo, push to deploy | Any recent |
| A tiny **static file server** (choose one) | Serve the folder locally over http | e.g. Python 3, or Node's `npx serve` |
| A **Supabase** account | The backend (free tier) | — |
| *(Optional)* **Node.js** | Only if you re‑optimize 3D models with `@gltf-transform` | LTS |
| *(Optional)* Real **Android + iOS** devices | Test native AR (emulators can't) | — |

No SDKs, no Android Studio/Xcode, no bundler are required to run the app.

## 2. Get the code

```bash
git clone https://github.com/KnightxL123/bioversear-app.git
cd bioversear-app
```

## 3. Dependencies

**None to install.** All libraries are already vendored in `assets/vendor/`. There is no
`package.json` for the app itself.

## 4. Set up the Supabase backend

### 4a. Create the project
1. Go to <https://supabase.com> → sign in → **New project**.
2. Name it, set a strong database password (save it), pick the **Southeast Asia (Singapore)** region,
   Free plan. Wait ~2 minutes.

### 4b. Configure Auth (IMPORTANT — differs from the old SETUP.md)
- **Authentication → Providers → Email:** make sure **Email/password sign‑in is ENABLED**.
- **Turn OFF “Confirm email.”** Usernames map to fake internal emails, so email confirmation would
  block sign‑up. (If it's on, the app shows a message telling you to turn it off.)
- You do **not** need Anonymous sign‑in for the current app.

### 4c. Run the SQL migrations **in this exact order**
Open **SQL Editor → New query**, paste each file's full contents, and click **Run**:

1. `supabase/schema.sql`
2. `supabase/accounts.sql`
3. `supabase/teacher.sql`
4. `supabase/avatars.sql`
5. `supabase/competition.sql`
6. `supabase/teacher-insights.sql`
7. `supabase/class-lookup.sql`
8. `supabase/teacher-activity.sql` — powers the teacher Dashboard's **Recent Activity**
   feed and **Top score** tile. Adds two read-only functions only; no table, column or
   row is changed. **Skipping it fails silently** — the console still works but shows
   *Highlights* instead of *Recent Activity*, and *Total points* instead of *Top score*.

> Also run `supabase/fix-signup.sql` if sign-up reports *"account created but there was a
> problem."* It makes `profiles.class_code` nullable and re-asserts the owner RLS policies.

Each is idempotent (safe to re‑run). After this, **Table Editor** shows `profiles`, `attempts`,
`classes`, `app_config`.

### 4d. Set the secret teacher code
Run (replace the value with your own secret — **do not commit it**):
```sql
update public.app_config set value = 'YOUR-SECRET-TEACHER-CODE' where key = 'teacher_code';
```
Anyone who knows this code can register as a teacher, so keep it private.

## 5. Point the app at your Supabase project

Edit **`config.js`**:
```js
window.BV_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY'   // the "anon/public" key — NOT service_role
};
```
Find both under **Supabase → Project Settings → API**. The **anon/public** key is safe to embed
(RLS protects the data). **Never** put the `service_role` key here.

> There are **no other environment variables.** This is the app's entire configuration.

## 6. Run it locally

The app must be served over **http(s)**, not opened as a `file://` (service workers + AR need a real
origin). Pick one:

```bash
# Python 3
python -m http.server 8080
```
```bash
# Node
npx serve -l 8080 .
```
Then open <http://localhost:8080>. To test on your phone on the same Wi‑Fi, use your computer's LAN
IP; note that **native AR requires HTTPS**, so full AR testing is easiest on the deployed GitHub
Pages URL.

## 7. Verify it works

1. Open the site → **Sign up** a student (no class code) → you land on the dashboard.
2. Open a topic → **Explore in AR** → the model renders.
3. Take an **Easy** quiz → you get a score and (if ≥60%) a badge.
4. Sign up a **teacher** with your teacher code → create a class → copy the code → have the student
   **Join** it → the student appears on the teacher's roster and the leaderboard.

## 8. Building the application

There is **nothing to build.** “Building” = editing the static files. Content changes are usually
just:
- **Topics/models/annotations:** edit `topics.js` (+ drop a `.glb` in `assets/models/` and add it to
  `service-worker.js`'s precache list).
- **Questions:** edit `questions.js`.
- After changing any cached file, **bump the cache version** in `service-worker.js`
  (`CACHE_NAME = 'bioversear-app-vNN'`) so clients pick up the update.

## 9. (Optional) Re‑optimize a 3D model

Only if you're replacing/shrinking a model (see [`18-performance.md`](18-performance.md)). Tooling
used during development is `@gltf-transform` (Node). Remember the hard rule:
**Draco must be encoded with `--method sequential`** — `edgebreaker` renders blank in model‑viewer
1.6.3.

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| “No connection — try again when you are online.” while online | `config.js` URL/key wrong, or `supabase.min.js` not loaded | Recheck `config.js`; confirm the page loads the vendor script |
| Sign‑up fails mentioning email confirmation | “Confirm email” is ON | Turn it OFF in Supabase Auth |
| Login works but no leaderboard/roster | A migration wasn't run (missing RPC) | Re‑run the SQL files in order (§4c) |
| Teacher sign‑up always “Wrong teacher code” | `app_config.teacher_code` still `CHANGE-ME`/unset | Run the update in §4d |
| AR model is **blank** | Draco encoded with `edgebreaker` | Re‑encode with `--method sequential` |
| Model won't load at all | Path wrong in `topics.js`, or not cached and you're offline | Fix the path; open once online to cache |
| Old version keeps showing after an edit | Service‑worker cache | Bump `CACHE_NAME`; hard‑reload / reinstall the PWA |
| Storage/login not saved | Private/incognito mode blocks storage | Use a normal window |
| Works locally but AR “View in AR” missing | AR needs HTTPS + an ARCore/ARKit device | Test on the deployed HTTPS URL, on a real phone |

**Never expose real secrets** (the `service_role` key, your database password, or the teacher code)
in the repo, in `config.js`, or in these docs.
