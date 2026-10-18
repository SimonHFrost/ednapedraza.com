/*
 * Shared behaviour + page renderers for the Edna Pedraza site.
 * Classic script (works over file:// and http). Depends on js/data.js.
 * Each page declares itself with <body data-page="home|project|about|contact|404">.
 */
(function () {
  'use strict';

  var PROJECTS = window.PROJECTS || [];
  var SITE_NAME = 'Edna Pedraza';
  var REDIRECT_SECONDS = 8; // measured on the live 404 page (08 → 01, then home)

  /* ---------------------------------------------------------------- helpers */

  /** Create an element: el('a', { href: '#', class: 'x' }, ['text', node]). */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'style') node.setAttribute('style', value);
      else node.setAttribute(key, value === true ? '' : value);
    });
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function projectUrl(project) {
    return 'project.html?slug=' + encodeURIComponent(project.slug);
  }

  function setMeta(name, content) {
    var meta = document.querySelector('meta[name="' + name + '"]');
    if (meta) meta.setAttribute('content', content);
  }

  /* ------------------------------------------------------------------ menu */

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
    if (!toggle || !menu) return;

    var links = Array.prototype.slice.call(menu.querySelectorAll('a'));

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open, options) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
      if (open && options && options.focusFirst && links[0]) links[0].focus({ preventScroll: true });
      if (!open && options && options.returnFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener('click', function (event) {
      // Keyboard activation (detail === 0) moves focus into the menu.
      setOpen(!isOpen(), { focusFirst: event.detail === 0 });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false, { returnFocus: true });
      }
    });

    // Click anywhere else closes the menu.
    document.addEventListener('click', function (event) {
      if (!isOpen()) return;
      if (toggle.contains(event.target) || links.some(function (a) { return a.contains(event.target); })) return;
      setOpen(false);
    });

    // Tabbing out of the toggle + links closes it.
    document.addEventListener('focusin', function (event) {
      if (!isOpen()) return;
      if (event.target === toggle || menu.contains(event.target)) return;
      setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ home */

  function buildBackgroundLayer(project, index) {
    var classes = 'home-bg__layer' + (index === 0 ? ' is-base' : '');
    if (!project.hero) {
      return el('div', { class: classes + ' home-bg__layer--empty is-empty', 'data-index': index });
    }
    return el('div', { class: classes, 'data-index': index }, [
      el('img', {
        src: project.hero,
        alt: '',
        width: 1600,
        height: 1000,
        decoding: 'async',
        loading: index === 0 ? 'eager' : 'lazy',
        fetchpriority: index === 0 ? 'high' : null
      })
    ]);
  }

  function buildRow(project, index) {
    return el('li', {}, [
      el('a', { class: 'work-row', href: projectUrl(project), 'data-index': index }, [
        el('span', { class: 'work-row__band', 'aria-hidden': 'true' }),
        el('span', { class: 'work-row__title' }, [project.title]),
        el('span', { class: 'work-row__discipline' }, [
          el('span', { class: 'visually-hidden' }, [' — ']),
          project.discipline
        ])
      ])
    ]);
  }

  function buildCard(project) {
    var media = project.hero
      ? el('span', { class: 'work-card__media' }, [
        el('img', { src: project.hero, alt: '', width: 1600, height: 1000, loading: 'lazy', decoding: 'async' })
      ])
      : el('span', { class: 'work-card__media is-empty' });
    return el('li', { class: 'work-card' }, [
      el('a', { class: 'work-card__link', href: projectUrl(project) }, [
        el('span', { class: 'work-card__title' }, [project.title]),
        media,
        el('span', { class: 'visually-hidden' }, [' — ' + project.discipline])
      ])
    ]);
  }

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

  function renderHome() {
    var bg = document.querySelector('[data-home-bg]');
    var list = document.querySelector('[data-work-list]');
    var grid = document.querySelector('[data-work-grid]');
    if (!bg || !list || !grid) return;

    var layers = PROJECTS.map(buildBackgroundLayer);
    layers.forEach(function (layer) { bg.appendChild(layer); });
    PROJECTS.forEach(function (project, index) {
      list.appendChild(buildRow(project, index));
      grid.appendChild(buildCard(project));
    });
    bindRowHighlight(list, layers);
  }

  /* --------------------------------------------------------------- project */

  function findProjectIndex(slug) {
    for (var i = 0; i < PROJECTS.length; i += 1) {
      if (PROJECTS[i].slug === slug) return i;
    }
    return -1;
  }

  /** description: array of runs; odd positions are bold. */
  function buildLede(runs) {
    return el('p', { class: 'project__lede' }, runs.map(function (run, i) {
      return i % 2 ? el('strong', {}, [run]) : run;
    }));
  }

  function buildTags(project) {
    return el('div', { class: 'project__tags mono-label' }, [
      el('span', { class: 'tag tag--pill' }, [el('span', { class: 'visually-hidden' }, ['Cliente: ']), project.client]),
      el('span', { class: 'tag tag--plain', 'aria-hidden': 'true' }, ['Cliente & Servicio']),
      el('span', { class: 'tag tag--pill' }, [el('span', { class: 'visually-hidden' }, ['Servicio: ']), project.discipline])
    ]);
  }

  function buildHero(project) {
    if (!project.hero) {
      return el('figure', { class: 'project__hero is-empty' }, [
        el('figcaption', { class: 'visually-hidden' }, ['Este proyecto no tiene imagen principal.'])
      ]);
    }
    return el('figure', { class: 'project__hero' }, [
      el('img', {
        src: project.hero,
        alt: 'Ilustración de ejemplo (marcador de posición) para el proyecto ' + project.title + '.',
        width: 1600,
        height: 1000,
        decoding: 'async',
        fetchpriority: 'high'
      })
    ]);
  }

  function buildGallery(project) {
    var total = project.gallery.length;
    return el('ul', { class: 'project__gallery', style: '--cols: ' + total, 'aria-label': 'Galería' },
      project.gallery.map(function (src, i) {
        return el('li', {}, [
          el('img', {
            src: src,
            alt: 'Ilustración de ejemplo ' + (i + 1) + ' de ' + total + ' para ' + project.title + '.',
            width: 800,
            height: 800,
            loading: 'lazy',
            decoding: 'async'
          })
        ]);
      }));
  }

  /** Description and credits are optional; with neither, the block is left out. */
  function buildBody(project) {
    var parts = [];
    if (project.description.length) parts.push(buildLede(project.description));
    if (project.credits.length) {
      parts.push(el('ul', { class: 'project__credits', 'aria-label': 'Créditos' }, project.credits.map(function (line) {
        return el('li', {}, [line]);
      })));
    }
    return parts.length ? el('div', { class: 'project__body' }, parts) : null;
  }

  function buildPagerItem(project, direction) {
    var isPrev = direction === 'prev';
    return el('li', { class: 'pager__item pager__item--' + direction }, [
      el('a', { class: 'pager__link', href: projectUrl(project), rel: direction }, [
        el('span', { class: 'pager__label mono-label' }, [
          el('span', { class: 'pager__dot', 'aria-hidden': 'true' }),
          isPrev ? 'Previous' : 'Next'
        ]),
        el('span', { class: 'pager__title' }, [project.title])
      ])
    ]);
  }

  function buildPager(index) {
    var items = [];
    if (index > 0) items.push(buildPagerItem(PROJECTS[index - 1], 'prev'));
    if (index < PROJECTS.length - 1) items.push(buildPagerItem(PROJECTS[index + 1], 'next'));
    return el('footer', { class: 'project-footer' }, [
      el('nav', { class: 'pager', 'aria-label': 'Proyecto anterior y siguiente' }, [
        el('ul', { class: 'pager__list' }, items)
      ])
    ]);
  }

  function applyProjectTheme(project) {
    var root = document.documentElement;
    root.style.setProperty('--project-bg', project.bg);
    root.style.setProperty('--project-pill', project.pill);
    setMeta('theme-color', project.bg);
  }

  function renderProject() {
    var root = document.querySelector('[data-project-root]');
    if (!root) return;
    var slug = new URLSearchParams(window.location.search).get('slug');
    var index = findProjectIndex(slug);

    if (index === -1) {
      showNotFound(root);
      return;
    }

    var project = PROJECTS[index];
    applyProjectTheme(project);
    document.title = project.title + ' — ' + SITE_NAME;
    setMeta('description', project.title + ' (' + project.discipline + '): proyecto de Edna Pedraza, Directora Creativa y Estilista de Moda.');

    var article = el('article', { class: 'project', 'aria-labelledby': 'project-title' }, [
      buildTags(project),
      el('h1', { class: 'project__title', id: 'project-title' }, [project.title]),
      el('hr', { class: 'project__rule' }),
      buildHero(project),
      buildBody(project),
      buildGallery(project)
    ]);

    root.replaceChildren(article, buildPager(index));
  }

  /** Unknown slug: swap the page into the 404 view (same markup as 404.html). */
  function showNotFound(root) {
    var template = document.getElementById('tpl-not-found');
    document.body.classList.remove('page-project');
    document.body.classList.add('page-404');
    document.title = 'Página no encontrada — ' + SITE_NAME;
    setMeta('theme-color', '#000000');
    setMeta('robots', 'noindex');
    root.replaceChildren(template.content.cloneNode(true));
    startRedirectCountdown(root.querySelector('[data-countdown]'));
  }

  /* ----------------------------------------------------------------- about */

  function renderAboutGallery() {
    var list = document.querySelector('[data-about-gallery]');
    if (!list) return;
    (window.ABOUT_GALLERY || []).forEach(function (image, i) {
      list.appendChild(el('li', { class: 'masonry__item' }, [
        el('img', {
          src: image.src,
          alt: 'Ilustración abstracta de ejemplo ' + (i + 1) + ' (marcador de posición).',
          width: image.width,
          height: image.height,
          loading: 'lazy',
          decoding: 'async'
        })
      ]));
    });
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

  /** Counts 08 → 01 and then goes home (pauses while the menu is open). */
  function startRedirectCountdown(node) {
    if (!node) return;
    var remaining = REDIRECT_SECONDS;
    node.textContent = pad(remaining);
    var timer = window.setInterval(function () {
      if (document.documentElement.classList.contains('menu-open') || document.hidden) return;
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(timer);
        window.location.href = 'index.html';
        return;
      }
      node.textContent = pad(remaining);
    }, 1000);
  }

  /* ------------------------------------------------------------------ boot */

  var RENDERERS = {
    home: renderHome,
    project: renderProject,
    about: renderAboutGallery,
    contact: initContactForm,
    '404': function () { startRedirectCountdown(document.querySelector('[data-countdown]')); }
  };

  function boot() {
    initMenu();
    var render = RENDERERS[document.body.getAttribute('data-page')];
    if (render) render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
