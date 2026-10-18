/*
 * Site data — the single source of truth for projects and image lists.
 *
 * Classic script (not an ES module, no fetch) so every page also works when
 * opened straight from disk (file://).
 *
 * Project fields
 *   slug        URL key: project.html?slug=<slug>
 *   title       Title as written in the home list (pages upper-case it in CSS)
 *   discipline  Service line shown on the right of the home row / in a pill
 *   client      Client label shown in the first pill on the project page
 *   bg / pill   Page colour and pill colour of the project page
 *   hero        Hero / background image, or null when the project has none
 *   gallery     Square images, shown in one row under the description
 *   description Array of text runs; runs at odd positions are rendered bold
 *   credits     Credit lines in the right-hand column
 *
 * description and credits may be empty arrays: the project page then omits
 * that block. Images are still placeholder illustrations; swap in the real
 * photographs here.
 */
(function () {
  'use strict';

  var IMG = 'assets/img/';

  function gallery(slug, count) {
    var list = [];
    for (var i = 1; i <= count; i += 1) list.push(IMG + slug + '-g' + i + '.svg');
    return list;
  }

  window.PROJECTS = [
    {
      slug: 'frutifantastimeow',
      title: 'FRUTI-FANTASTI MEOW',
      discipline: 'Dirección Creativa y Arte',
      client: 'MEOW MAGAZINE PARA STEVE MADDEN',
      bg: 'rgb(242, 206, 61)',
      pill: 'rgb(250, 20, 250)',
      hero: IMG + 'frutifantastimeow-hero.svg',
      gallery: gallery('frutifantastimeow', 4),
      description: [],
      credits: []
    },
    {
      slug: 'coca-cola-alina',
      title: 'Coca Cola x Alina Montero',
      discipline: 'Fashion Styling',
      client: 'COCA COLA / STINK',
      bg: 'rgb(189, 169, 235)',
      pill: 'rgb(89, 41, 41)',
      hero: null, // the live page shows an empty media frame here
      gallery: gallery('coca-cola-alina', 3),
      description: [],
      credits: []
    },
    {
      slug: 'fabrica-social',
      title: 'FÁBRICA SOCIAL',
      discipline: 'Dirección Creativa y Moda',
      client: 'FÁBRICA SOCIAL',
      bg: 'rgb(104, 212, 194)',
      pill: 'rgb(34, 54, 61)',
      hero: IMG + 'fabrica-social-hero.svg',
      gallery: gallery('fabrica-social', 4),
      description: [],
      credits: []
    },
    {
      slug: 'harpers-mx',
      title: "Harper's Bazaar MX",
      discipline: 'Fashion Styling',
      client: "HARPER'S BAZAAR MX",
      bg: 'rgb(201, 222, 240)',
      pill: 'rgb(21, 31, 56)',
      hero: IMG + 'harpers-mx-hero.svg',
      gallery: gallery('harpers-mx', 4),
      description: [],
      credits: []
    },
    {
      slug: 'crocs-meow',
      title: 'Dark Romance',
      discipline: 'Dirección Creativa y Fashion Styling',
      client: 'MEOW MAGAZINE PARA CROCS',
      bg: 'rgb(232, 60, 60)',
      pill: 'rgb(37, 38, 38)',
      hero: IMG + 'crocs-meow-hero.svg',
      gallery: gallery('crocs-meow', 4),
      description: [],
      credits: []
    },
    {
      slug: 'tqm-meow',
      title: 'TQM x MEOW',
      discipline: 'Dirección Creativa y Arte',
      client: 'MEOW MAGAZINE PARA STEVE MADDEN',
      bg: 'rgb(235, 169, 201)',
      pill: 'rgb(51, 71, 46)',
      hero: IMG + 'tqm-meow-hero.svg',
      gallery: gallery('tqm-meow', 3),
      description: [],
      credits: []
    },
    {
      slug: 'mabel-meow',
      title: 'Mabel Cadena x MEOW',
      discipline: 'Fashion Styling',
      client: 'MEOW MAGAZINE',
      bg: 'rgb(141, 186, 224)',
      pill: 'rgb(69, 31, 31)',
      hero: IMG + 'mabel-meow-hero.svg',
      gallery: gallery('mabel-meow', 4),
      description: [],
      credits: []
    },
    {
      slug: 'skechers-meow',
      title: 'Happy Feet',
      discipline: 'Dirección de Arte',
      client: 'MEOW MAGAZINE PARA SKECHERS',
      bg: 'rgb(125, 199, 146)',
      pill: 'rgb(26, 58, 82)',
      hero: IMG + 'skechers-meow-hero.svg',
      gallery: gallery('skechers-meow', 4),
      description: [],
      credits: []
    },
    {
      slug: 'kfc-alina',
      title: 'KFC x Alina Montero',
      discipline: 'Fashion Styling',
      client: 'KFC',
      bg: 'rgb(172, 145, 227)',
      pill: 'rgb(42, 26, 61)',
      hero: IMG + 'kfc-alina-hero.svg',
      gallery: gallery('kfc-alina', 3),
      description: [],
      credits: []
    },
    {
      slug: 'meowndalista',
      title: 'MEOWNDALISTA',
      discipline: 'Dirección Creativa y Moda',
      client: 'MEOW MAGAZINE PARA STEVE MADDEN',
      bg: 'rgb(240, 176, 146)',
      pill: 'rgb(35, 64, 58)',
      hero: IMG + 'meowndalista-hero.svg',
      gallery: gallery('meowndalista', 4),
      description: [],
      credits: []
    },
    {
      slug: 'ben-frank',
      title: 'Ben & Frank',
      discipline: 'Dirección de Arte',
      client: 'BEN & FRANK',
      bg: 'rgb(255, 132, 0)',
      pill: 'rgb(17, 194, 35)',
      hero: IMG + 'ben-frank-hero.svg',
      gallery: gallery('ben-frank', 5),
      description: [],
      credits: []
    }
  ];

  /* About page masonry: [file, width, height] — intrinsic sizes keep the
     layout stable while images load. */
  window.ABOUT_GALLERY = [
    ['about-01.svg', 600, 859], ['about-02.svg', 600, 902], ['about-03.svg', 600, 895],
    ['about-04.svg', 600, 895], ['about-05.svg', 600, 902], ['about-06.svg', 600, 902],
    ['about-07.svg', 600, 902], ['about-08.svg', 600, 802], ['about-09.svg', 600, 802],
    ['about-10.svg', 600, 900], ['about-11.svg', 600, 779], ['about-12.svg', 600, 802],
    ['about-13.svg', 600, 900], ['about-14.svg', 600, 895], ['about-15.svg', 600, 401],
    ['about-16.svg', 600, 401], ['about-17.svg', 600, 902], ['about-18.svg', 600, 751],
    ['about-19.svg', 600, 802], ['about-20.svg', 600, 401]
  ].map(function (row) {
    return { src: IMG + row[0], width: row[1], height: row[2] };
  });
})();
