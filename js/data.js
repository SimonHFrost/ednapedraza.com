/*
 * Site data — the single source of truth for projects and image lists.
 *
 * Input to scripts/build.mjs, which writes it into static HTML (the home and
 * service lists, the project pages and the About gallery) so crawlers that
 * don't run JavaScript can read it. The pages no longer load this file.
 * After editing, run: node scripts/build.mjs
 *
 * Project fields
 *   slug        URL key: /proyectos/<slug>
 *   title       Title as written in the home list and on the project page
 *   discipline  Service line: decides which service pages list it; also the project-page kicker
 *   client      Client label shown in the first pill on the project page
 *   bg / pill   Page colour and pill colour of the project page
 *   hero        Hero / background image, or null when the project has none
 *   video       Optional hero video: { src, poster }. Plays muted on a loop in
 *               place of hero on the project page, the home cover (on hover)
 *               and the phone home grid. hero is still used for share images
 *   tone        Type colours over the hero on the home cover (see below)
 *   gallery     Square images, shown in one row under the description
 *   description Array of text runs; runs at odd positions are rendered bold
 *   credits     Credit lines in the right-hand column
 *
 * description and credits may be empty arrays: the project page then omits
 * that block. Photos and copy come from Edna's Framer site.
 *
 * tone: space-separated tokens, measured on the hero where each piece of
 * type falls on the home cover (desktop and tablet). With no token the type
 * is ink with a paper edge and the name is purple.
 *   name-paper  name in paper, ink edge (dark or red ground behind it)
 *   name-ink    name in ink rather than purple, paper edge
 *   role-paper  "Directora creativa…" line in paper, ink edge
 *   menu-paper  menu in paper, ink edge
 *   list-paper  "Índice" and the contents list in paper, ink edge
 */
(function () {
  'use strict';

  var IMG = '/assets/img/';

  function gallery(slug, count) {
    var list = [];
    for (var i = 1; i <= count; i += 1) list.push(IMG + slug + '-g' + i + '.jpg');
    return list;
  }

  window.PROJECTS = [
    {
      slug: 'frutifantastimeow',
      title: 'Fruti-Fantasti Meow',
      discipline: 'Dirección Creativa y Arte',
      client: 'MEOW Magazine para Steve Madden',
      bg: 'rgb(242, 206, 61)',
      pill: 'rgb(250, 20, 250)',
      hero: IMG + 'frutifantastimeow-hero.jpg',
      tone: '',
      gallery: gallery('frutifantastimeow', 4),
      description: [
        'Dirección creativa y de arte para una oda a esos deliciosos pretextos que nos llenan de sabor y vitaminas. Esta ',
        'STORY',
        ' para ',
        'MEOW Magazine',
        ' fusiona ingredientes y recetas frutales con la colección de bolsos y calzado de ',
        'Steve Madden',
        ' para el verano 2025.'
      ],
      credits: [
        'Fotografía: Kon Kau Chuey',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'coca-cola-alina',
      title: 'Coca Cola x Alina Montero',
      discipline: 'Fashion Styling',
      client: 'Coca Cola / Stink',
      bg: 'rgb(189, 169, 235)',
      pill: 'rgb(89, 41, 41)',
      hero: null, // video only
      video: { src: '/assets/video/coca-cola-alina-hero.mp4', poster: IMG + 'coca-cola-alina-poster.jpg' },
      tone: 'name-paper role-paper list-paper',
      gallery: gallery('coca-cola-alina', 3),
      description: [],
      credits: [
        'Fotografía: Kon Kau Chuey',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'fabrica-social',
      title: 'Fábrica Social',
      discipline: 'Dirección Creativa y Moda',
      client: 'Fábrica Social',
      bg: 'rgb(104, 212, 194)',
      pill: 'rgb(34, 54, 61)',
      hero: IMG + 'fabrica-social-hero.jpg',
      tone: 'name-ink menu-paper list-paper',
      gallery: gallery('fabrica-social', 4),
      description: [
        'Desde 2024 he estado colaborando con ',
        'Fábrica Social',
        ' en la realización de sus campañas. Esta realizada para primavera/verano 2025 en el taller de la ceramista ',
        'Adriana Diaz de Cossio',
        ' ha sido de mis favoritas.'
      ],
      credits: [
        'Fotografía: Kon Kau Chuey',
        'Producción: Fábrica Social'
      ]
    },
    {
      slug: 'harpers-mx',
      title: 'Harper’s Bazaar MX',
      discipline: 'Fashion Styling',
      client: 'Harper’s Bazaar MX',
      bg: 'rgb(201, 222, 240)',
      pill: 'rgb(21, 31, 56)',
      hero: IMG + 'harpers-mx-hero.jpg',
      tone: '',
      gallery: gallery('harpers-mx', 4),
      description: [
        'Una historia de ',
        'Harper’s Bazaar México',
        ' para su edición de junio/julio 2026 que celebra el fascinante diseño de uñas como un manifiesto de la creatividad.'
      ],
      credits: [
        'Fotografía: Kon Kau Chuey',
        'Producción: Gio Lozano'
      ]
    },
    {
      slug: 'crocs-meow',
      title: 'Dark Romance',
      discipline: 'Dirección Creativa y Fashion Styling',
      client: 'MEOW Magazine para Crocs',
      bg: 'rgb(232, 60, 60)',
      pill: 'rgb(37, 38, 38)',
      hero: IMG + 'crocs-meow-hero.jpg',
      tone: 'name-paper role-paper menu-paper list-paper',
      gallery: gallery('crocs-meow', 4),
      description: [
        'Nos inspiramos en la nueva campaña de ',
        'Crocs México',
        ', ',
        'Dark Romance',
        ', y en nuestras íconos musicales del rock & roll como Debbie Harris, Joan Jett y Stevie Nicks para dar vida a una versión llena de poder y estilo.'
      ],
      credits: [
        'Fotografía: Noel Higareda',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'tqm-meow',
      title: 'TQM x MEOW',
      discipline: 'Dirección Creativa y Arte',
      client: 'MEOW Magazine para Steve Madden',
      bg: 'rgb(235, 169, 201)',
      pill: 'rgb(51, 71, 46)',
      hero: IMG + 'tqm-meow-hero.jpg',
      tone: 'name-paper role-paper menu-paper list-paper',
      gallery: gallery('tqm-meow', 3),
      description: [
        'Dirección creativa y de arte para una noche de celebración con la comunidad de DJs ',
        'TQM',
        ' como anfitrionas, para ',
        'MEOW Magazine',
        ' en colaboración con ',
        'Steve Madden',
        '.'
      ],
      credits: [
        'Fotografía: Noel Higareda',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'mabel-meow',
      title: 'Mabel Cadena x MEOW',
      discipline: 'Fashion Styling',
      client: 'MEOW Magazine',
      bg: 'rgb(141, 186, 224)',
      pill: 'rgb(69, 31, 31)',
      hero: IMG + 'mabel-meow-hero.jpg',
      tone: 'name-ink list-paper',
      gallery: gallery('mabel-meow', 4),
      description: [
        'Estilismo de Moda para la actriz ',
        'Mabel Cadena',
        ' en entrevista para ',
        'MEOW Magazine',
        '.'
      ],
      credits: [
        'Fotografía: Noel Higareda',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'basicos-de-mexico-2026',
      title: 'Básicos de México 2026',
      discipline: 'Fashion Styling',
      client: 'Básicos de México',
      bg: 'rgb(130, 152, 98)',
      pill: 'rgb(28, 63, 196)',
      hero: IMG + 'basicos-de-mexico-2026-hero.jpg',
      tone: '',
      gallery: gallery('basicos-de-mexico-2026', 11),
      description: [
        '',
        'Básicos de México',
        ' presentó su colección de ropa durante ',
        'Mexico Fashion Week',
        ' y fui invitada a colaborar en el fashion styling. El desfile se inspiró en las subculturas mexicanas, tanto en los acentos de los looks como en su banda sonora.'
      ],
      credits: []
    },
    {
      slug: 'kfc-alina',
      title: 'KFC x Alina Montero',
      discipline: 'Fashion Styling',
      client: 'KFC',
      bg: 'rgb(172, 145, 227)',
      pill: 'rgb(42, 26, 61)',
      hero: IMG + 'kfc-alina-hero.jpg',
      video: { src: '/assets/video/kfc-alina-hero.mp4', poster: IMG + 'kfc-alina-poster.jpg' },
      tone: 'list-paper',
      gallery: gallery('kfc-alina', 3),
      description: [],
      credits: [
        'Fotografía: Kon Kau Chuey',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'meowndalista',
      title: 'Meowndalista',
      discipline: 'Dirección Creativa y Moda',
      client: 'MEOW Magazine para Steve Madden',
      bg: 'rgb(240, 176, 146)',
      pill: 'rgb(35, 64, 58)',
      hero: IMG + 'meowndalista-hero.jpg',
      tone: 'name-paper',
      gallery: gallery('meowndalista', 4),
      description: [
        'La fiebre del mundial llegó a ',
        'MEOW Magazine',
        ' con esta editorial de moda realizada en colaboración con ',
        'Steve Madden',
        '.'
      ],
      credits: [
        'Fotografía: Fernanda Pacheco',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'ben-frank',
      title: 'Ben & Frank',
      discipline: 'Dirección de Arte',
      client: 'Ben & Frank',
      bg: 'rgb(255, 132, 0)',
      pill: 'rgb(17, 194, 35)',
      hero: IMG + 'ben-frank-hero.jpg',
      tone: '',
      gallery: gallery('ben-frank', 5),
      description: [
        'Desde hace aproximadamente 7 años he estado colaborando con ',
        'Ben & Frank',
        ', desarrollando a través de mi estudio creativo ',
        'Estrella Cascabel',
        ' contenido visual para la marca.'
      ],
      credits: [
        'Fotografía: Kon Kau Chuey',
        'Producción: Estrella Cascabel'
      ]
    }
  ];
})();
