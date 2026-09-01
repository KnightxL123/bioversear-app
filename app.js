/* BioVerseAR — shared helpers: on-device profile, auth guard, topic lookup,
   and offline service-worker registration. No network calls of its own. */
(function () {
  'use strict';
  var KEY = 'bioversear.profile.v1';

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
      location.href = 'index.html';
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
