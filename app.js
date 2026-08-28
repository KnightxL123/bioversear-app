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
    }
  };

  // Register the offline service worker (caches the whole app shell + model + decoders).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(function () { /* offline-first; ignore */ });
  }
})();
