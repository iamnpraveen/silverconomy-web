// Refuse to run inside someone else's page (clickjacking). Real response headers say the same where the host allows them (see _headers).
if (window.top !== window.self) {
  document.documentElement.style.display = 'none'
  try { window.top.location = window.self.location } catch (e) { /* cross-origin parent: the page stays hidden */ }
}

// Links meant for the phone app (an invitation "#invite=…&k=…", or a sign-in handed over from the web "#access_token=…"):
// on a phone, open the Silverconomy app when it is installed and carry the link into it, so the person continues there without
// signing in again. If the app is not installed (or the browser blocks the jump), the web app carries on right here.
// A short card is also shown with "Open the app" / "Continue in the browser", because some in-app browsers (Gmail) only allow the
// jump after a tap. On a computer the web app simply opens.
(function () {
  var hash = window.location.hash || ''
  if (hash.indexOf('invite=') < 0 && hash.indexOf('access_token=') < 0) return
  var ua = navigator.userAgent || ''
  var android = /Android/i.test(ua)
  var ios = /iPhone|iPad|iPod/i.test(ua)
  if (!(android || ios) || /[?&]web=1/.test(window.location.search)) return
  var stores = window.CARELINK_STORES || {}
  var web = window.location.origin + window.location.pathname + '?web=1' + hash
  var appLink = android
    ? 'intent://join' + hash + '#Intent;scheme=silverconomy;package=com.moolya.silverconomy;S.browser_fallback_url=' + encodeURIComponent(stores.android || web) + ';end'
    : 'silverconomy://join' + hash
  function openApp() { window.location.href = appLink }
  function stayHere() { window.location.replace(web) }
  window.__silverconomyOpenApp = openApp
  // The web app waits behind this card; "Continue in the browser" reloads the page with ?web=1 and starts it normally.
  window.__silverconomyHold = true
  function card() {
    if (document.getElementById('open-app-card')) return
    var d = document.createElement('div')
    d.id = 'open-app-card'
    d.setAttribute('style', 'position:fixed;inset:0;z-index:99999;background:#2E6B3A;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:28px;font-family:-apple-system,Roboto,Arial,sans-serif;color:#fff;text-align:center')
    d.innerHTML = '<img src="logo.svg" width="72" height="72" alt="">' +
      '<div style="font:600 24px Georgia,serif">Opening Silverconomy…</div>' +
      '<div style="font-size:15px;color:#FFF0B8;max-width:320px">If the app is on this phone, it opens and you carry on there.</div>' +
      '<button id="oa-open" style="margin-top:8px;width:100%;max-width:320px;padding:15px;border:0;border-radius:14px;background:#FBF4E3;color:#2E6B3A;font-size:16px;font-weight:700">Open the app</button>' +
      '<button id="oa-web" style="width:100%;max-width:320px;padding:13px;border:1px solid #CFE3C8;border-radius:14px;background:transparent;color:#fff;font-size:15px">Continue in the browser</button>'
    document.body.appendChild(d)
    document.getElementById('oa-open').onclick = openApp
    document.getElementById('oa-web').onclick = stayHere
  }
  if (document.body) card(); else document.addEventListener('DOMContentLoaded', card)
  // Try straight away; on iOS (no fallback built in) stay on the card if nothing happened.
  setTimeout(openApp, 150)
})()
