(function () {
  'use strict';

  let API_ENDPOINT = '';
  const SESSION_KEY = 'causal_session_id';
  let isInitialized = false;

  // ── Session Management ──────────────────────────────────────────────
  function getSessionId() {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ── Data Transmission ───────────────────────────────────────────────
  function sendEvent(payload) {
    if (!API_ENDPOINT) {
      console.warn('[Tracker] Cannot send event: API_ENDPOINT not configured.');
      return;
    }
    
    const data = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'text/plain' });
      const queued = navigator.sendBeacon(API_ENDPOINT, blob);
      if (queued) return;
    }

    try {
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      }).catch(function (err) {
        console.warn('[Tracker] Failed to send event:', err);
      });
    } catch (err) {
      console.warn('[Tracker] Error sending event:', err);
    }
  }

  // ── Event Tracking ─────────────────────────────────────────────────
  function trackPageView() {
    sendEvent({
      sessionId: getSessionId(),
      eventType: 'page_view',
      pageUrl: window.location.href,
      meta: {},
    });
  }

  function trackClick(e) {
    sendEvent({
      sessionId: getSessionId(),
      eventType: 'click',
      pageUrl: window.location.href,
      meta: {
        x: e.pageX,
        y: e.pageY,
      },
    });
  }

  // ── Initialize ──────────────────────────────────────────────────────
  window.CausalFunnel = {
    init: function (config) {
      if (isInitialized) {
        console.warn('[Tracker] Already initialized.');
        return;
      }
      
      if (!config || !config.endpoint) {
        console.error('[Tracker] Initialization failed: "endpoint" is required.');
        return;
      }

      API_ENDPOINT = config.endpoint;
      isInitialized = true;

      trackPageView();
      document.addEventListener('click', trackClick, { passive: true });

      console.log('[Tracker] Initialized | Endpoint:', API_ENDPOINT, '| Session:', getSessionId());
    }
  };
})();
