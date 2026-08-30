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

    saveAttempt: function (topicId, mode, attempt) {
      var all = this._rall(), mine = this._mine(all); if (!mine) return;
      mine.topics[topicId] = mine.topics[topicId] || {};
      mine.topics[topicId][mode] = attempt;
      this._rsave(all);
    },
    getAttempts: function (topicId) {
      var all = this._rall(), me = this._me();
      return (me && all[me] && all[me].topics[topicId]) || {};
    },
    awardBadge: function (topicId) {
      var all = this._rall(), mine = this._mine(all); if (!mine) return;
      if (mine.badges.indexOf(topicId) < 0) { mine.badges.push(topicId); this._rsave(all); }
    },
    hasBadge: function (topicId) {
      var all = this._rall(), me = this._me();
      return !!(me && all[me] && all[me].badges && all[me].badges.indexOf(topicId) >= 0);
    },
    // On-device leaderboard: best (pre|post) per topic, summed across topics, per account.
    leaderboard: function () {
      var all = this._rall();
      return Object.keys(all).map(function (alias) {
        var topics = (all[alias] && all[alias].topics) || {}, total = 0;
        Object.keys(topics).forEach(function (tid) {
          var t = topics[tid];
          total += Math.max((t.pre && t.pre.score) || 0, (t.post && t.post.score) || 0);
        });
        return { alias: alias, score: total, badges: ((all[alias] && all[alias].badges) || []).length };
      }).sort(function (a, b) { return b.score - a.score; });
    },

    // ---- Phase B: per-topic progress, overall stats, last-topic, bottom nav ----
    topicProgress: function (topicId) {
      var a = this.getAttempts(topicId);
      var pre = a.pre && typeof a.pre.score === 'number' ? a.pre.score : null;
      var post = a.post && typeof a.post.score === 'number' ? a.post.score : null;
      var max = (a.post && a.post.max) || (a.pre && a.pre.max) || null;
      var best = Math.max(pre || 0, post || 0);
      var attempted = !!(a.pre || a.post);
      return {
        pre: pre, post: post, best: best, max: max,
        attempted: attempted, done: this.hasBadge(topicId),
        gain: (pre != null && post != null) ? (post - pre) : null,
        pct: (max && attempted) ? Math.round(best / max * 100) : 0,
        lastAt: (a.post && a.post.at) || (a.pre && a.pre.at) || null
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
        points += p.best;
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
