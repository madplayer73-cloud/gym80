// Activity comes from real user input, never a repeating heartbeat. Sleeping
// only stops the server; forms, OCR and the workout clock keep their local state.
(() => {
  let lastSignal = 0;
  let pending = false;
  async function active(event) {
    if (!event.isTrusted || document.visibilityState !== 'visible' || pending || Date.now() - lastSignal < 30000) return;
    lastSignal = Date.now();
    pending = true;
    try { await fetch('/__sleep/activity', {method: 'POST', credentials: 'same-origin', cache: 'no-store'}); }
    catch { /* Normal saving displays its own connection status. */ }
    finally { pending = false; }
  }
  for (const name of ['pointerdown', 'keydown', 'input', 'scroll']) {
    document.addEventListener(name, active, {passive: true, capture: true});
  }
})();
