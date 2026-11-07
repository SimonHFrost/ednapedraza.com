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
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      // Focus follows, as it would for a fragment link: the next Tab goes
      // into the contact section, not back to the menu.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
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

  /** Hover / focus on a row cross-fades that project's image into the background. */
  function bindRowHighlight(list, layers) {
    var active = null;

    function activate(index) {
      var layer = layers[index];
      if (layer === active) return;
      if (active) active.classList.remove('is-active');
      active = layer || null;
      if (active) active.classList.add('is-active');
    }

    function clear() {
      if (active) active.classList.remove('is-active');
      active = null;
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
    bindRowHighlight(list, document.querySelectorAll('.home-bg__layer'));
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

  function showStatus(status, message, isError) {
    status.textContent = message;
    status.classList.toggle('contact-form__status--error', Boolean(isError));
  }

  /** Posts the form to the Worker (worker/index.js), which emails it to Edna.
      Resolves to { ok, message }; message is the Worker's, if it sent one. */
  function sendContactForm(form) {
    return fetch(form.getAttribute('action') || '/api/contacto', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams(new FormData(form))
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok && data.ok === true, message: data.message };
      });
    }, function () {
      return { ok: false };
    });
  }

  /** Validates locally, then sends; keeps what was typed if sending fails. */
  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var fields = Array.prototype.slice.call(form.querySelectorAll('.field__control'));
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('[type="submit"]');
    var sending = false;
    form.noValidate = true; // show our messages, not the browser's

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
      if (sending) return;
      var firstInvalid = null;
      fields.forEach(function (field) {
        var message = validateField(field);
        showFieldError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        showStatus(status, '');
        firstInvalid.focus();
        return;
      }
      var name = form.elements.nombre.value.trim().split(/\s+/)[0];
      // aria-disabled rather than disabled, so the button keeps keyboard focus.
      sending = true;
      submit.setAttribute('aria-disabled', 'true');
      showStatus(status, 'Enviando…');
      sendContactForm(form).then(function (result) {
        sending = false;
        submit.removeAttribute('aria-disabled');
        if (!result.ok) {
          showStatus(status, result.message || 'No se pudo enviar el mensaje. Escríbeme directamente a edna.sapi@gmail.com.', true);
          return;
        }
        form.reset();
        fields.forEach(function (field) { field.removeAttribute('aria-invalid'); });
        showStatus(status, '¡Gracias, ' + name + '! Tu mensaje se envió. Te respondo pronto.');
      });
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

  /** Counts 08 → 01 and then goes home (pauses while the tab is hidden).
      Any key, tap, click or focus stops it and takes the count away, so
      nobody is moved on while reading or using the page. */
  function startRedirectCountdown(node) {
    if (!node) return;
    var remaining = REDIRECT_SECONDS;
    showCount(node, remaining);
    function stop() {
      window.clearInterval(timer);
      var countdown = node.closest('.not-found__countdown');
      if (countdown) countdown.hidden = true;
    }
    ['keydown', 'pointerdown', 'focusin'].forEach(function (type) {
      document.addEventListener(type, stop, { once: true });
    });
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
    // Home, desktop and tablet: the head has no ground over the cover, so it
    // stays away while the cover is part-scrolled (it would print over the
    // contents) and comes back at the very top or on the contact wall.
    var wall = document.body.getAttribute('data-page') === 'home' && document.getElementById('contacto');

    function update() {
      var y = window.scrollY;
      var overCover = wall && window.innerWidth >= 810 && y > 0 && wall.getBoundingClientRect().top > 1;
      header.style.setProperty('--header-h', header.offsetHeight + 'px');
      if (overCover || (y > lastY && y > header.offsetHeight)) header.classList.add('is-hidden');
      else if (y < lastY) header.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    }

    update(); // a reload can land mid-page
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
