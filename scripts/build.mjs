#!/usr/bin/env node
/*
 * Writes the site's generated HTML from js/data.js, so every project is real
 * HTML that search engines and AI crawlers (most of which don't run
 * JavaScript) can read. No dependencies. Run it after editing js/data.js,
 * index.html, about.html or templates/project.html, and commit the result:
 *
 *   node scripts/build.mjs
 *
 * In place, between <!-- build:NAME --> and <!-- /build:NAME --> markers:
 *   index.html   <head> SEO block, background photos, project list
 *   about.html   <head> SEO block, gallery
 * Whole files:
 *   direccion-creativa.html, fashion-styling.html, direccion-de-arte.html
 *                          index.html with the list filtered to one service
 *   proyectos/<slug>.html  one page per project, from templates/project.html
 *   sitemap.xml
 *
 * Share images are assets/img/og/<slug>.jpg (1200×630); a project without one
 * falls back to its hero. To make one:
 *   convert assets/img/<slug>-hero.jpg -resize '1200x630^' -gravity center \
 *     -extent 1200x630 -strip -interlace JPEG -quality 82 assets/img/og/<slug>.jpg
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://ednapedraza.com';
const NAME = 'Edna Pedraza';
const ROLE = 'Directora Creativa y Estilista de Moda';
const EMAIL = 'edna.sapi@gmail.com';
const INSTAGRAM = 'https://www.instagram.com/ednamiau/';

/* ------------------------------------------------------------------ copy */

const HOME = {
  path: '/',
  title: `${NAME} — ${ROLE} en CDMX`,
  description: `${NAME}, ${ROLE} en CDMX. Campañas y editoriales para MEOW Magazine, Harper’s Bazaar México, Steve Madden y Crocs.`
};

const ABOUT = {
  path: '/about',
  title: `Sobre ${NAME} — ${ROLE} en CDMX`,
  description: `${NAME} es Directora Creativa, Estilista de Moda y Directora de Arte en CDMX, Editora Creativa de MEOW Magazine y fundadora del estudio Estrella Cascabel.`,
  image: { src: '/assets/img/og/about.jpg', alt: 'Fotografía de una producción de Edna Pedraza.' }
};

/** Menu services: the home list filtered by discipline, each at /<slug>.
    "Dirección Creativa y Moda" counts as creative direction only; Moda is
    not styling work. */
const SERVICES = [
  {
    slug: 'direccion-creativa',
    name: 'Dirección Creativa',
    match: /Dirección Creativa/i,
    description: `Dirección creativa de ${NAME} en CDMX: campañas y editoriales para MEOW Magazine, Steve Madden, Crocs y Fábrica Social.`
  },
  {
    slug: 'fashion-styling',
    name: 'Fashion Styling',
    match: /Fashion Styling/i,
    description: `Fashion styling de ${NAME} en CDMX: editoriales y campañas para Harper’s Bazaar México, MEOW Magazine, Coca-Cola y KFC.`
  },
  {
    slug: 'direccion-de-arte',
    name: 'Dirección de Arte',
    match: /Arte\b/i,
    description: `Dirección de arte de ${NAME} en CDMX: producciones para MEOW Magazine, Steve Madden, Skechers y Ben & Frank.`
  }
];

/* ------------------------------------------------------------ schema.org */

const PERSON_ID = `${ORIGIN}/#edna`;
const STUDIO_ID = `${ORIGIN}/#estrella-cascabel`;
const ADDRESS = { '@type': 'PostalAddress', addressLocality: 'Ciudad de México', addressCountry: 'MX' };
const AREA = [{ '@type': 'City', name: 'Ciudad de México' }, { '@type': 'Country', name: 'México' }];
const PERSON_REF = { '@type': 'Person', '@id': PERSON_ID, name: NAME, url: `${ORIGIN}/` };

const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: NAME,
  url: `${ORIGIN}/`,
  description: ABOUT.description,
  jobTitle: ['Directora Creativa', 'Estilista de Moda', 'Directora de Arte'],
  knowsAbout: ['Dirección creativa', 'Estilismo de moda', 'Dirección de arte', 'Prop styling', 'Producción'],
  affiliation: [{ '@type': 'Organization', name: 'MEOW Magazine' }, { '@id': STUDIO_ID }],
  email: EMAIL,
  address: ADDRESS,
  sameAs: [INSTAGRAM]
};

const STUDIO = {
  '@type': 'Organization',
  '@id': STUDIO_ID,
  name: 'Estrella Cascabel',
  description: 'Estudio de producción visual',
  founder: { '@id': PERSON_ID }
};

function offer(name, url) {
  return { '@type': 'Offer', itemOffered: { '@type': 'Service', name, ...(url && { url }) } };
}

/* -------------------------------------------------------------- helpers */

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const abs = (src) => ORIGIN + src;
const projectPath = (project) => `/proyectos/${project.slug}`;
const plainText = (runs) => runs.join('').replace(/\s+/g, ' ').trim();

/** Shortens text to a search-result-sized snippet, cutting at a word. */
function clip(text, max = 158) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:]+$/, '')}…`;
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

/** Writes only when the content changed, so a re-run without edits is a no-op. */
function write(file, content) {
  const full = path.join(ROOT, file);
  if (fs.existsSync(full) && fs.readFileSync(full, 'utf8') === content) return;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log(`wrote ${file}`);
}

function indent(lines, prefix) {
  return lines.map((line) => (line ? prefix + line : line)).join('\n');
}

/** Replaces what sits between <!-- build:NAME … --> and <!-- /build:NAME -->,
    indenting the new lines like the closing marker. */
function fill(html, name, lines, file) {
  const re = new RegExp(`(<!-- build:${name}\\b[^>]*-->)[\\s\\S]*?\\n([ \\t]*)(<!-- /build:${name} -->)`, 'g');
  const matches = html.match(re);
  if (!matches || matches.length !== 1) throw new Error(`${file}: expected one <!-- build:${name} --> … <!-- /build:${name} --> block`);
  return html.replace(re, (_, start, pad, end) => `${start}\n${indent(lines, pad)}\n${pad}${end}`);
}

function replaceOnce(html, from, to, file) {
  const count = html.split(from).length - 1;
  if (count !== 1) throw new Error(`${file}: expected "${from}" once, found ${count}`);
  return html.replace(from, () => to);
}

/** Generated pages carry a note instead of the build markers. */
function finishGenerated(html, sources) {
  const note = `<!-- Generated by scripts/build.mjs from ${sources}. Edit those and run the build. -->`;
  return html
    .replace(/^[ \t]*<!-- \/?build:[^>]*-->\n/gm, '')
    .replace(/^<!doctype html>\n/i, (doctype) => `${doctype}${note}\n`);
}

/* ------------------------------------------------------------------ data */

const sandbox = { window: {} };
vm.runInNewContext(read('js/data.js'), sandbox, { filename: 'js/data.js' });
const PROJECTS = sandbox.window.PROJECTS;
const ABOUT_GALLERY = sandbox.window.ABOUT_GALLERY;
if (!Array.isArray(PROJECTS) || !PROJECTS.length) throw new Error('js/data.js: no PROJECTS');

/** The project shown full-screen when a list opens: the first with a photo. */
const coverOf = (projects) => projects.find((project) => project.hero) || projects[0];

function shareImage(project) {
  const og = `/assets/img/og/${project.slug}.jpg`;
  const alt = `${project.title}: ${project.discipline}, por ${NAME}.`;
  if (fs.existsSync(path.join(ROOT, og))) return { src: og, width: 1200, height: 630, alt };
  console.warn(`warning: no ${og}; ${project.slug} shares its hero instead`);
  return { src: project.hero || project.gallery[0], alt };
}

/* ------------------------------------------------------------- <head> */

function jsonLd(data) {
  // "<" escaped so the JSON can never close the <script> element early.
  return JSON.stringify({ '@context': 'https://schema.org', ...data }, null, 2).replace(/</g, '\\u003c').split('\n');
}

function seoHead({ title, description, path: pagePath, image, schema }) {
  const url = ORIGIN + pagePath;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${NAME}">`,
    '<meta property="og:locale" content="es_MX">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${abs(image.src)}">`,
    ...(image.width ? [`<meta property="og:image:width" content="${image.width}">`, `<meta property="og:image:height" content="${image.height}">`] : []),
    `<meta property="og:image:alt" content="${esc(image.alt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<script type="application/ld+json">',
    ...jsonLd(schema),
    '</script>'
  ];
}

/* ------------------------------------------------------------ home lists */

function backgroundLayer(project, index, baseIndex) {
  const base = index === baseIndex;
  const classes = `home-bg__layer${base ? ' is-base' : ''}`;
  if (!project.hero) return `<div class="${classes} home-bg__layer--empty is-empty" data-index="${index}"></div>`;
  const loading = base ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `<div class="${classes}" data-index="${index}"><img src="${esc(project.hero)}" alt="" width="1600" height="1000" decoding="async" ${loading}></div>`;
}

function row(project, index) {
  return `<li><a class="work-row" href="${projectPath(project)}" data-index="${index}">` +
    '<span class="work-row__band" aria-hidden="true"></span>' +
    `<span class="work-row__title">${esc(project.title)}</span>` +
    `<span class="visually-hidden"> — ${esc(project.discipline)}</span></a></li>`;
}

function card(project) {
  const media = project.hero
    ? `<span class="work-card__media"><img src="${esc(project.hero)}" alt="" width="1600" height="1000" loading="lazy" decoding="async"></span>`
    : '<span class="work-card__media is-empty"></span>';
  return `<li class="work-card"><a class="work-card__link" href="${projectPath(project)}">` +
    `<span class="work-card__title">${esc(project.title)}</span>${media}` +
    `<span class="visually-hidden"> — ${esc(project.discipline)}</span></a></li>`;
}

function fillHomeLists(html, projects, file) {
  const baseIndex = projects.indexOf(coverOf(projects));
  html = fill(html, 'home-bg', projects.map((project, i) => backgroundLayer(project, i, baseIndex)), file);
  html = fill(html, 'work-list', projects.map(row), file);
  return fill(html, 'work-grid', projects.map(card), file);
}

/* -------------------------------------------------------------- project */

function projectArticle(project, index) {
  const tags = '<div class="project__tags ui-label">' +
    `<span class="tag tag--pill"><span class="visually-hidden">Cliente: </span>${esc(project.client)}</span>` +
    `<span class="tag tag--pill"><span class="visually-hidden">Servicio: </span>${esc(project.discipline)}</span></div>`;

  const hero = project.hero
    ? `<figure class="project__hero"><img src="${esc(project.hero)}" alt="${esc(project.title)}: imagen principal." width="1600" height="1000" decoding="async" fetchpriority="high"></figure>`
    : '<figure class="project__hero is-empty"><figcaption class="visually-hidden">Este proyecto no tiene imagen principal.</figcaption></figure>';

  // description: runs at odd positions are bold. Body is left out when empty.
  const body = [];
  if (project.description.length) {
    const lede = project.description.map((run, i) => (i % 2 ? `<strong>${esc(run)}</strong>` : esc(run))).join('');
    body.push(`  <p class="project__lede">${lede}</p>`);
  }
  if (project.credits.length) {
    body.push('  <ul class="project__credits" aria-label="Créditos">',
      ...project.credits.map((line) => `    <li>${esc(line)}</li>`),
      '  </ul>');
  }

  const total = project.gallery.length;
  const gallery = [
    `<ul class="project__gallery" style="--cols: ${total}" aria-label="Galería">`,
    ...project.gallery.map((src, i) => `  <li><img src="${esc(src)}" alt="${esc(project.title)}: foto ${i + 1} de ${total}." width="800" height="800" loading="lazy" decoding="async"></li>`),
    '</ul>'
  ];

  const pager = [];
  if (index > 0) pager.push(pagerItem(PROJECTS[index - 1], 'prev'));
  if (index < PROJECTS.length - 1) pager.push(pagerItem(PROJECTS[index + 1], 'next'));

  return [
    '<article class="project" aria-labelledby="project-title">',
    `  ${tags}`,
    `  <h1 class="project__title" id="project-title">${esc(project.title)}</h1>`,
    '  <hr class="project__rule">',
    `  ${hero}`,
    ...(body.length ? ['  <div class="project__body">', ...body.map((line) => `  ${line}`), '  </div>'] : []),
    ...gallery.map((line) => `  ${line}`),
    '</article>',
    '<footer class="project-footer">',
    '  <nav class="pager" aria-label="Proyecto anterior y siguiente">',
    '    <ul class="pager__list">',
    ...pager.map((line) => `      ${line}`),
    '    </ul>',
    '  </nav>',
    '</footer>'
  ];
}

function pagerItem(project, direction) {
  return `<li class="pager__item pager__item--${direction}"><a class="pager__link" href="${projectPath(project)}" rel="${direction}">` +
    `<span class="pager__label ui-label"><span class="pager__dot" aria-hidden="true"></span>${direction === 'prev' ? 'Previous' : 'Next'}</span>` +
    `<span class="pager__title">${esc(project.title)}</span></a></li>`;
}

function projectPage(template, project, index) {
  const description = plainText(project.description);
  const file = `proyectos/${project.slug}.html`;
  const head = seoHead({
    title: `${project.title} (${project.discipline}) — ${NAME}`,
    description: clip(description) || `${project.title}: ${project.discipline.toLowerCase()} de ${NAME}, ${ROLE} en CDMX.`,
    path: projectPath(project),
    image: shareImage(project),
    schema: {
      '@type': 'CreativeWork',
      name: project.title,
      url: ORIGIN + projectPath(project),
      ...(description && { description }),
      genre: project.discipline,
      image: [project.hero, ...project.gallery].filter(Boolean).map(abs),
      creator: PERSON_REF,
      inLanguage: 'es'
    }
  });
  const blocks = { seo: head, project: projectArticle(project, index) };
  const inline = { bg: project.bg, pill: project.pill };
  const html = template
    .replace(/^([ \t]*)\{\{(\w+)\}\}$/gm, (_, pad, key) => {
      if (!blocks[key]) throw new Error(`templates/project.html: unknown block {{${key}}}`);
      return indent(blocks[key], pad);
    })
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in inline)) throw new Error(`templates/project.html: unknown value {{${key}}}`);
      return esc(inline[key]);
    });
  return [file, finishGenerated(html, 'templates/project.html and js/data.js')];
}

/* ------------------------------------------------------------------ build */

const homeImage = shareImage(coverOf(PROJECTS));

let home = read('index.html');
home = fill(home, 'seo', seoHead({
  ...HOME,
  image: homeImage,
  schema: {
    '@graph': [
      { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: NAME, inLanguage: 'es', publisher: { '@id': PERSON_ID } },
      PERSON,
      STUDIO,
      {
        '@type': 'ProfessionalService',
        '@id': `${ORIGIN}/#servicios`,
        name: NAME,
        url: `${ORIGIN}/`,
        description: HOME.description,
        image: abs(homeImage.src),
        email: EMAIL,
        address: ADDRESS,
        areaServed: AREA,
        founder: { '@id': PERSON_ID },
        sameAs: [INSTAGRAM],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Servicios',
          itemListElement: [
            ...SERVICES.map((service) => offer(service.name, `${ORIGIN}/${service.slug}`)),
            offer('Prop Styling'),
            offer('Producción')
          ]
        }
      }
    ]
  }
}), 'index.html');
home = fillHomeLists(home, PROJECTS, 'index.html');
write('index.html', home);

let about = read('about.html');
about = fill(about, 'seo', seoHead({
  ...ABOUT,
  image: { ...ABOUT.image, width: 1200, height: 630 },
  schema: {
    '@graph': [
      { '@type': 'ProfilePage', url: ORIGIN + ABOUT.path, name: ABOUT.title, inLanguage: 'es', mainEntity: { '@id': PERSON_ID } },
      PERSON,
      STUDIO
    ]
  }
}), 'about.html');
about = fill(about, 'about-gallery', ABOUT_GALLERY.map((image, i) =>
  `<li class="masonry__item"><img src="${esc(image.src)}" alt="Trabajo de ${NAME}, foto ${i + 1}." width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></li>`
), 'about.html');
write('about.html', about);

for (const service of SERVICES) {
  const file = `${service.slug}.html`;
  const projects = PROJECTS.filter((project) => service.match.test(project.discipline));
  let html = fill(home, 'seo', seoHead({
    title: `${service.name} en CDMX — ${NAME}`,
    description: service.description,
    path: `/${service.slug}`,
    image: shareImage(coverOf(projects)),
    schema: {
      '@type': 'Service',
      name: service.name,
      serviceType: service.name,
      url: `${ORIGIN}/${service.slug}`,
      description: service.description,
      provider: PERSON_REF,
      areaServed: AREA
    }
  }), file);
  html = fillHomeLists(html, projects, file);
  // The page heading names the service; the brand stays as on the home page.
  html = replaceOnce(html, '<h1 class="brand__name">Edna Pedraza</h1>', '<p class="brand__name">Edna Pedraza</p>', file);
  html = replaceOnce(html, '<h2 class="visually-hidden">Proyectos</h2>', `<h1 class="visually-hidden">${esc(service.name)}: proyectos de ${NAME}</h1>`, file);
  html = replaceOnce(html, `href="/${service.slug}">`, `href="/${service.slug}" aria-current="page">`, file);
  write(file, finishGenerated(html, 'index.html and js/data.js'));
}

const template = read('templates/project.html');
const projectFiles = new Set();
PROJECTS.forEach((project, index) => {
  const [file, html] = projectPage(template, project, index);
  projectFiles.add(path.basename(file));
  write(file, html);
});
for (const name of fs.readdirSync(path.join(ROOT, 'proyectos'))) {
  if (name.endsWith('.html') && !projectFiles.has(name)) {
    fs.unlinkSync(path.join(ROOT, 'proyectos', name));
    console.log(`removed proyectos/${name}`);
  }
}

const urls = ['/', ABOUT.path, ...SERVICES.map((service) => `/${service.slug}`), ...PROJECTS.map(projectPath)];
write('sitemap.xml', [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${ORIGIN}${url}</loc></url>`),
  '</urlset>',
  ''
].join('\n'));
