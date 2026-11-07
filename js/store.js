/*
 * Tienda (tienda.html, proximamente.html). One small, optional job:
 * without JavaScript the page keeps the CSS fallback.
 *
 * Header offset: the fixed .site-header changes height with the
 * breakpoint, the font load and the menu wrapping (about 810-850px), so its
 * real height goes into --store-header-h on <html>. store.css keeps a
 * per-breakpoint fallback for when this does not run.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  if (!header) return;

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
})();
