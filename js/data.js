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
 *   title       Title as written in the home list (pages upper-case it in CSS)
 *   discipline  Service line: decides which service pages list it; also the project-page pill
 *   client      Client label shown in the first pill on the project page
 *   bg / pill   Page colour and pill colour of the project page
 *   hero        Hero / background image, or null when the project has none
 *   gallery     Square images, shown in one row under the description
 *   description Array of text runs; runs at odd positions are rendered bold
 *   credits     Credit lines in the right-hand column
 *
 * description and credits may be empty arrays: the project page then omits
 * that block. Photos and copy come from Edna's Framer site.
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
      title: 'FRUTI-FANTASTI MEOW',
      discipline: 'Dirección Creativa y Arte',
      client: 'MEOW MAGAZINE PARA STEVE MADDEN',
      bg: 'rgb(242, 206, 61)',
      pill: 'rgb(250, 20, 250)',
      hero: IMG + 'frutifantastimeow-hero.jpg',
      gallery: gallery('frutifantastimeow', 4),
      description: [
        'Dirección creativa y de arte para una oda a esos deliciosos pretextos que nos llenan de sabor y vitaminas. Esta ',
        'STORY',
        ' para ',
        'MEOW Magazine',
        ' fusiona ingredientes y recetas frutales con la colección de bolsos y calzado de ',
        'Steve Madden para el verano 2025.'
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
      client: 'COCA COLA / STINK',
      bg: 'rgb(189, 169, 235)',
      pill: 'rgb(89, 41, 41)',
      hero: null, // the live page shows an empty media frame here
      gallery: gallery('coca-cola-alina', 3),
      description: [],
      credits: [
        'Fotografía Kon Kau Chuey',
        'Producción MEOW Magazine'
      ]
    },
    {
      slug: 'fabrica-social',
      title: 'FÁBRICA SOCIAL',
      discipline: 'Dirección Creativa y Moda',
      client: 'FÁBRICA SOCIAL',
      bg: 'rgb(104, 212, 194)',
      pill: 'rgb(34, 54, 61)',
      hero: IMG + 'fabrica-social-hero.jpg',
      gallery: gallery('fabrica-social', 4),
      description: [
        'Desde 2024 he estado colaborando con ',
        'Fábrica Social',
        ' en la realización de sus campañas. Esta realizada para primavera/verano 2025 en el taller de la ceramista ',
        'Adriana Diaz de Cossio',
        ' ha sido de mis favoritas.'
      ],
      credits: [
        'Fotografía Kon Kau Chuey',
        'Producción Fábrica Social'
      ]
    },
    {
      slug: 'harpers-mx',
      title: 'Harper’s Bazaar MX',
      discipline: 'Fashion Styling',
      client: 'HARPER’S BAZAAR MX',
      bg: 'rgb(201, 222, 240)',
      pill: 'rgb(21, 31, 56)',
      hero: IMG + 'harpers-mx-hero.jpg',
      gallery: gallery('harpers-mx', 4),
      description: [
        'Una historia de ',
        'Harper’s Bazaar México',
        ' para su edición de junio/julio 2026 que celebra el fascinante diseño de uñas como un manifiesto de la creatividad.'
      ],
      credits: [
        'Fotografía Kon Kau Chuey',
        'Producción Gio Lozano'
      ]
    },
    {
      slug: 'crocs-meow',
      title: 'Dark Romance',
      discipline: 'Dirección Creativa y Fashion Styling',
      client: 'MEOW MAGAZINE PARA CROCS',
      bg: 'rgb(232, 60, 60)',
      pill: 'rgb(37, 38, 38)',
      hero: IMG + 'crocs-meow-hero.jpg',
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
      client: 'MEOW MAGAZINE PARA STEVE MADDEN',
      bg: 'rgb(235, 169, 201)',
      pill: 'rgb(51, 71, 46)',
      hero: IMG + 'tqm-meow-hero.jpg',
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
      client: 'MEOW MAGAZINE',
      bg: 'rgb(141, 186, 224)',
      pill: 'rgb(69, 31, 31)',
      hero: IMG + 'mabel-meow-hero.jpg',
      gallery: gallery('mabel-meow', 4),
      description: [
        'Estilismo de Moda para la actriz ',
        'Mabel Cadena',
        ' en entrevista para ',
        'MEOW Magazine.'
      ],
      credits: [
        'Fotografía: Noel Higareda',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'skechers-meow',
      title: 'Happy Feet',
      discipline: 'Dirección de Arte',
      client: 'MEOW MAGAZINE PARA SKECHERS',
      bg: 'rgb(125, 199, 146)',
      pill: 'rgb(26, 58, 82)',
      hero: IMG + 'skechers-meow-hero.jpg',
      gallery: gallery('skechers-meow', 4),
      description: [
        'Dirección creativa y de arte para ',
        'Skechers',
        ' por ',
        'MEOW Magazine'
      ],
      credits: [
        'Fotografía: Karla Ximena',
        'Producción: MEOW Magazine'
      ]
    },
    {
      slug: 'kfc-alina',
      title: 'KFC x Alina Montero',
      discipline: 'Fashion Styling',
      client: 'KFC',
      bg: 'rgb(172, 145, 227)',
      pill: 'rgb(42, 26, 61)',
      hero: IMG + 'kfc-alina-hero.jpg',
      gallery: gallery('kfc-alina', 3),
      description: [],
      credits: [
        'Fotografía Kon Kau Chuey',
        'Producción MEOW Magazine'
      ]
    },
    {
      slug: 'meowndalista',
      title: 'MEOWNDALISTA',
      discipline: 'Dirección Creativa y Moda',
      client: 'MEOW MAGAZINE PARA STEVE MADDEN',
      bg: 'rgb(240, 176, 146)',
      pill: 'rgb(35, 64, 58)',
      hero: IMG + 'meowndalista-hero.jpg',
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
      client: 'BEN & FRANK',
      bg: 'rgb(255, 132, 0)',
      pill: 'rgb(17, 194, 35)',
      hero: IMG + 'ben-frank-hero.jpg',
      gallery: gallery('ben-frank', 5),
      description: [
        'Desde hace aproximadamente 7 años he estado colaborando con ',
        'Ben & Frank',
        ', desarrollando a través de mi estudio creativo ',
        'Estrella Cascabel',
        ' contenido visual para la marca'
      ],
      credits: [
        'Fotografía Kon Kau Chuey',
        'Producción Estrella Cascabel'
      ]
    }
  ];

  /* About page masonry: [file, width, height] — intrinsic sizes keep the
     layout stable while images load. */
  window.ABOUT_GALLERY = [
    ['about-01.jpg', 839, 1200], ['about-02.jpg', 800, 1200], ['about-03.jpg', 805, 1200],
    ['about-04.jpg', 806, 1200], ['about-05.jpg', 800, 1200], ['about-06.jpg', 800, 1200],
    ['about-07.jpg', 800, 1200], ['about-08.jpg', 900, 1200], ['about-09.jpg', 900, 1200],
    ['about-10.jpg', 801, 1200], ['about-11.jpg', 927, 1200], ['about-12.jpg', 900, 1200],
    ['about-13.jpg', 800, 1200], ['about-14.jpg', 805, 1200], ['about-15.jpg', 1200, 800],
    ['about-16.jpg', 1200, 799], ['about-17.jpg', 800, 1200], ['about-18.jpg', 961, 1200],
    ['about-19.jpg', 900, 1200], ['about-20.jpg', 1200, 801]
  ].map(function (row) {
    return { src: IMG + row[0], width: row[1], height: row[2] };
  });
})();
