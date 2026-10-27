/*
 * Shared behaviour for the Edna Pedraza site. The pages are static HTML
 * written by scripts/build.mjs from js/data.js; this file only adds
 * behaviour. Each page declares itself with
 * <body data-page="home|project|about|404">.
 */
(function () {
  'use strict';

  var REDIRECT_SECONDS = 8; // measured on the live 404 page (08 → 01, then home)

  /* ------------------------------------------------------------ old links */

  /** The menu filters used to be home-page URLs (?servicio=<key>); each
      service now has its own page at /<key>. */
  var SERVICE_KEYS = ['direccion-creativa', 'fashion-styling', 'direccion-de-arte'];

  function redirectOldServiceLink() {
    var key = new URLSearchParams(window.location.search).get('servicio');
    if (SERVICE_KEYS.indexOf(key) !== -1) window.location.replace('/' + key);
  }

  /* --------------------------------------------------------------- scroll */

  /** Smooth-scrolls to the home contact section: on clicks of a Contact link
      while already on the home page (which would otherwise reload or jump),
      and on arrival from another page via /#contacto, which
      browsers jump to instantly. */
  function initContactScroll() {
    var target = document.getElementById('contacto');
    if (!target) return;

    function scrollToContact() {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (window.location.hash === '#contacto') {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      window.setTimeout(scrollToContact, 300);
    }

    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href$="#contacto"]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      if (window.location.hash !== '#contacto') history.pushState(null, '', '#contacto');
      scrollToContact();
    });
  }

  /* ------------------------------------------------------------------ home */

  /** Relative luminance (WCAG) of an sRGB channel triple, 0–255 each. */
  function luminance(r, g, b) {
    return [r, g, b].reduce(function (sum, c, i) {
      c /= 255;
      c = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return sum + c * [0.2126, 0.7152, 0.0722][i];
    }, 0);
  }

  /**
   * 'white' or 'ink': the outline that stands out against the part of the
   * layer's photo that sits behind `target` (object-fit: cover, centred).
   * Null when the layer has no loaded, visible image.
   */
  function outlineFor(layer, target) {
    var img = layer.querySelector('img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    var box = img.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    var rect = target.getBoundingClientRect();
    var scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    var left = box.left + (box.width - img.naturalWidth * scale) / 2;
    var top = box.top + (box.height - img.naturalHeight * scale) / 2;
    var sx = Math.max(0, (rect.left - left) / scale);
    var sy = Math.max(0, (rect.top - top) / scale);
    var sw = Math.min(img.naturalWidth - sx, rect.width / scale);
    var sh = Math.min(img.naturalHeight - sy, rect.height / scale);
    if (sw <= 0 || sh <= 0) return null;

    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 8;
    var ctx = canvas.getContext('2d');
    var data;
    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    } catch (error) {
      return null; // a cross-origin image can't be read
    }
    var sum = 0;
    for (var i = 0; i < data.length; i += 4) sum += luminance(data[i], data[i + 1], data[i + 2]);
    // The purple name is itself dark, so the outline's main job is lifting it
    // off darker photos: white unless the photo there is light (where white
    // drops under about 2.2:1 contrast and ink reads better).
    return sum / (data.length / 4) > 0.43 ? 'ink' : 'white';
  }

  /** Hover / focus on a row cross-fades that project's image into the background. */
  function bindRowHighlight(list, layers, onChange) {
    var active = null;

    function activate(index) {
      var layer = layers[index];
      if (layer === active) return;
      if (active) active.classList.remove('is-active');
      active = layer || null;
      if (active) active.classList.add('is-active');
      onChange(active);
    }

    function clear() {
      if (active) active.classList.remove('is-active');
      active = null;
      onChange(null);
    }

    function rowFrom(target) {
      return target && target.closest ? target.closest('.work-row') : null;
    }

    list.addEventListener('mouseover', function (event) {
      var row = rowFrom(event.target);
      if (row) activate(Number(row.getAttribute('data-index')));
    });
    list.addEventListener('mouseleave', clear);
    list.addEventListener('focusin', function (event) {
      var row = rowFrom(event.target);
      if (row) activate(Number(row.getAttribute('data-index')));
    });
    list.addEventListener('focusout', function (event) {
      if (!list.contains(event.relatedTarget)) clear();
    });
  }

  function initHome() {
    var list = document.querySelector('[data-work-list]');
    if (!list) return;
    var layers = Array.prototype.slice.call(document.querySelectorAll('.home-bg__layer'));
    var base = document.querySelector('.home-bg__layer.is-base');

    // The name's outline follows whichever photo is showing behind it.
    var name = document.querySelector('.page-home .brand__name');
    var shown = null;
    function updateOutline(layer) {
      shown = layer;
      if (!name) return;
      var outline = (layer && layer.getAttribute('data-outline')) ||
        (base && base.getAttribute('data-outline')) || 'white';
      name.setAttribute('data-outline', outline);
    }
    function measure(layer) {
      var outline = name && outlineFor(layer, name);
      if (outline) layer.setAttribute('data-outline', outline);
      if (layer === base || layer === shown) updateOutline(shown);
    }
    layers.forEach(function (layer) {
      var img = layer.querySelector('img');
      if (!img) return;
      img.addEventListener('load', function () { measure(layer); });
      if (img.complete) measure(layer);
    });
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { layers.forEach(measure); }, 150);
    });

    bindRowHighlight(list, layers, updateOutline);
  }

  /* --------------------------------------------------------------- contact */

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateField(field) {
    var value = field.value.trim();
    if (!value) return field.getAttribute('data-required-message');
    if (field.type === 'email' && !EMAIL_PATTERN.test(value)) return 'Escribe un correo válido, por ejemplo nombre@ejemplo.com.';
    var min = Number(field.getAttribute('data-minlength') || 0);
    if (min && value.length < min) return 'Escribe al menos ' + min + ' caracteres.';
    return '';
  }

  function showFieldError(field, message) {
    var error = document.getElementById(field.getAttribute('aria-describedby'));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message;
  }

  /** No backend: validates locally, never sends data anywhere. */
  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var fields = Array.prototype.slice.call(form.querySelectorAll('.field__control'));
    var status = form.querySelector('[data-form-status]');

    fields.forEach(function (field) {
      field.addEventListener('blur', function () {
        if (field.value) showFieldError(field, validateField(field));
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') showFieldError(field, validateField(field));
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (field) {
        var message = validateField(field);
        showFieldError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        status.textContent = '';
        firstInvalid.focus();
        return;
      }
      var name = form.elements.nombre.value.trim().split(/\s+/)[0];
      form.reset();
      fields.forEach(function (field) { field.removeAttribute('aria-invalid'); });
      status.textContent = '¡Gracias, ' + name + '! Esto es una demostración: el mensaje no se ha enviado a ningún sitio.';
    });
  }

  /* ------------------------------------------------------------------- 404 */

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** Writes the count one digit per fixed-width cell (see .not-found__digit). */
  function showCount(node, n) {
    node.textContent = '';
    pad(n).split('').forEach(function (digit) {
      var cell = document.createElement('span');
      cell.className = 'not-found__digit';
      cell.textContent = digit;
      node.appendChild(cell);
    });
  }

  /** Counts 08 → 01 and then goes home (pauses while the tab is hidden). */
  function startRedirectCountdown(node) {
    if (!node) return;
    var remaining = REDIRECT_SECONDS;
    showCount(node, remaining);
    var timer = window.setInterval(function () {
      if (document.hidden) return;
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(timer);
        window.location.href = '/';
        return;
      }
      showCount(node, remaining);
    }, 1000);
  }

  /* --------------------------------------------------------------- header */

  /** Hides the header bar while scrolling down and shows it again on any
      scroll up (CSS slides it by --header-h). */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      header.style.setProperty('--header-h', header.offsetHeight + 'px');
      if (y > lastY && y > header.offsetHeight) header.classList.add('is-hidden');
      else if (y < lastY) header.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ boot */

  var PAGE_SETUP = {
    home: function () {
      redirectOldServiceLink();
      initHome();
    },
    '404': function () { startRedirectCountdown(document.querySelector('[data-countdown]')); }
  };

  function boot() {
    initContactScroll();
    initContactForm();
    var setup = PAGE_SETUP[document.body.getAttribute('data-page')];
    if (setup) setup();
    initHeaderScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
