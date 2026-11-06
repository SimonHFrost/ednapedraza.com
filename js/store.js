/*
 * Tienda (tienda.html): a pause / play button for the scrolling band, so
 * the moving text can be stopped (WCAG 2.2.2). Without JavaScript the button
 * stays hidden; with reduced motion the band never moves and CSS hides it.
 */
(function () {
  'use strict';

  var band = document.querySelector('[data-band]');
  var toggle = band && band.querySelector('[data-band-toggle]');
  if (!toggle) return;

  toggle.hidden = false;
  toggle.addEventListener('click', function () {
    var paused = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(paused));
    band.classList.toggle('is-paused', paused);
  });
})();
