# BioVerseAR — Technical Handoff & Capstone Defense Package

> **Audience:** the college students who will maintain this project and defend it to a
> capstone/thesis panel.
> **Status of this document set:** every technical detail was produced by auditing the
> **actual current codebase** (git branch `main`, HEAD `ace71af`). Where the code did not
> let us confirm something, it is explicitly marked **“Needs Verification.”**

---

## What BioVerseAR is (one paragraph)

**BioVerseAR** is a gamified, **markerless‑AR** Grade 7 science **assessment** web app,
delivered as an installable **PWA** (Progressive Web App). A student signs in with a
username + password, explores a science topic as a **3D model in augmented reality** with
tappable labels, then takes a **quiz** (three difficulty levels). The app awards **points and
badges**, tracks **progress**, and ranks students on a class **leaderboard** with a **speed
tie‑break**. Teachers get a separate view to create classes, share join codes (including a
**QR code**), and monitor **per‑topic** and **per‑student** performance. It is built with
**plain HTML/CSS/JavaScript (no framework, no build step)** on a **Supabase** backend, and it
keeps working **offline** once a topic is opened.

---

## How to read these docs

| # | File | What it answers |
|---|------|-----------------|
| — | [`README.md`](README.md) | This index + project file structure |
| 01 | [`01-project-overview.md`](01-project-overview.md) | What it is, who it's for, the problem & solution, the “one‑minute” pitch |
| 02 | [`02-technology-stack.md`](02-technology-stack.md) | Every technology actually used, and why |
| 03 | [`03-system-architecture.md`](03-system-architecture.md) | Architecture, component, data‑flow & API‑flow diagrams |
| 04 | [`04-modules.md`](04-modules.md) | Every module: purpose, I/O, DB/API, rules, files |
| 05 | [`05-user-roles.md`](05-user-roles.md) | Roles & a permission matrix |
| 06 | [`06-user-flows.md`](06-user-flows.md) | Main / learning / AR / quiz / scoring / badge / leaderboard / auth flows |
| 07 | [`07-ui-ux-documentation.md`](07-ui-ux-documentation.md) | Screen inventory + design system |
| 08 | [`08-ar-system.md`](08-ar-system.md) | How AR & 3D actually work (very important) |
| 09 | [`09-assets-library.md`](09-assets-library.md) | Complete asset inventory + licenses |
| 10 | [`10-database.md`](10-database.md) | Schema, ERD, table dictionary, RLS |
| 11 | [`11-api-reference.md`](11-api-reference.md) | Every RPC & table call actually used |
| 12 | [`12-algorithms.md`](12-algorithms.md) | Scoring, best‑attempt, badges, progress, ranking |
| 13 | [`13-quiz-scoring.md`](13-quiz-scoring.md) | The quiz & scoring system in detail |
| 14 | [`14-gamification.md`](14-gamification.md) | Points, badges, competition — and the *why* |
| 15 | [`15-security.md`](15-security.md) | Auth, RLS, secrets, and honest weaknesses |
| 16 | [`16-error-handling.md`](16-error-handling.md) | How the app responds to failures |
| 17 | [`17-testing.md`](17-testing.md) | Test plan + test‑case table (honest status) |
| 18 | [`18-performance.md`](18-performance.md) | Performance concerns + recommendations |
| 19 | [`19-installation.md`](19-installation.md) | Full setup guide for a brand‑new developer |
| 20 | [`20-deployment.md`](20-deployment.md) | How it is deployed (GitHub Pages + Supabase) |
| 21 | [`21-limitations.md`](21-limitations.md) | Brutally honest known issues (by severity) |
| 22 | [`22-future-improvements.md`](22-future-improvements.md) | Realistic short/medium/long‑term work |
| 23 | [`23-panel-defense-guide.md`](23-panel-defense-guide.md) | How to present to the panel |
| 24 | [`24-demo-script.md`](24-demo-script.md) | A step‑by‑step live demo script (5–10 min) |
| 25 | [`25-panel-questions.md`](25-panel-questions.md) | Likely panel questions + strong answers |
| 26 | [`26-presentation-cheat-sheet.md`](26-presentation-cheat-sheet.md) | 30‑sec / 1‑min / 3‑min / 5‑min explanations |
| 27 | [`27-handoff-checklist.md`](27-handoff-checklist.md) | Final handoff checklist |
| 28 | [`28-teacher-console.md`](28-teacher-console.md) | Teacher console: auth, data layer, the four views, RPCs, how to extend it |
| 29 | [`29-teacher-guide.md`](29-teacher-guide.md) | Plain-language guide for teachers actually using the app |
| — | [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) | Consistency audit: implemented vs. planned vs. needs‑verification |
| — | [`diagrams/`](diagrams/) | Editable Mermaid diagram sources |

---

## Project facts at a glance (verified in code)

| Fact | Value |
|------|-------|
| Repository | `github.com/KnightxL123/bioversear-app` (branch `main`) |
| Hosting | GitHub Pages (static, served from repo root) |
| Backend | Supabase (project ref `znzboqqvtykwvsykkrxs`) |
| Frontend | Plain HTML + CSS + JavaScript (no framework, **no build step**) |
| PWA cache | Service worker `bioversear-app-v82` |
| Topics | 7 (all live) |
| Questions | **1,050** (7 topics × 3 difficulties × 50) |
| 3D models | 8 `.glb` files (all Draco‑compressed + WebP textures) |
| AR engine | `<model-viewer>` **1.6.3** (vendored) |
| Roles | `student`, `teacher` |

---

## Project file structure (the actual tree)

```
bioversear-app/                     ← repo root; GitHub Pages serves this directly
│
├── index.html                      Sign in / student sign‑up / teacher sign‑up / "welcome back"
├── dashboard.html                  Student Home (hero, stats, topic list, join‑competition modal)
├── topic.html                      One topic's hub: "Explore in AR" + 3 difficulty quiz cards
├── ar.html                         AR / 3D viewer (model-viewer, hotspots, guided tour)
├── quiz.html                       Quiz engine (10 Q/attempt, scoring, confetti, result)
├── review.html                     Post‑quiz answer review (All / Incorrect / Flagged)
├── badges.html                     Badge shelf (earned vs locked)
├── progress.html                   Per‑topic progress + overall stats
├── profile.html                    Profile (avatar, competition, account, change password)
├── leaderboard.html                Leaderboard (My Class / Everyone, per‑topic filter)
├── teacher.html                    Teacher console (classes, QR, roster, insights, drill‑down)
├── terms.html                      Terms & Conditions + Privacy Policy (static)
├── annotate.html                   DEV TOOL: place 3D annotation coordinates on a model
│
├── app.js                          Shared logic: auth, profile mirror, scoring, badges,
│                                    progress, leaderboard, avatars, guided tour, bottom nav
├── topics.js                       Single source of truth for the 7 topics (model, scene,
│                                    annotations, CC‑BY credit)
├── questions.js                    The 1,050‑question bank + points + feedback phrases
├── config.js                       Public Supabase URL + anon key (safe by design; see §15)
├── manifest.json                   PWA manifest (name, icons, theme color, standalone)
├── service-worker.js               Offline app‑shell cache (network‑first shell, cache‑first assets)
├── styles.css                      All styling (design system, AR scenes, animations)
│
├── supabase/                       Database migrations (run in the Supabase SQL Editor)
│   ├── SETUP.md                    ⚠️ ORIGINAL setup notes — partly STALE (see §19)
│   ├── schema.sql                  profiles, attempts, keep‑best trigger, leaderboard fns (v1)
│   ├── accounts.sql                adds profiles.full_name + profiles.role
│   ├── teacher.sql                 classes, app_config, teacher RPCs, password reset, bv_norm()
│   ├── avatars.sql                 adds profiles.avatar; re‑defines leaderboard/scores/roster
│   ├── competition.sql             adds attempts.time_ms; speed tie‑break; competitors‑only boards
│   ├── teacher-insights.sql        get_class_scores(), rename_class()
│   └── class-lookup.sql            class_by_code() (validate a code + return the class name)
│
├── assets/
│   ├── models/                     8 × .glb (animal_cell, human_cell, plant_cell, solar_system,
│   │                                atom, pendulum, wind_turbine, animal_cell_labeled*)
│   ├── vendor/                     model-viewer, supabase-js, gsap, qrcode + draco/ + basis/ decoders
│   ├── icons/                      PWA icons + favicon + apple-touch-icon
│   ├── mascot/                     tarsier-correct / tarsier-wrong / tarsier-celebrate (quiz FX)
│   ├── splash/                     tarsier-hero / tarsier-hero-scene (splash + page heroes)
│   └── space-stars.svg             backdrop for the space topic
│
└── docs/                           ← THIS documentation package
    ├── README.md … 27-*.md
    ├── DOCUMENTATION-AUDIT.md
    └── diagrams/
```

`*` `assets/models/animal_cell_labeled.glb` is present and precached by the service worker but
is **not referenced** by `topics.js` (the Animal Cells topic uses `animal_cell.glb`). See
[`21-limitations.md`](21-limitations.md).

---

## The single most important rule for maintainers

**The 7 topics and the quiz bank are 100% data‑driven.** To change content you almost never
touch page logic:

- **Topics** (model, AR scene, annotations, credit) live in **`topics.js`**.
- **Questions** (per topic, per difficulty) live in **`questions.js`**.
- Adding a 3D model to a topic = set its `model:` path in `topics.js`. `ar.html` and the topic
  hub read it directly — no other change needed.

Read [`04-modules.md`](04-modules.md) and [`08-ar-system.md`](08-ar-system.md) before editing
either file.
