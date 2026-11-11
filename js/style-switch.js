/*
 * Design 1 / Design 2 switch, floating in the bottom-right corner of every
 * page (on phones, just above the bottom menu bar).
 *
 *   Style 1  the previous design: css/styles-1.css (+ css/store-1.css)
 *   Style 2  the current design:  css/styles.css   (+ css/store.css)
 *
 * Loaded as a plain (blocking) script straight after the page's stylesheet
 * links, so the chosen style is in place before the first paint. The choice
 * is kept in localStorage; ?style=1 or ?style=2 in a link sets it too.
 *
 * Both styles share the same markup, except the store pages, which have one
 * file per style: tienda.html / tienda-1.html and proximamente.html /
 * proximamente-1.html. Those pages name their twin in data-style-alt on
 * <html>, and the style-1 files also carry data-style-only="1".
 */
(function () {
  var KEY = 'ep-style';
  var root = document.documentElement;

  function stored() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function store(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* private mode: this page only */ }
  }

  var param = null;
  try { param = new URLSearchParams(window.location.search).get('style'); } catch (e) { /* old browser */ }
  if (param === '1' || param === '2') store(param);
  var style = param === '1' || param === '2' ? param : (stored() === '1' ? '1' : '2');

  /** The query without ?style=, so it doesn't override a later click. */
  function plainSearch() {
    return window.location.search
      .replace(/([?&])style=[^&]*&?/, '$1')
      .replace(/[?&]$/, '');
  }

  if (param && window.history.replaceState) {
    try {
      window.history.replaceState(window.history.state, '', window.location.pathname + plainSearch() + window.location.hash);
    } catch (e) { /* file:// */ }
  }

  /** The same page in the other style, for the store pages; null elsewhere. */
  function twinFor(value) {
    var alt = root.getAttribute('data-style-alt');
    if (!alt) return null;
    var onlyOne = root.getAttribute('data-style-only') === '1';
    return (value === '1') === onlyOne ? null : alt + plainSearch() + window.location.hash;
  }

  var twin = twinFor(style);
  if (twin) {
    window.location.replace(twin);
    return;
  }
  root.setAttribute('data-style', style);

  /* ---------------------------------------------------- stylesheets */

  var SHEET = /(^|\/)(styles|store)(-1)?\.css(\?.*)?$/;

  function sheetFor(href, value) {
    return href.replace(SHEET, function (_, slash, name, one, query) {
      return slash + name + (value === '1' ? '-1' : '') + '.css' + (query || '');
    });
  }

  function managedLinks() {
    return Array.prototype.filter.call(document.querySelectorAll('link[rel="stylesheet"]'), function (link) {
      return SHEET.test(link.getAttribute('href') || '');
    });
  }

  // Before first paint: point the page's own stylesheet links at the chosen style.
  if (!root.hasAttribute('data-style-only')) {
    managedLinks().forEach(function (link) {
      var href = link.getAttribute('href');
      var next = sheetFor(href, style);
      if (next !== href) link.setAttribute('href', next);
    });
  }

  /** Switches without a reload: each new sheet replaces the old one once it
      has loaded, so the page never shows unstyled. */
  function swapSheets(value, done) {
    var links = managedLinks();
    var pending = links.length;
    if (!pending) { done(); return; }
    links.forEach(function (link) {
      var next = document.createElement('link');
      next.rel = 'stylesheet';
      next.href = sheetFor(link.getAttribute('href'), value);
      function finish() {
        if (link.parentNode) link.parentNode.removeChild(link);
        pending -= 1;
        if (!pending) done();
      }
      next.onload = finish;
      next.onerror = finish;
      link.parentNode.insertBefore(next, link.nextSibling);
    });
  }

  /* -------------------------------------------------------- control */

  var CSS =
    '.style-switch{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;' +
    'display:flex;gap:2px;margin:0;padding:3px;border:1px solid #1c1915;border-radius:6px;background:#fff;color:#1c1915;' +
    'box-shadow:0 2px 10px rgb(0 0 0/.2);font:600 12px/1 "DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;' +
    'letter-spacing:0;text-transform:none}' +
    '.style-switch__button{appearance:none;-webkit-appearance:none;min-width:0;min-height:28px;margin:0;padding:0 10px;' +
    'border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;' +
    'text-transform:none;line-height:28px;cursor:pointer;box-shadow:none}' +
    '.style-switch__button:hover{background:#ece7dc}' +
    '.style-switch__button[aria-pressed="true"]{background:#1c1915;color:#fff;cursor:default}' +
    '.style-switch__button:focus-visible{outline:2px solid #c2185b;outline-offset:2px}' +
    '@media print{.style-switch{display:none}}';

  /** Phones: sit just above the fixed bottom menu bar instead of over it. */
  function placeAboveMenuBar(control) {
    var menu = document.querySelector('.site-menu');
    var gap = 12;
    if (menu && window.innerWidth < 810) {
      var box = menu.getBoundingClientRect();
      // Style 2 docks a strip at the very bottom; style 1 floats its menu a
      // little above it. Either way, a menu in the lower half is the bar.
      if (box.height && box.bottom >= window.innerHeight - 48 && box.top > window.innerHeight / 2) {
        gap = window.innerHeight - box.top + 8;
      }
    }
    control.style.bottom = 'calc(' + gap + 'px + env(safe-area-inset-bottom, 0px))';
  }

  function build() {
    var css = document.createElement('style');
    css.textContent = CSS;
    document.head.appendChild(css);

    var control = document.createElement('div');
    control.className = 'style-switch';
    control.setAttribute('role', 'group');
    control.setAttribute('aria-label', 'Site design');
    control.setAttribute('lang', 'en');

    var buttons = ['1', '2'].map(function (value) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'style-switch__button';
      button.textContent = 'Design ' + value;
      button.setAttribute('aria-pressed', String(value === style));
      button.addEventListener('click', function () { choose(value); });
      control.appendChild(button);
      return button;
    });

    function choose(value) {
      if (value === style) return;
      store(value);
      var next = twinFor(value);
      if (next) {
        window.location.href = next;
        return;
      }
      style = value;
      buttons.forEach(function (button, i) {
        button.setAttribute('aria-pressed', String(String(i + 1) === value));
      });
      swapSheets(value, function () {
        root.setAttribute('data-style', value);
        placeAboveMenuBar(control);
        window.dispatchEvent(new Event('resize')); // let layout code re-measure
      });
    }

    document.body.appendChild(control);
    placeAboveMenuBar(control);
    window.addEventListener('resize', function () { placeAboveMenuBar(control); });
    window.addEventListener('load', function () { placeAboveMenuBar(control); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
