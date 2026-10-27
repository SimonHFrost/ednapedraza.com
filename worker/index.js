/*
 * The site's Worker. Files in the repo are served as static assets without
 * running this script (see wrangler.jsonc); it sees /api/* and some requests
 * for paths that match no file. It handles one: POST /api/contacto, the home
 * contact form, which it emails to Edna through Cloudflare Email Routing.
 * Every other path goes back to the assets, which answer with 404.html.
 *
 * The CONTACT_EMAIL binding can only send to the verified address set in
 * wrangler.jsonc, so the form can't be used to email anyone else.
 */

const FORM_PATH = '/api/contacto';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // same check as js/main.js
const MAX_BODY_BYTES = 32 * 1024;
const MAX_LENGTH = { nombre: 100, correo: 254, mensaje: 5000 };
const MIN_MESSAGE = 10;

const TEXT = {
  sent: 'Tu mensaje se envió. Te respondo pronto.',
  invalid: 'Revisa el formulario: falta tu nombre, un correo válido o un mensaje de al menos 10 caracteres.',
  tooMany: 'Has enviado varios mensajes seguidos. Espera un minuto y vuelve a intentarlo.',
  failed: 'No se pudo enviar el mensaje. Escríbeme directamente a edna.sapi@gmail.com.'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== FORM_PATH) return env.ASSETS.fetch(request);
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
    }
    return handleContact(request, env, url);
  }
};

async function handleContact(request, env, url) {
  const reply = request.headers.get('Accept')?.includes('application/json') ? replyJson : replyPage;

  // Browsers send Origin on every POST; refuse forms posted from other sites.
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return reply(403, false, TEXT.failed);

  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
    return reply(413, false, TEXT.invalid);
  }

  if (env.CONTACT_RATE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: ip });
    if (!success) return reply(429, false, TEXT.tooMany);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(400, false, TEXT.invalid);
  }

  // Hidden field that people never see (index.html); bots fill it in. Answer
  // as if it worked so they don't retry.
  if (field(form, 'sitio_web')) return reply(200, true, TEXT.sent);

  const nombre = oneLine(field(form, 'nombre'));
  const correo = field(form, 'correo');
  const mensaje = field(form, 'mensaje');
  const valid = nombre && nombre.length <= MAX_LENGTH.nombre &&
    correo.length <= MAX_LENGTH.correo && EMAIL_PATTERN.test(correo) &&
    mensaje.length >= MIN_MESSAGE && mensaje.length <= MAX_LENGTH.mensaje;
  if (!valid) return reply(400, false, TEXT.invalid);

  try {
    await env.CONTACT_EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: 'Formulario ednapedraza.com' },
      replyTo: { email: correo, name: nombre },
      subject: `${env.CONTACT_SUBJECT_PREFIX || ''}Mensaje de ${nombre} desde ednapedraza.com`,
      text: [
        `Nombre: ${nombre}`,
        `Correo: ${correo}`,
        '',
        mensaje,
        '',
        '--',
        `Enviado desde el formulario de contacto de ${url.host}.`,
        `Responde a este correo para contestar a ${nombre}.`
      ].join('\n')
    });
  } catch (error) {
    // Logged without the visitor's details. Most likely cause: Email Routing
    // isn't on for the domain yet, or the destination isn't verified.
    console.error('contact form: send failed', error.code || '', error.message);
    return reply(502, false, TEXT.failed);
  }
  return reply(200, true, TEXT.sent);
}

function field(form, name) {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

/** Collapses line breaks and runs of spaces (the name goes in the subject). */
function oneLine(value) {
  return value.replace(/\s+/g, ' ');
}

/** For js/main.js, which posts with fetch and shows the message itself. */
function replyJson(status, ok, message) {
  return Response.json({ ok, message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** For browsers without JavaScript, where the form posts as a normal page. */
function replyPage(status, ok, message) {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${ok ? 'Mensaje enviado' : 'Mensaje no enviado'} — Edna Pedraza</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <main class="contact" style="min-height: 100vh; display: block;">
    <h1 class="contact__title">${ok ? '¡Gracias!' : 'Ups'}</h1>
    <p class="contact-form__status">${message}</p>
    <p class="contact__links"><a href="/#contacto">Volver al sitio</a></p>
  </main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
