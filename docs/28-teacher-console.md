# 28 — Teacher Console (Technical)

> **Audience:** whoever maintains or extends the teacher side of BioVerseAR.
> **Scope:** everything behind `teacher.html` — auth, data layer, the four views, the
> RPCs they call, and the rules the UI is not allowed to break.
> **Status:** audited against the current code. Where the database genuinely cannot
> answer something, this document says so rather than inventing a number.

---

## 1. What the teacher console is

A **single HTML page** (`teacher.html`) that switches between **four in-page views** —
Dashboard, Students, Analytics, Profile — using a bottom navigation bar. There is no
router, no framework, and no build step; the whole console is one `<script>` IIFE plus
shared helpers from `app.js`.

It is **read-mostly**. The only writes a teacher can perform are:

| Action | RPC |
|---|---|
| Create a class | `create_class` |
| Rename a class | `rename_class` |
| Reset a student's password | `reset_student_password` |
| Change their own password | Supabase `auth.updateUser` |
| Change their own display name | `profiles` self-update |

Everything else is reporting.

---

## 2. Entry & authorization

### 2.1 The page guard

```js
var profile = BV.requireTeacher(); if (!profile) return;
```

`BV.requireTeacher()` (in `app.js`) does three things:

1. No profile / no alias → redirect to `index.html` (not signed in).
2. `profile.role !== 'teacher'` → redirect to `dashboard.html` (a student landed here).
3. Otherwise return the profile and let the page render.

> **This is a convenience guard, not the security boundary.** A determined user can
> bypass a client-side redirect. The real enforcement is in the database — every teacher
> RPC filters on `c.teacher_id = auth.uid()`, so a non-owner gets **zero rows**, not an
> error. See §4.3 and `15-security.md`.

### 2.2 How someone becomes a teacher

Teacher accounts are **not** self-serve. `BV.signUpTeacher(fullName, username, password, teacherCode)`:

1. Creates a normal auth account (`auth.signUp`).
2. Ensures a session exists — `signUp` only returns one when **"Confirm email" is OFF**
   in Supabase; otherwise it signs in with the same credentials. RLS needs an
   authenticated session before the profile insert.
3. Calls `claim_teacher(code)`, which compares the supplied code against
   `app_config.teacher_code` and, on a match, sets `profiles.role = 'teacher'`.
4. **If the code is wrong**, the just-created account is removed via `delete_self()` so a
   failed attempt does not leave a half-made student account behind.

```sql
create or replace function public.claim_teacher(code text)
returns boolean ... as $$
  select (value = code) into ok from public.app_config where key = 'teacher_code';
  if coalesce(ok, false) then
    update public.profiles set role = 'teacher', updated_at = now() where id = auth.uid();
    return true;
  end if;
  return false;
$$;
```

**To change the teacher code:**

```sql
update public.app_config set value = 'YOUR-NEW-CODE' where key = 'teacher_code';
```

> Use straight quotes. Pasting a code with smart quotes from a word processor is the
> single most common cause of a `syntax error` here.

---

## 3. Page architecture

### 3.1 View switching

```js
var VIEWS = ['dashboard', 'students', 'analytics', 'profile'];
function showView(name) {
  VIEWS.forEach(function (v) { $('view-' + v).hidden = (v !== name); });
  renderNav(name);
  window.scrollTo(0, 0);
  if (name === 'students') renderStudents();
  else if (name === 'analytics') renderAnalytics();
  else if (name === 'profile') renderProfile();
  else if (name === 'dashboard') renderDashboard();
}
```

Each view is a `<section class="tview">` toggled with the `hidden` property. Re-rendering
on switch is cheap because **no network call happens** — all data is already cached (§4.2).

### 3.2 Module map

| Concern | Functions |
|---|---|
| Navigation | `renderNav`, `showView` |
| Data load | `loadAll`, `mergeStudents`, `classStats`, `aggregate` |
| Dashboard | `renderDashboard`, `statTile`, `classTheme`, `renderActivity`, `renderHighlights`, `timeAgo` |
| Students | `renderStudents`, `paintStudentList`, `studentCard`, `renderPicker`, `classBar` |
| Analytics | `renderAnalytics`, `aTile`, `legend`, `topTopicAcross` |
| Profile | `renderProfile`, `settingRow`, `toggleSetting`, `syncSetrows` |
| Shared UI | `emptyState`, `loadingBox`, `copyText`, `flashCopy`, `openQr`, `openCreate`, `avatarCell`, `progColor`, `pct` |

---

## 4. The data layer

### 4.1 Shape

```js
var classes   = [];   // [{ id, code, name, student_count }]
var classData = {};   // code -> { students: [...], loaded: true }
var activity  = [];   // recent attempts WITH timestamps (optional, see §5.5)
var topScore  = null; // highest single-quiz % (optional, see §5.5)
var currentCode = null; // the class selected in Students / Analytics
```

A **student object** (produced by `mergeStudents`) looks like:

```js
{
  info: { student_id, alias, full_name, avatar, score, badges },
  topics: { '<topic_id>': { score, passed } },
  passedCount: 3,
  completion: 43,      // passedCount / readyTopics * 100, clamped 0..100
  points: 1240         // = info.score
}
```

### 4.2 Load once, cache, never refetch

```js
function loadAll() {
  return BV.getTeacherClasses().then(function (list) {
    classes = list || [];
    if (!currentCode && classes.length) currentCode = classes[0].code;
    return Promise.all([
      Promise.all(classes.map(function (c) {
        return Promise.all([BV.getClassRoster(c.code), BV.getClassScores(c.code)])
          .then(function (res) {
            classData[c.code] = { students: mergeStudents(res[0], res[1]), loaded: true };
          });
      })),
      BV.getTeacherActivity(12).then(function (a) { activity = a || []; }),
      BV.getTeacherTopScore().then(function (t) { topScore = t; })
    ]);
  }).then(function () { loaded = true; });
}
```

**Cost:** `1 + (2 × number of classes) + 2` RPC calls, once per page load. Switching tabs
or classes afterwards costs **nothing**. A teacher with 3 classes issues 9 calls total.

> **If you add a feature, do not add a fetch inside a render function.** Renders run on
> every tab switch. Fetch in `loadAll`, cache, and render from the cache.

### 4.3 The RPCs

All are `SECURITY DEFINER` with `set search_path = public`, and all filter on
`c.teacher_id = auth.uid()`. A teacher can only ever see classes they own.

| RPC | Params | Returns | Used for |
|---|---|---|---|
| `get_teacher_classes()` | — | `id, code, name, student_count` | Class list |
| `get_class_roster(p_code)` | `text` | `student_id, alias, full_name, score, badges` | Names, points, badge counts |
| `get_class_scores(p_code)` | `text` | `student_id, full_name, alias, avatar, topic_id, score, passed` | Per-topic drill-down |
| `get_teacher_activity(p_limit)` | `int` (default 20, capped 100) | `student_id, full_name, alias, avatar, class_code, class_name, topic_id, difficulty, score, max, passed, updated_at` | Recent Activity feed |
| `get_teacher_topscore()` | — | `best_pct, full_name, alias, topic_id, class_code` (≤1 row) | Top Score tile |
| `create_class(p_name)` | `text` | `id, code, name` | Create a class |
| `rename_class(p_id, p_name)` | `uuid, text` | `boolean` | Rename |
| `reset_student_password(p_student, p_password)` | `uuid, text` | `boolean` | Password reset |
| `class_by_code(p_code)` | `text` | class row | Student-side join lookup |

**Client wrappers** live in `app.js` as `BV.getTeacherClasses`, `BV.getClassRoster`,
`BV.getClassScores`, `BV.getTeacherActivity`, `BV.getTeacherTopScore`, `BV.createClass`,
`BV.renameClass`, `BV.resetStudentPassword`.

Every read wrapper **swallows errors and returns an empty value** (`[]` / `null`):

```js
getClassScores: function (code) {
  var c = sb(); if (!c) return Promise.resolve([]);
  return c.rpc('get_class_scores', { p_code: code })
    .then(function (r) { return (r.error || !r.data) ? [] : r.data; })
    .catch(function () { return []; });
}
```

This is deliberate: a missing migration or a dropped connection degrades to an **empty
state**, never a broken page or a stack trace in front of a teacher.

### 4.4 Class join codes

`create_class` generates a **5-character** code from the alphabet
`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — 32 symbols with `I`, `O`, `0`, and `1` removed so a
code read off a projector cannot be mistyped. On a unique-constraint collision it retries
up to 12 times before raising.

Codes are compared through `bv_norm()` (trim + case-fold) everywhere, so a student typing
`abc23` joins the class created as `ABC23`.

### 4.5 Derived values (the only maths in the console)

| Value | Formula | Source of truth |
|---|---|---|
| **Passed a topic** | `score >= max * 0.6` (60%) | SQL, in `get_class_scores` / `get_teacher_activity` |
| **Student completion %** | `passedCount / readyTopicCount × 100`, clamped 0–100 | `mergeStudents` |
| **Class average progress** | mean of student `completion` | `classStats` |
| **Class total points** | `Σ student.points` | `classStats` |
| **Quizzes taken** | `Σ` distinct `(student, topic)` rows | `classStats` |
| **Avg points** | `totalPoints / studentCount` | `renderAnalytics` |

`readyTopicCount` is `window.TOPICS.filter(t => t.ready).length` — topics that are not
marked ready are excluded so progress is not permanently capped below 100%.

---

## 5. The four views

### 5.1 Dashboard (`#view-dashboard`)

- **Hero** — time-aware greeting (Good morning / afternoon / evening) + teacher name + mascot.
- **4 stat tiles** — Students, Classes, Avg. progress, and either **Top score** (when
  `get_teacher_topscore` is available) or **Total points** (fallback).
- **My Classes** — one card per class: subject-themed badge, name, join code with a copy
  button, student count, class-tinted progress bar, total points. Tapping a card sets
  `currentCode` and jumps to Students.
- **Quick Actions** — four shortcuts into the other views / the QR modal.
- **Recent Activity** *or* **Highlights** — see §5.5.

**Subject theming.** `classTheme(name, idx)` picks an icon + colour by keyword-matching the
class name; unmatched names fall back to a book icon with a colour cycled by index, so
cards stay visually distinct.

```js
var SUBJECTS = [
  { re: /(biolog|\bcell|\bdna|genetic|anatomy|organism)/, icon: 'dna',    color: '#2E9E6B' },
  { re: /(plant|\bleaf|photosynth|ecosystem|\becolog|botan|nature)/, icon: 'leaf', color: '#2E9E6B' },
  { re: /(space|solar|earth|astro|planet|universe|cosmo)/, icon: 'planet', color: '#7A4FD6' },
  { re: /(chemi|\batom|physic|matter|energy|\bforce|motion|\belement|\bscience)/, icon: 'atom', color: '#C77D0A' }
];
```

> Word-boundary anchors matter. An earlier version matched `gene` and themed
> *"General Science"* as a biology class. If you add keywords, check them against real
> class names first.

**Class card markup note.** The card is a `<div role="button" tabindex="0">`, **not** a
`<button>`, because it contains a nested copy `<button>` and button-in-button is invalid
HTML. Keyboard support (Enter / Space) is wired manually, and the click handler ignores
events originating inside `.tcard-copy`.

### 5.2 Students (`#view-students`)

- **Class picker** — horizontally scrollable chips (`renderPicker`), one per class.
- **Class bar** — themed badge, name, code, count + *Copy code · Share QR · Rename*.
- **Search + filter** — client-side over the cached list. Filters: All / Top (70%+) /
  Needs help (<50% **and** has attempted something) / Not started.
- **Student cards** — avatar, real name, `@username`, progress bar (coloured by
  performance via `progColor`), points, badge count. Expanding reveals per-topic chips
  (`pass` / `try` / `none`) and **Reset password**.

Sort order is **points descending**, always.

Password reset enforces the same client-side rules as sign-up (6+ chars, 1 uppercase,
1 number, 1 symbol) before calling `reset_student_password`.

### 5.3 Analytics (`#view-analytics`)

Scoped to the **selected class**, not all classes.

- **Overview tiles** — Students, Avg progress, Avg points, Quizzes taken.
- **Topic completion** — one bar per ready topic, `passed/total`.
- **Performance distribution** — a stacked bar + legend across four bands:
  Excellent ≥90%, Good 70–89%, Average 50–69%, Needs help <50%.
- **Top performing students** — top 5 by points, with rank pills.
- **Insights** — generated only from real facts (most-completed topic, count of students
  under 50%, top performer). If nothing is true, nothing is shown.
- **Quiz performance trend** — a deliberate **empty state** (§5.5).

### 5.4 Profile (`#view-profile`)

Gradient-banner identity card, the same four aggregate tiles, and three expanding setting
rows — *Personal information* (display name), *Change password*, *About* — plus Log out.
Only one row is open at a time (`openSetting` + `syncSetrows`).

### 5.5 Real-data policy (important)

The console **never fabricates a number.** Two consequences are visible in the UI:

| UI | Why |
|---|---|
| **"Quiz performance trend" shows an empty state** | `attempts` stores only the *best* attempt per `(student, topic, difficulty)`. There is no attempt history, so a week-by-week trend cannot be computed. Showing one would be fiction. |
| **"Recent Activity" falls back to "Highlights"** | The feed needs `teacher-activity.sql` (§6). Without it, `activity` is `[]` and the page shows current-state Highlights with no timestamps instead. |

**A known limitation of the feed itself:** because of the keep-best trigger, a retake that
scores *lower* does not update the row — so no entry appears. The feed is accurately
"recent progress and achievements," not a complete activity log. Say this plainly rather
than implying it is a full audit trail.

---

## 6. Required migrations

The teacher console needs these, **in order**:

```
1. supabase/schema.sql
2. supabase/accounts.sql
3. supabase/teacher.sql
4. supabase/avatars.sql
5. supabase/competition.sql
6. supabase/teacher-insights.sql
7. supabase/class-lookup.sql
8. supabase/teacher-activity.sql   <-- Recent Activity + Top Score
```

Plus `supabase/fix-signup.sql` if sign-up reports *"account created but there was a
problem."* It makes `profiles.class_code` nullable and re-asserts the owner RLS policies.

> **`teacher-activity.sql` is optional but silent.** Skip it and the console still works —
> it just shows Highlights instead of Recent Activity and Total points instead of Top
> score, with no error to explain why. If a maintainer reports "the feed is not there,"
> this is the first thing to check.

`teacher-activity.sql` adds **two read-only functions and nothing else** — no table,
column, row, or existing function is modified. To remove the feature entirely:

```sql
drop function if exists public.get_teacher_activity(int);
drop function if exists public.get_teacher_topscore();
```

Also required in Supabase **Authentication → Providers → Email**:

- **Confirm email: OFF** (otherwise `signUp` returns no session and the profile insert fails)
- **Allow new users to sign up: ON**

---

## 7. Design system

Teacher styles live in `styles.css` under the `TEACHER CONSOLE` block and reuse the app's
tokens (`--primary`, `--surface`, `--ink`, `--muted`, `--line`, `--radius`, `--shadow`).

| Prefix | Used for |
|---|---|
| `.t-hero`, `.t-stats` / `.t-stat` | Dashboard header + stat tiles |
| `.tcard-*` | Class cards (badge, code, copy, count, progress, points) |
| `.t-quick` / `.t-qa` | Quick Action tiles |
| `.t-act*` | Recent Activity feed |
| `.t-hilist` / `.t-hi` | Highlights + Insights rows |
| `.t-classpick` / `.t-chipclass`, `.t-classbar*` | Class picker + class bar |
| `.t-searchrow`, `.t-search`, `.t-filter` | Search + filter |
| `.tstu*` | Student cards |
| `.t-astats` / `.t-astat`, `.t-distbar`, `.t-toprow` | Analytics |
| `.t-idcard`, `.t-settings`, `.t-panel` | Profile |
| `.t-empty` | Shared empty state |

**Two layout rules worth knowing:**

- `.t-search { flex: 1; min-width: 0; }` — without `min-width: 0` the flex item refuses to
  shrink (default `min-width: auto`) and the search row overflows horizontally on a phone.
- Grids are 2-column on mobile and expand to 4 at `min-width: 560px`.

Mobile-first. Every change should be checked at **375px wide with zero horizontal
overflow**:

```js
document.documentElement.scrollWidth - document.documentElement.clientWidth  // must be 0
```

---

## 8. Extending it safely

**To add a stat tile:** compute it in `aggregate()` or `classStats()` from data already in
`classData`, then add a `statTile(...)` call. Do not fetch.

**To add a metric that needs new data:** add a **new** read-only `SECURITY DEFINER`
function filtered on `c.teacher_id = auth.uid()`, wrap it in `app.js` returning `[]`/`null`
on failure, fetch it in `loadAll`, and make the UI degrade gracefully when it is absent.
That is exactly the pattern `teacher-activity.sql` follows — copy it.

**Do not:**

- Change an existing RPC's return columns (other callers depend on them; add a new function instead).
- Render a placeholder or sample value when data is missing — use `emptyState()`.
- Rely on the client-side role check for security.
- Forget to bump `CACHE_NAME` in `service-worker.js` after editing `teacher.html`,
  `styles.css`, or `app.js`, or returning devices may serve stale files.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Redirected to `dashboard.html` on open | `profiles.role` is not `teacher` | Re-run `claim_teacher` with the right code, or set the role directly |
| Class list empty, no error | RPCs returning `[]` — usually a missing migration or no owned classes | Verify §6 ran; confirm `classes.teacher_id` matches the signed-in user |
| Recent Activity missing, Total points instead of Top score | `teacher-activity.sql` not applied | Run it |
| "Account created but there was a problem" | Profile insert blocked | Confirm email **OFF**, sign-ups **ON**, run `fix-signup.sql` |
| Rename / reset silently does nothing | RPC returned `false` — caller does not own the class/student | Check ownership |
| Changes not showing on the APK | Service worker serving cache | Bump `CACHE_NAME`, reopen the app online |

---

## 10. Files

| File | Role |
|---|---|
| `teacher.html` | The entire console — markup + view logic |
| `app.js` | `BV.*` auth, profile, and teacher RPC wrappers |
| `styles.css` | `TEACHER CONSOLE` design-system block |
| `topics.js` | Topic ids/names/`ready` flags (drives completion maths) |
| `service-worker.js` | Precache list + `CACHE_NAME` |
| `supabase/teacher.sql` | Classes, `app_config`, core teacher RPCs, `bv_norm()` |
| `supabase/teacher-insights.sql` | `get_class_scores`, `rename_class` |
| `supabase/teacher-activity.sql` | `get_teacher_activity`, `get_teacher_topscore` |

---

**See also:** `10-database.md` (schema), `11-api-reference.md` (all RPCs),
`15-security.md` (RLS & honest weaknesses), `19-installation.md` (setup),
`29-teacher-guide.md` (how a teacher actually uses this).
