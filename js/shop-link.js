/*
 * Home menu "Shop" link ([data-shop-link]). A normal tap or click follows its
 * href, the "coming soon" page. Pressing and holding it for HOLD_MS (touch
 * or mouse) opens data-hold-href instead: the real store page, so Edna and
 * Simon can preview it before launch. Keyboard users get the href.
 */
(function () {
  'use strict';

  var HOLD_MS = 600;
  var MOVE_PX = 10; // more movement than this is a scroll, not a hold

  var link = document.querySelector('[data-shop-link]');
  var target = link && link.getAttribute('data-hold-href');
  if (!target) return;

  // No iOS link preview or callout, and no text selection, on a long press.
  link.style.webkitTouchCallout = 'none';
  link.style.webkitUserSelect = 'none';
  link.style.userSelect = 'none';

  var timer = null;
  var held = false;
  var startX = 0;
  var startY = 0;

  function cancel() {
    if (timer) window.clearTimeout(timer);
    timer = null;
  }

  link.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    held = false;
    startX = event.clientX;
    startY = event.clientY;
    cancel();
    timer = window.setTimeout(function () {
      timer = null;
      held = true;
      if (navigator.vibrate) navigator.vibrate(15);
      window.location.href = target;
    }, HOLD_MS);
  });

  link.addEventListener('pointermove', function (event) {
    if (timer && Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) > MOVE_PX) cancel();
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    link.addEventListener(type, cancel);
  });

  // The hold already navigated: swallow the click that follows the release.
  link.addEventListener('click', function (event) {
    if (held) {
      event.preventDefault();
      held = false;
    }
  });

  // Android opens a context menu on a long press; keep the hold instead.
  link.addEventListener('contextmenu', function (event) {
    if (timer || held) event.preventDefault();
  });

  link.addEventListener('dragstart', function (event) {
    event.preventDefault();
  });
})();
