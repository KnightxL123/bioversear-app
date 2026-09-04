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

  // ---- Per-topic visual identity: a distinct icon + colour for each of the 7
  // topics (offline SVG, no assets). One source of truth, reused by the dashboard
  // and any other screen that shows a topic. Icon strokes/fills use currentColor,
  // so the tile's `color` drives the icon and `background` sets the tint. ----
  function _tvIcon(paths, filled) {
    return '<svg viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') +
      '" stroke="' + (filled ? 'none' : 'currentColor') +
      '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }
  var TOPIC_VIS = {
    'animal-cells':  { c: '#0FA595', b: '#E0F4F1', icon: _tvIcon('<circle cx="12" cy="12" r="8.5"/><circle cx="13" cy="11" r="3"/><circle cx="8.6" cy="15.2" r="1" fill="currentColor" stroke="none"/><circle cx="15.8" cy="15.4" r=".9" fill="currentColor" stroke="none"/>') },
    'human-cells':   { c: '#7A6BF0', b: '#ECE9FC', icon: _tvIcon('<path d="M9 3c0 4 6 5 6 9s-6 5-6 9"/><path d="M15 3c0 4-6 5-6 9s6 5 6 9"/><path d="M9.7 6h4.6M8.6 12h6.8M9.7 18h4.6"/>') },
    'life-sciences': { c: '#2CA457', b: '#E3F4E8', icon: _tvIcon('<path d="M5 19c-1-9 6-15 15-15 1 9-6 15-15 15z"/><path d="M8.5 15.5L16 8"/>') },
    'earth-space':   { c: '#476FE4', b: '#E6EDFC', icon: _tvIcon('<circle cx="11" cy="12.5" r="6"/><ellipse cx="11" cy="12.5" rx="10.5" ry="3.4" transform="rotate(-22 11 12.5)"/><path d="M19.5 4.2l.6 1.5 1.5.5-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.5z" fill="currentColor" stroke="none"/>') },
    'matter':        { c: '#E8871F', b: '#FBEDDA', icon: _tvIcon('<circle cx="7.5" cy="15.5" r="2.6"/><circle cx="16.5" cy="15.5" r="2.6"/><circle cx="12" cy="7.5" r="2.6"/><path d="M9 13.6l1.8-3.9M15 13.6l-1.8-3.9M9.9 15.5h4.2"/>') },
    'force-motion':  { c: '#E65A54', b: '#FBE7E6', icon: _tvIcon('<path d="M6.5 12H17"/><path d="M13 7.5l4.5 4.5L13 16.5"/><path d="M3 9.2h2.4M2.5 14.8h3.2"/>') },
    'energy':        { c: '#EAA015', b: '#FCEFD3', icon: _tvIcon('<path d="M13 2.5L6 13h4.3l-1.1 8.5L18 10.2h-4.7z"/>', true) }
  };
  var TOPIC_VIS_FALLBACK = { c: '#185FA5', b: '#E7EFF9', icon: _tvIcon('<path d="M12 2.8l7.5 4.3v9.8L12 21.2 4.5 16.9V7.1L12 2.8z"/><path d="M12 2.8v18.4M4.5 7.1L12 11.4l7.5-4.3"/>') };

  // ---- Explorer avatars: a small set of characters (tarsier mascots + kid
  // explorers) a student picks instead of a real photo. Pure inline SVG, so it
  // works offline and never uploads an image. Each has an id, name and tagline. ----
  var AVATARS = [
    { id: 'tars-1', name: 'Tarsy', tag: 'Tiny eyes, giant curiosity.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#F1E4D3"/><circle cx="14" cy="15" r="5" fill="#9C6B44"/><circle cx="34" cy="15" r="5" fill="#9C6B44"/><circle cx="24" cy="26" r="15" fill="#B07C50"/><circle cx="18" cy="24" r="6.6" fill="#fff"/><circle cx="30" cy="24" r="6.6" fill="#fff"/><circle cx="18.4" cy="24.4" r="3.5" fill="#2A241F"/><circle cx="29.6" cy="24.4" r="3.5" fill="#2A241F"/><circle cx="19.5" cy="23.2" r="1.1" fill="#fff"/><circle cx="30.7" cy="23.2" r="1.1" fill="#fff"/><ellipse cx="24" cy="31.5" rx="2.2" ry="1.5" fill="#6E4A30"/></svg>' },
    { id: 'tars-2', name: 'Nocturne', tag: 'Runs the night shift of science.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#E4E9EE"/><circle cx="14" cy="15" r="5" fill="#7F8992"/><circle cx="34" cy="15" r="5" fill="#7F8992"/><circle cx="24" cy="26" r="15" fill="#96A0A9"/><circle cx="18" cy="24" r="6.6" fill="#fff"/><circle cx="30" cy="24" r="6.6" fill="#fff"/><circle cx="18.4" cy="24.4" r="3.5" fill="#22303B"/><circle cx="29.6" cy="24.4" r="3.5" fill="#22303B"/><circle cx="19.5" cy="23.2" r="1.1" fill="#fff"/><circle cx="30.7" cy="23.2" r="1.1" fill="#fff"/><ellipse cx="24" cy="31.5" rx="2.2" ry="1.5" fill="#556069"/></svg>' },
    { id: 'tars-3', name: 'Pip', tag: 'Small hands, big discoveries.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#FBEECB"/><circle cx="14" cy="15" r="5" fill="#C79A3F"/><circle cx="34" cy="15" r="5" fill="#C79A3F"/><circle cx="24" cy="26" r="15" fill="#D9AF52"/><circle cx="18" cy="24" r="6.6" fill="#fff"/><circle cx="30" cy="24" r="6.6" fill="#fff"/><circle cx="18.4" cy="24.4" r="3.5" fill="#3A2E17"/><circle cx="29.6" cy="24.4" r="3.5" fill="#3A2E17"/><circle cx="19.5" cy="23.2" r="1.1" fill="#fff"/><circle cx="30.7" cy="23.2" r="1.1" fill="#fff"/><ellipse cx="24" cy="31.5" rx="2.2" ry="1.5" fill="#836223"/></svg>' },
    { id: 'kid-goggles', name: 'Iris', tag: 'Goggles down, science on.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#E6EEFB"/><path d="M11 25a13 12 0 0 1 26 0z" fill="#3C2A20"/><circle cx="24" cy="27" r="12.5" fill="#E3A06E"/><path d="M11.5 24a12.5 12.5 0 0 1 25 0 5 5 0 0 0-25 0z" fill="#3C2A20"/><rect x="14" y="22.5" width="20" height="7.5" rx="3.6" fill="#12A594" opacity=".92"/><circle cx="19.5" cy="26.2" r="2.4" fill="#0C1A2C"/><circle cx="28.5" cy="26.2" r="2.4" fill="#0C1A2C"/><circle cx="20.2" cy="25.5" r=".7" fill="#fff"/><circle cx="29.2" cy="25.5" r=".7" fill="#fff"/><path d="M20.5 33.5q3.5 2.6 7 0" stroke="#5A3A28" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>' },
    { id: 'kid-hat', name: 'Ranger', tag: 'Field notes and muddy boots.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#E3F1E7"/><circle cx="24" cy="27" r="12.5" fill="#E8B98C"/><circle cx="19.5" cy="26" r="1.5" fill="#3A2A20"/><circle cx="28.5" cy="26" r="1.5" fill="#3A2A20"/><path d="M20 31.5q4 2.8 8 0" stroke="#5A3A28" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M8 21h32" stroke="#7A5A2E" stroke-width="3.2" stroke-linecap="round"/><path d="M13 21a11 9 0 0 1 22 0z" fill="#9A7638"/><path d="M16 20.5h16" stroke="#7A5A2E" stroke-width="2.2" stroke-linecap="round"/></svg>' },
    { id: 'kid-curly', name: 'Nova', tag: 'Bright ideas, brighter hair.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#F3E7F6"/><g fill="#241A16"><circle cx="14" cy="18" r="5"/><circle cx="20" cy="13.5" r="5"/><circle cx="28" cy="13.5" r="5"/><circle cx="34" cy="18" r="5"/><circle cx="24" cy="12" r="5"/></g><circle cx="24" cy="27" r="12.5" fill="#8A5A3C"/><path d="M11.5 24a12.5 12.5 0 0 1 25 0 6 6 0 0 0-25 0z" fill="#241A16"/><circle cx="19.5" cy="26" r="1.6" fill="#20140E"/><circle cx="28.5" cy="26" r="1.6" fill="#20140E"/><path d="M20 31.5q4 3 8 0" stroke="#3A241A" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>' },
    { id: 'kid-scarf', name: 'Aya', tag: 'Asks why about everything.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#FBE9DE"/><path d="M24 9c-9 0-13 7-13 13 0 4 2 7 2 7l3-3c6 2 10 2 16 0l3 3s2-3 2-7c0-6-4-13-13-13z" fill="#E7734B"/><circle cx="24" cy="27" r="10.5" fill="#E1A57A"/><path d="M13.5 22a10.5 10.5 0 0 1 21 0z" fill="#E7734B"/><circle cx="20.2" cy="26.5" r="1.5" fill="#3A2A20"/><circle cx="27.8" cy="26.5" r="1.5" fill="#3A2A20"/><path d="M20.5 31q3.5 2.6 7 0" stroke="#5A3A28" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>' },
    { id: 'kid-glasses', name: 'Data', tag: 'Reads the universe\'s fine print.', svg: '<svg viewBox="0 0 48 48"><rect width="48" height="48" fill="#FDEFD6"/><path d="M11 26a13 13 0 0 1 26 0z" fill="#3A2416"/><circle cx="24" cy="27" r="12.5" fill="#F0C79B"/><path d="M11.5 25a12.5 12.5 0 0 1 25 0 6 6 0 0 0-25 0z" fill="#3A2416"/><g fill="none" stroke="#2A2018" stroke-width="1.7"><circle cx="19.5" cy="26.2" r="3.4"/><circle cx="28.5" cy="26.2" r="3.4"/><path d="M22.9 26.2h2.2M32 25.3l2.4-.6M16 25.3l-2.4-.6"/></g><circle cx="19.5" cy="26.2" r="1.3" fill="#2A2018"/><circle cx="28.5" cy="26.2" r="1.3" fill="#2A2018"/><path d="M20.5 32.5q3.5 2.4 7 0" stroke="#5A3A28" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>' }
  ];
  var AVATAR_BY_ID = {}; AVATARS.forEach(function (a) { AVATAR_BY_ID[a.id] = a; });
  // Best-effort write of the avatar id to the profile row. Never blocks or breaks
  // sign-up/login: if the `avatar` column isn't in the DB yet, the error is ignored
  // (the choice still lives in the local mirror and shows on this device).
  function _saveAvatarRemote(uid, id) {
    var c = sb();
    if (!c || !uid || !id) return Promise.resolve();
    return c.from('profiles').update({ avatar: id }).eq('id', uid).then(function () {}, function () {});
  }

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
    signUp: function (fullName, username, password, classCode, avatar) {
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
            self._writeMirror({ alias: username, classCode: classCode, fullName: fullName, role: 'student', avatar: avatar || '' });
            // Avatar is saved best-effort (separate write) so it never blocks sign-up.
            return _saveAvatarRemote(uid, avatar).then(function () { return { ok: true }; });
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
        return c.from('profiles').select('alias,class_code,full_name,role').eq('id', uid).maybeSingle().then(function (pr) {
          var row = (pr && pr.data) || {};
          var role = row.role || 'student';
          var mirror = { alias: row.alias || username, classCode: row.class_code || '', fullName: row.full_name || '', role: role };
          // Pull the avatar in a separate query so a not-yet-migrated `avatar`
          // column can't break login; fold it in, then finish.
          return c.from('profiles').select('avatar').eq('id', uid).maybeSingle().then(function (av) {
            if (av && av.data && av.data.avatar) mirror.avatar = av.data.avatar;
          }, function () {}).then(function () {
            self._writeMirror(mirror);
            return { ok: true, role: role };
          });
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

    // ---- Teacher accounts + classes (Phase 2) ----
    // Guard for teacher-only pages.
    requireTeacher: function () {
      var p = this.getProfile();
      if (!p || !p.alias) { location.replace('index.html'); return null; }
      if (p.role !== 'teacher') { location.replace('dashboard.html'); return null; }
      return p;
    },
    // Create a teacher account: makes the account, then claims the teacher role
    // with the secret code. A wrong code removes the just-made account cleanly.
    signUpTeacher: function (fullName, username, password, teacherCode) {
      var c = sb();
      if (!c) return Promise.resolve({ ok: false, error: 'No connection — try again when you are online.' });
      var self = this;
      return c.auth.signUp({ email: emailFor(username), password: password }).then(function (res) {
        if (res.error) return { ok: false, error: self._authMsg(res.error) };
        var uid = res.data && res.data.user && res.data.user.id;
        if (!uid) return { ok: false, error: 'Could not create the account. Please try again.' };
        return self._upsertProfile(uid, { alias: username, full_name: fullName, role: 'student' }).then(function (up) {
          if (up && up.error) {
            return c.rpc('delete_self').then(function () { return c.auth.signOut(); }).catch(function () {})
              .then(function () { return { ok: false, error: 'Could not save the account. Please try again.' }; });
          }
          return c.rpc('claim_teacher', { code: teacherCode }).then(function (r) {
            if (r.error || r.data !== true) {
              return c.rpc('delete_self').then(function () { return c.auth.signOut(); })
                .catch(function () {})
                .then(function () { return { ok: false, error: 'Wrong teacher code.' }; });
            }
            self._writeMirror({ alias: username, fullName: fullName, classCode: '', role: 'teacher' });
            return { ok: true };
          });
        });
      }).catch(function () { return { ok: false, error: 'Something went wrong creating the account.' }; });
    },
    createClass: function (name) {
      var c = sb(); if (!c) return Promise.resolve({ ok: false, error: 'No connection.' });
      return c.rpc('create_class', { p_name: name }).then(function (r) {
        if (r.error || !r.data || !r.data.length) return { ok: false, error: (r.error && r.error.message) || 'Could not create the class.' };
        return { ok: true, cls: r.data[0] };
      }).catch(function () { return { ok: false, error: 'Could not create the class.' }; });
    },
    getTeacherClasses: function () {
      var c = sb(); if (!c) return Promise.resolve([]);
      return c.rpc('get_teacher_classes').then(function (r) { return (r.error || !r.data) ? [] : r.data; }).catch(function () { return []; });
    },
    getClassRoster: function (code) {
      var c = sb(); if (!c) return Promise.resolve([]);
      return c.rpc('get_class_roster', { p_code: code }).then(function (r) { return (r.error || !r.data) ? [] : r.data; }).catch(function () { return []; });
    },
    resetStudentPassword: function (studentId, newPassword) {
      var c = sb(); if (!c) return Promise.resolve({ ok: false, error: 'No connection.' });
      return c.rpc('reset_student_password', { p_student: studentId, p_password: newPassword }).then(function (r) {
        if (r.error) return { ok: false, error: r.error.message };
        return r.data === true ? { ok: true } : { ok: false, error: 'Not allowed for this student.' };
      }).catch(function () { return { ok: false, error: 'Could not reset the password.' }; });
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
            return { alias: row.alias, classCode: row.class_code, score: Number(row.score) || 0, badges: Number(row.badges) || 0, avatar: row.avatar || '' };
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
                     score: Number(row.score) || 0, passed: !!row.passed, avatar: row.avatar || '' };
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

    // Per-topic icon + colour (see TOPIC_VIS above). Returns { c, b, icon };
    // falls back to a neutral cube for any unknown id.
    topicVisual: function (id) { return TOPIC_VIS[id] || TOPIC_VIS_FALLBACK; },

    // ---- Explorer avatars ----
    avatars: function () { return AVATARS; },
    avatarSvg: function (id) { var a = AVATAR_BY_ID[id]; return a ? a.svg : ''; },
    avatarName: function (id) { var a = AVATAR_BY_ID[id]; return a ? a.name : ''; },
    avatarTag: function (id) { var a = AVATAR_BY_ID[id]; return a ? a.tag : ''; },
    defaultAvatar: function () { return AVATARS[0].id; },
    // Change the logged-in student's avatar: mirror first (instant UI), then a
    // best-effort DB write. Always resolves ok — a failed sync is non-fatal.
    setAvatar: function (id) {
      var prof = this.getProfile() || {};
      prof.avatar = id; this._writeMirror(prof);
      return currentUid().then(function (uid) { return _saveAvatarRemote(uid, id); })
        .then(function () { return { ok: true }; }, function () { return { ok: true }; });
    },

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
