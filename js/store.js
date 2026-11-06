/*
 * Tienda (tienda.html). Three small jobs, all optional: without JavaScript
 * the page keeps its CSS fallbacks and the band stands still.
 *
 * 1. Header offset: the fixed .site-header changes height with the
 *    breakpoint, the font load and the menu wrapping (about 810-850px), so
 *    its real height goes into --store-header-h on <html>. store.css keeps
 *    a per-breakpoint fallback for when this does not run.
 * 2. Frames: on phones the frames row scrolls sideways but holds nothing
 *    focusable, so it becomes a Tab stop (arrow keys scroll it) only while
 *    it actually overflows.
 * 3. Band: copies the list once (hidden from assistive tech) so the marquee
 *    can loop, shows the pause / play button (WCAG 2.2.2), then sets
 *    .is-looping so both lists start moving in the same frame. The marquee
 *    itself only runs under html.js and without reduced motion (store.css).
 */
(function () {
  'use strict';

  var root = document.documentElement;

  /* 1. Header offset ------------------------------------------------------ */
  var header = document.querySelector('.site-header');

  if (header) {
    var setHeaderHeight = function () {
      var h = header.getBoundingClientRect().height;
      if (h > 0) root.style.setProperty('--store-header-h', h + 'px');
    };

    setHeaderHeight();
    if ('ResizeObserver' in window) {
      new ResizeObserver(setHeaderHeight).observe(header);
    } else {
      window.addEventListener('resize', setHeaderHeight);
      window.addEventListener('load', setHeaderHeight);
    }
  }

  /* 2. Frames ------------------------------------------------------------- */
  var frames = document.querySelector('[data-frames]');

  if (frames) {
    var setFramesFocus = function () {
      if (frames.scrollWidth > frames.clientWidth + 1) frames.tabIndex = 0;
      else frames.removeAttribute('tabindex');
    };

    setFramesFocus();
    if ('ResizeObserver' in window) new ResizeObserver(setFramesFocus).observe(frames);
    else window.addEventListener('resize', setFramesFocus);
  }

  /* 3. Band --------------------------------------------------------------- */
  var band = document.querySelector('[data-band]');
  var group = band && band.querySelector('[data-band-group]');
  var toggle = band && band.querySelector('[data-band-toggle]');
  if (!group || !toggle) return;

  var copy = group.cloneNode(true);
  copy.removeAttribute('data-band-group');
  copy.setAttribute('data-band-copy', '');
  copy.setAttribute('aria-hidden', 'true');
  group.parentNode.appendChild(copy);

  toggle.hidden = false;
  band.classList.add('is-looping');
  toggle.addEventListener('click', function () {
    var paused = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(paused));
    band.classList.toggle('is-paused', paused);
  });
})();
