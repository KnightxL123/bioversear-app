/* BioVerseAR — shared helpers: on-device profile, auth guard, topic lookup,
   and offline service-worker registration. No network calls of its own. */
(function () {
  'use strict';
  var KEY = 'bioversear.profile.v1';

  // ---- Supabase (cloud sync). Optional: every method degrades gracefully to
  // on-device storage when Supabase is unconfigured or the device is offline. ----
  var CFG = window.BV_CONFIG || {};
  var _sb = null, _sbTried = false;
  function sb() {
    if (_sbTried) return _sb;
    _sbTried = true;
    try {
      if (window.supabase && CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) {
        _sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      }
    } catch (e) { _sb = null; }
    return _sb;
  }
  // The currently logged-in user's id (or null). Real accounts only — no
  // anonymous sign-in; the student logs in with a username + password.
  function currentUid() {
    var c = sb();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (r) {
      return (r && r.data && r.data.session) ? r.data.session.user.id : null;
    }).catch(function () { return null; });
  }
  // Usernames map to an internal handle so Supabase's email-based auth works
  // without students needing a real email. (Login is case-insensitive.)
  var AUTH_DOMAIN = 'students.bioversear.app';
  function emailFor(username) { return String(username || '').trim().toLowerCase() + '@' + AUTH_DOMAIN; }

  window.BV = {
    getProfile: function () {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
      catch (e) { return null; }
    },
    // Redirect to the join screen if there's no valid on-device profile.
    requireAuth: function () {
      var p = this.getProfile();
      if (!p || !p.alias) { location.replace('index.html'); return null; }
      return p;
    },
    signOut: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      var c = sb();
      if (c) { try { c.auth.signOut(); } catch (e) {} }
      location.href = 'index.html';
    },
    // ---- Accounts: username + password. Real name is PRIVATE (teacher-only). ----
    // Create a student account, then store the profile (alias + real name + class).
    // Resolves { ok:true } or { ok:false, error:<message> }.
    signUp: function (fullName, username, password, classCode) {
      var c = sb();
      if (!c) return Promise.resolve({ ok: false, error: 'No connection — try again when you are online.' });
      var self = this;
      return c.auth.signUp({ email: emailFor(username), password: password }).then(function (res) {
        if (res.error) return { ok: false, error: self._authMsg(res.error) };
        var uid = res.data && res.data.user && res.data.user.id;
        if (!uid) return { ok: false, error: 'Could not create the account. Please try again.' };
        return self._upsertProfile(uid, { alias: username, full_name: fullName, class_code: classCode, role: 'student' })
          .then(function (up) {
            if (up && up.error) return { ok: false, error: 'Account made, but saving your details failed. Tell your teacher.' };
            self._writeMirror({ alias: username, classCode: classCode, fullName: fullName });
            return { ok: true };
          });
      }).catch(function () { return { ok: false, error: 'Something went wrong creating the account.' }; });
    },
    logIn: function (username, password) {
      var c = sb();
      if (!c) return Promise.resolve({ ok: false, error: 'No connection — try again when you are online.' });
      var self = this;
      return c.auth.signInWithPassword({ email: emailFor(username), password: password }).then(function (res) {
        if (res.error) return { ok: false, error: self._authMsg(res.error) };
        var uid = res.data.user.id;
        return c.from('profiles').select('alias,class_code,full_name').eq('id', uid).maybeSingle().then(function (pr) {
          var row = (pr && pr.data) || {};
          self._writeMirror({ alias: row.alias || username, classCode: row.class_code || '', fullName: row.full_name || '' });
          return { ok: true };
        });
      }).catch(function () { return { ok: false, error: 'Something went wrong signing in.' }; });
    },
    // Change the password of the logged-in user.
    changePassword: function (newPassword) {
      var c = sb();
      if (!c) return Promise.resolve({ ok: false, error: 'No connection.' });
      var self = this;
      return c.auth.updateUser({ password: newPassword }).then(function (res) {
        return res.error ? { ok: false, error: self._authMsg(res.error) } : { ok: true };
      }).catch(function () { return { ok: false, error: 'Could not change the password.' }; });
    },
    _upsertProfile: function (uid, fields) {
      var c = sb(); if (!c) return Promise.resolve({});
      var row = { id: uid, updated_at: new Date().toISOString() };
      for (var k in fields) row[k] = fields[k];
      return c.from('profiles').upsert(row, { onConflict: 'id' });
    },
    _writeMirror: function (prof) { try { localStorage.setItem(KEY, JSON.stringify(prof)); } catch (e) {} },
    _authMsg: function (err) {
      var m = (err && err.message) || '';
      if (/already registered|already been registered|user already/i.test(m)) return 'That username is already taken — try another.';
      if (/invalid login credentials/i.test(m)) return 'Wrong username or password.';
      if (/password should be at least|at least 6/i.test(m)) return 'Password must be at least 6 characters.';
      if (/confirm/i.test(m) && /email/i.test(m)) return 'Turn OFF "Confirm email" in Supabase Auth to allow username sign-up.';
      return m || 'Something went wrong.';
    },
    topic: function (id) {
      var list = window.TOPICS || [];
      for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
      return null;
    },
    escape: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },

    // ---- On-device quiz results + badges (keyed by the current profile's alias) ----
    _rall: function () { try { return JSON.parse(localStorage.getItem('bioversear.results.v1') || '{}'); } catch (e) { return {}; } },
    _rsave: function (o) { try { localStorage.setItem('bioversear.results.v1', JSON.stringify(o)); } catch (e) {} },
    _me: function () { var p = this.getProfile(); return p && p.alias ? p.alias : null; },
    _mine: function (all) { var me = this._me(); if (!me) return null; all[me] = all[me] || { topics: {}, badges: [] }; return all[me]; },

    // Persist the BEST attempt per (topic, difficulty) so a weaker retake never
    // lowers a student's record or leaderboard standing.
    saveAttempt: function (topicId, diff, attempt) {
      var all = this._rall(), mine = this._mine(all); if (!mine) return;
      mine.topics[topicId] = mine.topics[topicId] || {};
      var prev = mine.topics[topicId][diff];
      if (!prev || typeof prev.score !== 'number' || attempt.score >= prev.score) {
        mine.topics[topicId][diff] = attempt;
      }
      this._rsave(all);
      this._syncAttempt(topicId, diff, mine.topics[topicId][diff]);
    },
    // Best-effort push of the (best) attempt to Supabase. The DB keep-best trigger
    // means a stale/worse upsert can never lower the cloud score.
    _syncAttempt: function (topicId, diff, a) {
      var c = sb(); if (!c || !a) return;
      currentUid().then(function (uid) {
        if (!uid) return;
        // NB: return the builder so it is actually sent (supabase-js queries are
        // lazy — they only fire when .then()/await is chained).
        return c.from('attempts').upsert({
          user_id: uid, topic_id: topicId, difficulty: diff,
          score: a.score, max: a.max, correct: a.correct, total: a.total,
          answers: a.answers || [], flagged: a.flagged || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topic_id,difficulty' });
      }).catch(function () {});
    },
    getAttempts: function (topicId) {
      var all = this._rall(), me = this._me();
      return (me && all[me] && all[me].topics[topicId]) || {};
    },
    // Transient per-tab snapshot so "Review answers" shows the attempt the student
    // JUST finished, even when it wasn't their best (which is what's persisted above).
    stashReview: function (topicId, diff, attempt) {
      try { sessionStorage.setItem('bioversear.review.' + topicId + '.' + diff, JSON.stringify(attempt)); } catch (e) {}
    },
    getReview: function (topicId, diff) {
      try { return JSON.parse(sessionStorage.getItem('bioversear.review.' + topicId + '.' + diff) || 'null'); } catch (e) { return null; }
    },
    awardBadge: function (topicId) {
      var all = this._rall(), mine = this._mine(all); if (!mine) return;
      if (mine.badges.indexOf(topicId) < 0) { mine.badges.push(topicId); this._rsave(all); }
    },
    hasBadge: function (topicId) {
      var all = this._rall(), me = this._me();
      return !!(me && all[me] && all[me].badges && all[me].badges.indexOf(topicId) >= 0);
    },
    // On-device leaderboard: sum of best score across all three difficulties of every
    // topic, per account (attempting more levels earns more points).
    leaderboard: function () {
      var all = this._rall(), DIFFS = ['easy', 'medium', 'hard'];
      return Object.keys(all).map(function (alias) {
        var topics = (all[alias] && all[alias].topics) || {}, total = 0;
        Object.keys(topics).forEach(function (tid) {
          var t = topics[tid];
          DIFFS.forEach(function (d) { if (t[d] && typeof t[d].score === 'number') total += t[d].score; });
        });
        return { alias: alias, score: total, badges: ((all[alias] && all[alias].badges) || []).length };
      }).sort(function (a, b) { return b.score - a.score; });
    },
    // Global leaderboard from Supabase (every device/class). Same row shape as
    // leaderboard() plus classCode; falls back to the on-device list if offline.
    fetchLeaderboard: function () {
      var self = this, c = sb();
      if (!c) return Promise.resolve(self.leaderboard());
      return currentUid().then(function () {
        return c.rpc('get_leaderboard').then(function (r) {
          if (r.error || !r.data) return self.leaderboard();
          return r.data.map(function (row) {
            return { alias: row.alias, classCode: row.class_code, score: Number(row.score) || 0, badges: Number(row.badges) || 0 };
          });
        });
      }).catch(function () { return self.leaderboard(); });
    },
    // Granular per-(student, topic) scores from Supabase, for the per-topic +
    // overall leaderboards. Resolves to an array, or null if the function isn't
    // available yet / offline (caller then falls back to fetchLeaderboard).
    fetchScores: function () {
      var c = sb();
      if (!c) return Promise.resolve(null);
      return currentUid().then(function () {
        return c.rpc('get_scores').then(function (r) {
          if (r.error || !r.data) return null;
          return r.data.map(function (row) {
            return { alias: row.alias, classCode: row.class_code, topicId: row.topic_id,
                     score: Number(row.score) || 0, passed: !!row.passed };
          });
        });
      }).catch(function () { return null; });
    },

    // ---- Per-topic progress, overall stats, last-topic, bottom nav ----
    // Single-quiz model: each topic has three difficulty pools. "pct" is completion
    // across the three levels (how many were passed at 60%+).
    topicProgress: function (topicId) {
      var a = this.getAttempts(topicId), DIFFS = ['easy', 'medium', 'hard'];
      var per = {}, attempted = false, passedCount = 0, points = 0;
      var bestPct = 0, bestScore = 0, bestMax = 0, lastAt = null;
      DIFFS.forEach(function (d) {
        var at = a[d];
        if (at && typeof at.score === 'number') {
          attempted = true;
          var pct = at.max ? Math.round(at.score / at.max * 100) : 0;
          var passed = at.max ? (at.score >= at.max * 0.6) : false;
          if (passed) passedCount++;
          points += at.score;
          if (pct > bestPct) { bestPct = pct; bestScore = at.score; bestMax = at.max; }
          if (at.at && (!lastAt || at.at > lastAt)) lastAt = at.at;
          per[d] = { score: at.score, max: at.max, correct: at.correct, total: at.total, pct: pct, passed: passed };
        } else { per[d] = null; }
      });
      return {
        per: per, attempted: attempted, passedCount: passedCount,
        done: this.hasBadge(topicId), points: points,
        best: bestScore, max: bestMax, bestPct: bestPct,
        pct: Math.round(passedCount / DIFFS.length * 100),
        lastAt: lastAt
      };
    },
    overallStats: function () {
      var topics = window.TOPICS || [], self = this;
      var badges = 0, points = 0, started = 0, done = 0;
      topics.forEach(function (t) {
        var p = self.topicProgress(t.id);
        if (p.attempted) started++;
        if (p.done) done++;
        if (self.hasBadge(t.id)) badges++;
        points += p.points;
      });
      return { badges: badges, points: points, started: started, done: done, total: topics.length };
    },
    setLastTopic: function (id) { try { localStorage.setItem('bioversear.lastTopic', id); } catch (e) {} },
    getLastTopic: function () { try { return localStorage.getItem('bioversear.lastTopic'); } catch (e) { return null; } },

    // Injects the shared bottom navigation into <nav id="bottomnav"> and marks the active tab.
    renderNav: function (active) {
      var nav = document.getElementById('bottomnav'); if (!nav) return;
      var ICON = {
        home: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6 8 6M6 10v9h4v-5h4v5h4v-9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        badges: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="1.7"/><path d="M9 13.5L7.5 21l4.5-2.6L16.5 21 15 13.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
        progress: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        profile: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
      };
      var items = [
        { id: 'home', label: 'Home', href: 'dashboard.html' },
        { id: 'badges', label: 'Badges', href: 'badges.html' },
        { id: 'progress', label: 'Progress', href: 'progress.html' },
        { id: 'profile', label: 'Profile', href: 'profile.html' }
      ];
      nav.className = 'bottomnav';
      nav.innerHTML = items.map(function (it) {
        var on = it.id === active;
        return '<a class="navitem' + (on ? ' on' : '') + '" href="' + it.href + '"' + (on ? ' aria-current="page"' : '') + '>' +
               ICON[it.id] + '<span>' + it.label + '</span></a>';
      }).join('');
    }
  };

  // Register the offline service worker (caches the whole app shell + model + decoders).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(function () { /* offline-first; ignore */ });
  }
})();
