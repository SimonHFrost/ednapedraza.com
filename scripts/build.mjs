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
 *                          about.html with that service's intro (SERVICES
 *                          below) and its projects' photos
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

/** Menu services, each an About-style page at /<slug>: an intro, then the
    photos of the projects whose discipline matches. "Dirección Creativa y
    Moda" counts as creative direction only; Moda is not styling work.

    intro: four paragraphs of HTML (<strong> for names). The first is the
    standfirst; the projects are listed after the last one.
    DRAFT COPY: written from Edna's bio and project texts, waiting for her
    approval. portrait: the picture set beside the intro (left out of the
    photos below it). */
const SERVICES = [
  {
    slug: 'direccion-creativa',
    name: 'Dirección Creativa',
    match: /Dirección Creativa/i,
    description: `Dirección creativa de ${NAME} en CDMX: campañas y editoriales para MEOW Magazine, Steve Madden, Crocs y Fábrica Social.`,
    portrait: '/assets/img/fabrica-social-g1.jpg',
    intro: [
      'Como <strong>Directora Creativa</strong>, Edna construye cada proyecto desde la idea: el concepto, la historia y el universo visual que una marca o una revista quiere contar.',
      'Su punto de partida son los colores, los textiles y el arte hecho en México. Desde ahí convierte cualquier referencia, del rock &amp; roll a la fiebre del mundial, en campañas y editoriales con una voz propia.',
      'Ha dirigido historias para <strong>MEOW Magazine</strong> en colaboración con <strong>Steve Madden</strong> y <strong>Crocs México</strong>, y desde 2024 colabora con <strong>Fábrica Social</strong> en la realización de sus campañas.',
      'Cuida cada etapa, de la primera idea al último encuadre, para que la imagen final cuente una sola historia.'
    ]
  },
  {
    slug: 'fashion-styling',
    name: 'Fashion Styling',
    match: /Fashion Styling/i,
    description: `Fashion styling de ${NAME} en CDMX: editoriales y campañas para Harper’s Bazaar México, MEOW Magazine, Coca-Cola y KFC.`,
    portrait: '/assets/img/harpers-mx-g1.jpg',
    intro: [
      'Como <strong>Estilista de Moda</strong>, Edna elige cada prenda, textura y accesorio para que la ropa diga lo que la imagen necesita contar.',
      'Para ella la indumentaria es una herramienta de exploración personal y de identidad colectiva, y su estilismo juega con la tensión entre tradición y contemporaneidad.',
      'Ha hecho el estilismo de editoriales para <strong>Harper’s Bazaar México</strong> y <strong>MEOW Magazine</strong>, de la actriz <strong>Mabel Cadena</strong> y de comerciales para <strong>Coca-Cola</strong> y <strong>KFC</strong> con Alina Montero.',
      'Trabaja igual de cerca con talento, fotografía y producción, en sets editoriales, campañas y comerciales.'
    ]
  },
  {
    slug: 'direccion-de-arte',
    name: 'Dirección de Arte',
    match: /Arte\b/i,
    description: `Dirección de arte de ${NAME} en CDMX: producciones para MEOW Magazine, Steve Madden, Skechers y Ben & Frank.`,
    portrait: '/assets/img/frutifantastimeow-g1.jpg',
    intro: [
      'Como <strong>Directora de Arte</strong>, Edna da forma a lo que rodea a cada imagen: el set, los objetos, el color y la composición.',
      'Cada producción es un pequeño mundo: frutas y recetas para el verano de <strong>Steve Madden</strong>, una noche de fiesta con las DJs de <strong>TQM</strong> o los pasos felices de <strong>Skechers</strong>, todo para <strong>MEOW Magazine</strong>.',
      'Desde hace unos siete años desarrolla con su estudio creativo <strong>Estrella Cascabel</strong> el contenido visual de <strong>Ben &amp; Frank</strong>.',
      'Los colores, los textiles y el arte hecho en México son su mayor referente, en cada set y en cada detalle.'
    ]
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

/** tone (js/data.js) picks the cover type colours that read on this photo. */
function backgroundLayer(project, index, baseIndex) {
  const base = index === baseIndex;
  const classes = `home-bg__layer${base ? ' is-base' : ''}`;
  const tone = project.tone ? ` data-tone="${esc(project.tone)}"` : '';
  if (!project.hero) return `<div class="${classes} home-bg__layer--empty is-empty" data-index="${index}"${tone}></div>`;
  const loading = base ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `<div class="${classes}" data-index="${index}"${tone}><img src="${esc(project.hero)}" alt="" width="1600" height="1000" decoding="async" ${loading}></div>`;
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

  // A hero video plays silently on a loop, like a moving photo. Where
  // autoplay is blocked (e.g. low-power mode) the poster frame shows.
  const hero = project.video
    ? `<figure class="project__hero project__hero--video"><video src="${esc(project.video.src)}" poster="${esc(project.video.poster)}" width="1600" height="960" autoplay muted loop playsinline preload="metadata" aria-label="${esc(project.title)}: video principal."></video></figure>`
    : project.hero
    ? `<figure class="project__hero"><img src="${esc(project.hero)}" alt="${esc(project.title)}: imagen principal." width="1600" height="1000" decoding="async" fetchpriority="high"></figure>`
    : '<figure class="project__hero is-empty"><figcaption class="visually-hidden">Este proyecto no tiene imagen principal.</figcaption></figure>';

  // description: runs at odd positions are bold. Body is left out when empty.
  const body = [];
  if (project.description.length) {
    const lede = project.description.map((run, i) => (i % 2 ? `<strong>${esc(run)}</strong>` : esc(run))).join('');
    body.push(`  <p class="project__lede">${lede}</p>`);
  }
  if (project.credits.length) {
    body.push('  <h2 class="project__credits-title" id="project-credits">Créditos</h2>',
      '  <ul class="project__credits" aria-labelledby="project-credits">',
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
    `<span class="pager__label ui-label"><span class="pager__dot" aria-hidden="true"></span>${direction === 'prev' ? 'Historia anterior' : 'Siguiente historia'}</span>` +
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

/* ------------------------------------------------------- service pages */

/** Width and height of a JPEG, read from its SOF marker. */
function jpegSize(src) {
  const buf = fs.readFileSync(path.join(ROOT, src));
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    const length = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + length;
  }
  throw new Error(`${src}: no JPEG size found`);
}

function servicePhotos(service, projects) {
  const photos = [];
  for (const project of projects) {
    const srcs = [project.hero, ...project.gallery].filter(Boolean);
    srcs.forEach((src, i) => {
      if (src !== service.portrait) photos.push({ src, project, n: i + 1, total: srcs.length });
    });
  }
  return photos;
}

/** "a, b y c" */
function listEs(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function serviceIntro(service, projects) {
  const { width, height } = jpegSize(service.portrait);
  const links = projects.map((project) => `<a href="${projectPath(project)}">${esc(project.title)}</a>`);
  return [
    `<h1 class="service__title" id="service-title">${esc(service.name)}</h1>`,
    `<section class="about__bio" aria-labelledby="service-title">`,
    `  <img class="about__portrait" src="${esc(service.portrait)}" width="${width}" height="${height}" decoding="async" alt="">`,
    ...service.intro.map((html) => `  <p>${html}</p>`),
    `  <p class="service__projects">Proyectos: ${listEs(links)}.</p>`,
    '</section>'
  ];
}

const aboutBio = /^([ \t]*)<section class="about__bio"[\s\S]*?<\/section>/m;

for (const service of SERVICES) {
  const file = `${service.slug}.html`;
  const projects = PROJECTS.filter((project) => service.match.test(project.discipline));
  let html = fill(about, 'seo', seoHead({
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
  html = replaceOnce(html, '<body class="page-about" data-page="about">', '<body class="page-about page-service" data-page="service">', file);
  // The page heading names the service; the brand stays as on About.
  html = replaceOnce(html, '<h1 class="brand__name">Edna Pedraza</h1>', '<p class="brand__name">Edna Pedraza</p>', file);
  html = replaceOnce(html, 'href="/about" aria-current="page">', 'href="/about">', file);
  html = replaceOnce(html, `href="/${service.slug}">`, `href="/${service.slug}" aria-current="page">`, file);
  if (!aboutBio.test(html)) throw new Error(`${file}: about.html has no <section class="about__bio">`);
  html = html.replace(aboutBio, (_, pad) => indent(serviceIntro(service, projects), pad));
  html = fill(html, 'about-gallery', servicePhotos(service, projects).map(({ src, project, n, total }) => {
    const { width, height } = jpegSize(src);
    return `<li class="masonry__item"><a href="${projectPath(project)}"><img src="${esc(src)}" alt="${esc(project.title)}, foto ${n} de ${total}." width="${width}" height="${height}" loading="lazy" decoding="async"></a></li>`;
  }), file);
  write(file, finishGenerated(html, 'about.html, js/data.js and the SERVICES list in scripts/build.mjs'));
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
