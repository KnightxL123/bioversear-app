# 29 — Teacher Guide (How to Use BioVerseAR)

> **Audience:** teachers using BioVerseAR with a Grade 7 science class. No technical
> knowledge assumed.
> **Companion document:** `28-teacher-console.md` is the technical version of this, for
> whoever maintains the app.

---

## What BioVerseAR does, in one paragraph

Students sign in on their phone, explore a science topic as a **3D model in augmented
reality** they can walk around and tap, then take a **quiz**. They earn points and badges,
and they can see a class leaderboard. **You** get a separate teacher view where you create
classes, hand out a join code, and watch how everyone is doing — per student and per topic.

---

## 1. Getting your teacher account

Teacher accounts are not self-serve. You need the **teacher code** from whoever runs the
app at your school. Without it you will get a normal student account.

1. Open the app and choose **Create account → I'm a teacher**.
2. Fill in your full name, a username, and a password.
3. Enter the **teacher code**.
4. Tap create.

**Your username is not an email address.** It is just a name you pick, like `mrsreyes`.
Write it down — you will use it every time you sign in.

> If the code is wrong, the app removes the half-made account so nothing is left behind.
> Just try again with the correct code.

**Password rules:** at least 6 characters, with 1 uppercase letter, 1 number, and 1 symbol.

---

## 2. Signing in

Enter your **username and password** on the opening screen. The app remembers you on that
device, so you normally only do this once per phone.

If you land on a student-looking screen instead of the teacher console, your account is not
marked as a teacher — see §8.

---

## 3. Creating your first class

1. On the **Dashboard**, tap **+ Create Class**.
2. Type a class name, for example `Grade 7 - Rizal`.
3. Tap **Create class**.

The app generates a **5-character join code** like `K7M4Q`. That code is how students get
into your class.

> The code deliberately never contains `I`, `O`, `0`, or `1`, so nobody mistypes it off the
> board.

**Tip:** if you name a class after a subject — something containing *Science*, *Biology*,
*Cells*, *Plants*, *Solar* — the app automatically gives it a matching icon and colour.
Names like `Grade 7 - Rizal` get a neutral coloured badge instead. Purely cosmetic.

---

## 4. Getting students into your class

You have three ways to share the code, all from the class card or the **Students** tab:

| Method | Best for |
|---|---|
| **Copy code** | Typing it on the board, or pasting into a group chat |
| **Share QR** | Fastest in a classroom — students point their camera at your screen |
| **Read it aloud** | Works fine; the code avoids look-alike characters |

Students choose **Create account**, enter their own name, username, and password, then
enter your class code. They appear in your Students tab immediately.

> Students only need the code **once**, when they create their account.

---

## 5. Reading the Dashboard

The Dashboard is your overview across **all** your classes.

**The four tiles at the top:**

| Tile | Means |
|---|---|
| **Students** | Total students across every class you own |
| **Classes** | How many classes you have |
| **Avg. progress** | Average of how much of the course your students have completed |
| **Top score** | The single highest quiz percentage anyone has scored |

**My Classes** — one card per class showing its code, how many students, the class's
average progress bar, and total points earned. **Tap any card** to jump straight into that
class's student list.

**Quick Actions** — shortcuts to Students, Analytics, the leaderboard, and sharing a code.

**Recent Activity** — the latest things students actually did, with real times:

> ✅ Mia Santos passed Animal Cells — 19/20 (95%) · Grade 7 - Rizal · 2 hours ago

A green check means they **passed** (scored 60% or more). A blue icon means they took the
quiz but did not pass yet.

> **Worth knowing:** the app only keeps each student's **best** result per topic. So if a
> student retakes a quiz and does *worse*, nothing new appears in the feed. It is a record
> of progress and achievements, not a minute-by-minute log of every attempt.

---

## 6. The Students tab

Pick a class using the chips at the top, then you will see every student, **sorted by
points, highest first**.

**Each student row shows:** their real name, their username, a progress bar, their points,
and how many badges they have earned.

**Search** by name or username, or use the **filter** to narrow down:

| Filter | Shows |
|---|---|
| **All** | Everyone |
| **Top (70%+)** | Your strongest students |
| **Needs help (<50%)** | Students who have started but are struggling — **check this one regularly** |
| **Not started** | Students who have not attempted any quiz yet |

**Tap a student** to expand their details. You will see a chip for every topic:

- **Green** — passed
- **Amber** — attempted, has not passed yet
- **Grey** — not started

This tells you at a glance *which* topic a struggling student is stuck on, not just that
they are behind.

### Resetting a student's password

It will happen — a student forgets their password.

1. Tap the student to expand them.
2. Tap **Reset password**.
3. Type a new password (6+ characters, 1 uppercase, 1 number, 1 symbol).
4. Tap **Set**, then tell the student their new password.

> You can only reset passwords for students in **your own** classes. You cannot see or
> recover their old password — nobody can; it is stored scrambled. You can only replace it.

---

## 7. The Analytics tab

Analytics is for **one class at a time** — pick it with the chips at the top.

- **Overview** — students, average progress, average points, and how many quizzes have
  been taken.
- **Topic completion** — a bar per topic showing how many students passed it. **This is
  your most useful screen.** A topic where most of the class failed usually means the topic
  needs reteaching, not that the students are weak.
- **Performance distribution** — how your class splits across Excellent (90%+), Good
  (70–89%), Average (50–69%), and Needs help (under 50%).
- **Top performing students** — your top 5 by points.
- **Insights** — plain-language observations, e.g. *"4 students may need help (under 50%
  progress)."*

> **"Quiz performance trend" is intentionally empty.** The app stores each student's best
> result, not a history of every attempt, so a week-by-week trend line cannot be produced
> honestly. Rather than show a made-up graph, it says so. If you need trends over time,
> record the numbers yourself at fixed points in the term.

---

## 8. Your Profile tab

- **Personal information** — change your display name.
- **Change password** — same rules as before.
- **About** — app info, terms, and privacy.
- **Log out** — sign out of this device.

---

## 9. Common questions

**Can I see a student's password?**
No. Passwords are stored scrambled and cannot be read by anyone, including you or the
developers. You can only set a new one.

**Can another teacher see my class?**
No. Every screen only ever loads classes you created. This is enforced by the database, not
just hidden in the app.

**A student joined the wrong class.**
Their class code is set when they create their account. Ask whoever maintains the app to
correct it in the database.

**Do students need internet?**
Yes to sign in and to save their scores. Once a topic has been opened online, the 3D model
works offline afterwards.

**Do I need to reinstall the app when it updates?**
No. The app updates itself the next time it is opened with an internet connection.

**Nothing is loading.**
Check the internet connection first, then fully close and reopen the app. If the class list
is still empty, contact whoever maintains the app — see `28-teacher-console.md` §9.

**AR is not working on a student's phone.**
AR needs a reasonably recent Android phone with Google Play Services for AR. The topic
still works as a 3D model on screen even when full AR is unavailable.

---

## 10. Classroom tips

- **Project the QR code** on the board on day one. It is by far the fastest way to get 30
  students enrolled.
- **Check the "Needs help" filter** before planning your next lesson — it is a two-second
  read of who is falling behind.
- **Use Topic completion to decide what to reteach.** If 70% of the class failed one topic,
  that is a signal about the topic, not the class.
- **The leaderboard motivates, but watch it.** Points reward both accuracy and speed. Some
  students respond well; keep an eye on any who find it discouraging.
- **Passing is 60%.** Students can retake a quiz — their best score is always the one kept,
  so retaking can only help them.

---

**See also:** `28-teacher-console.md` (technical reference for maintainers),
`05-user-roles.md` (what each role can do), `24-demo-script.md` (a walkthrough script).
