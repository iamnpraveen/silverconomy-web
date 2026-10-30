// The address map on the web, like a food-delivery app: a full-screen Google Map at the person's location with a pin fixed in the
// middle. Moving the map updates the address under the pin; Confirm hands the place to the app through window.__silverPlace
// (a JSON string; "" when cancelled), which the app watches.
(function () {
  var loading = null
  function loadMaps(key) {
    if (window.google && window.google.maps) return Promise.resolve()
    if (loading) return loading
    loading = new Promise(function (ok, fail) {
      window.__silverMapsReady = ok
      var s = document.createElement('script')
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&loading=async&callback=__silverMapsReady'
      s.async = true; s.onerror = fail
      document.head.appendChild(s)
    })
    return loading
  }
  function el(tag, css, text) { var e = document.createElement(tag); e.style.cssText = css; if (text) e.textContent = text; return e }
  function part(r, type) { var c = (r.address_components || []).find(function (x) { return x.types.indexOf(type) >= 0 }); return c ? c.long_name : '' }

  window.silverPickPlaceStart = function () {
    window.__silverPlace = undefined
    var key = window.SILVER_MAPS_KEY
    if (!key) { window.__silverPlace = ''; return }
    var shade = el('div', 'position:fixed;inset:0;z-index:2147483000;background:#F7F3E9;font-family:Figtree,system-ui,sans-serif')
    var mapBox = el('div', 'position:absolute;inset:0 0 190px 0')
    var pin = el('div', 'position:absolute;left:50%;top:calc((100% - 190px)/2);transform:translate(-50%,-100%);font-size:42px;pointer-events:none', '📍')
    var panel = el('div', 'position:absolute;left:0;right:0;bottom:0;height:190px;box-sizing:border-box;padding:18px 20px;background:#FFFDF7;border-radius:22px 22px 0 0;box-shadow:0 -4px 16px rgba(0,0,0,.08)')
    var title = el('div', 'font-weight:700;font-size:18px;color:#2B2418', 'Your home on the map')
    var addr = el('div', 'margin:8px 0 14px;font-size:15px;color:#2B2418;min-height:38px', 'Finding your location…')
    var row = el('div', 'display:flex;gap:10px')
    var cancel = el('button', 'flex:1;height:48px;border-radius:14px;border:1px solid #CFC6B2;background:transparent;color:#2E6B3A;font-size:15px', 'Cancel')
    var confirm = el('button', 'flex:2;height:48px;border-radius:14px;border:0;background:#2E6B3A;color:#fff;font-size:16px;font-weight:600;opacity:.5', 'Confirm location')
    row.appendChild(cancel); row.appendChild(confirm)
    panel.appendChild(title); panel.appendChild(addr); panel.appendChild(row)
    shade.appendChild(mapBox); shade.appendChild(pin); shade.appendChild(panel)
    document.body.appendChild(shade)
    var found = null, map = null
    function close(v) { shade.remove(); window.__silverPlace = v }
    cancel.onclick = function () { close('') }
    confirm.onclick = function () {
      if (!map) return
      var c = map.getCenter(), r = found || {}
      var house = [part(r, 'street_number'), part(r, 'premise'), part(r, 'route')].filter(Boolean).join(' ')
      close(JSON.stringify({ lat: c.lat(), lng: c.lng(), house: house, pin: part(r, 'postal_code'), formatted: r.formatted_address || '' }))
    }
    function start(center, zoom) {
      loadMaps(key).then(function () {
        map = new google.maps.Map(mapBox, { center: center, zoom: zoom, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy', clickableIcons: false })
        var geocoder = new google.maps.Geocoder()
        map.addListener('dragstart', function () { addr.textContent = 'Finding the address…'; confirm.style.opacity = '.5' })
        map.addListener('idle', function () {
          geocoder.geocode({ location: map.getCenter() }).then(function (res) {
            found = res.results && res.results[0]
            addr.textContent = found ? found.formatted_address : 'No address found here. You can still confirm.'
          }).catch(function () { found = null; addr.textContent = 'Could not look up the address. You can still confirm.' })
            .finally(function () { confirm.style.opacity = '1' })
        })
      }).catch(function () { addr.textContent = 'The map could not load. Close it and type your address.' })
    }
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      function (p) { start({ lat: p.coords.latitude, lng: p.coords.longitude }, 17) },
      function () { start({ lat: 20.59, lng: 78.96 }, 5); },
      { enableHighAccuracy: true, timeout: 8000 })
    else start({ lat: 20.59, lng: 78.96 }, 5)
  }
})()
