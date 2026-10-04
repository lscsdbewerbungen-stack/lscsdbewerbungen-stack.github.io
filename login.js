'use strict';
(function () {
  const C = window.LSCSD_CONFIG || {};
  const status = document.getElementById('status');

  function zeige(text, art) {
    status.textContent = text;
    status.dataset.art = art || '';
  }

  function zufall() {
    const b = new Uint8Array(24);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  }

  function starteLogin() {
    const state = zufall();
    sessionStorage.setItem('lscsd_state', state);
    const url = new URL('https://discord.com/oauth2/authorize');
    url.search = new URLSearchParams({
      response_type: 'code',
      client_id: C.DISCORD_CLIENT_ID,
      scope: 'identify',
      state: state,
      redirect_uri: C.REDIRECT_URI,
      prompt: 'consent',
    }).toString();
    location.assign(url.toString());
  }

  async function verarbeiteRueckkehr(params) {
    const code = params.get('code');
    const state = params.get('state');
    const erwartet = sessionStorage.getItem('lscsd_state');
    history.replaceState(null, '', location.pathname);
    sessionStorage.removeItem('lscsd_state');
    if (params.get('error') || !code || !state || state !== erwartet) {
      zeige('Anmeldung fehlgeschlagen. Bitte erneut versuchen.', 'fehler');
      return;
    }
    zeige('Anmeldung wird geprüft …');
    try {
      const res = await fetch(C.API_URL, { method: 'POST', body: JSON.stringify({ aktion: 'login', code: code }) });
      const r = await res.json();
      if (r && r.ok) {
        sessionStorage.setItem('lscsd_sitzung', r.sitzung);
        zeige('Angemeldet als ' + r.name + '.', 'ok');
      } else {
        zeige('Anmeldung fehlgeschlagen. Bitte erneut versuchen.', 'fehler');
      }
    } catch {
      zeige('Anmeldung derzeit nicht möglich. Bitte später erneut versuchen.', 'fehler');
    }
  }

  document.getElementById('btn-login').addEventListener('click', starteLogin);
  const params = new URLSearchParams(location.search);
  if (params.has('code') || params.has('error')) verarbeiteRueckkehr(params);
})();
