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
    }
  };

  // Register the offline service worker (caches the whole app shell + model + decoders).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(function () { /* offline-first; ignore */ });
  }
})();
