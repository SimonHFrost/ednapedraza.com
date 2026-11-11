/*
 * The site's Worker. Files in the repo are served as static assets without
 * running this script (see wrangler.jsonc); it sees /api/* and some requests
 * for paths that match no file. It handles two forms, both emailed to Edna
 * through Cloudflare Email Routing:
 *   /api/contacto  the contact form (home, About, service pages)
 *   /api/avisame   the "tell me when the shop opens" sign-up on
 *                  proximamente.html: one email to Edna per sign-up, with
 *                  the same subject each time, so she can find the list
 *                  in her inbox by searching "Lista de la tienda".
 * POST sends; GET tells js/main.js whether to run the spam check. Every
 * other path goes back to the assets, which answer with 404.html.
 *
 * The CONTACT_EMAIL binding can only send to the verified address set in
 * wrangler.jsonc, so the form can't be used to email anyone else.
 *
 * Spam check: Cloudflare Turnstile, on once the Worker has both the
 * TURNSTILE_SITE_KEY and TURNSTILE_SECRET secrets (dashboard: the Worker's
 * Settings > Variables and Secrets). Until then the form works without it.
 */

const FORM_PATH = '/api/contacto';
const NOTIFY_PATH = '/api/avisame';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // same check as js/main.js
const MAX_BODY_BYTES = 64 * 1024; // 5000 characters of any script, URL-encoded
const MAX_LENGTH = { nombre: 100, correo: 254, mensaje: 5000 };
const MIN_MESSAGE = 10;
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const TEXT = {
  sent: 'Tu mensaje se envió. Te respondo pronto.',
  invalid: 'Revisa el formulario: falta tu nombre, un correo válido o un mensaje de al menos 10 caracteres.',
  tooLong: 'El mensaje es demasiado largo. Acórtalo un poco y vuelve a intentarlo.',
  tooMany: 'Has enviado varios mensajes seguidos. Espera un minuto y vuelve a intentarlo.',
  robot: 'No pudimos comprobar que no eres un robot. Vuelve a intentarlo o escríbeme a edna.sapi@gmail.com.',
  failed: 'No se pudo enviar el mensaje. Escríbeme directamente a edna.sapi@gmail.com.',
  notifySent: '¡Listo! Te aviso por correo en cuanto abra la tienda.',
  notifyInvalid: 'Escribe un correo válido, por ejemplo nombre@ejemplo.com.',
  notifyFailed: 'No se pudo guardar tu correo. Vuelve a intentarlo o sígueme en @ednamiau.'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== FORM_PATH && url.pathname !== NOTIFY_PATH) return env.ASSETS.fetch(request);
    if (request.method === 'GET') {
      // The site key is public; it goes to the page so it can show Turnstile.
      const turnstileSiteKey = spamCheckOn(env) ? env.TURNSTILE_SITE_KEY : null;
      return Response.json({ turnstileSiteKey }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
    }
    return url.pathname === NOTIFY_PATH ? handleNotify(request, env, url) : handleContact(request, env, url);
  }
};

/** Checks shared by both forms: same-site origin, rate limit, body size.
    Resolves to the parsed form, or to a Response to send back instead. */
async function readGuardedForm(request, env, url, reply, text) {
  // Browsers send Origin on every POST; refuse forms posted from other sites.
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return reply(403, false, text.failed);

  if (env.CONTACT_RATE_LIMIT) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: clientKey(request) });
    if (!success) return reply(429, false, TEXT.tooMany);
  }

  let form;
  try {
    form = await readForm(request);
  } catch {
    return reply(400, false, text.invalid);
  }
  if (!form) return reply(413, false, TEXT.tooLong);
  return form;
}

/** The shop sign-up: one email address, sent to Edna as its own message. */
async function handleNotify(request, env, url) {
  const reply = request.headers.get('Accept')?.includes('application/json')
    ? replyJson
    : (status, ok, message) => replyPage(status, ok, message, '/proximamente');
  const text = { failed: TEXT.notifyFailed, invalid: TEXT.notifyInvalid };
  const form = await readGuardedForm(request, env, url, reply, text);
  if (form instanceof Response) return form;

  if (field(form, 'sitio_web')) return reply(200, true, TEXT.notifySent);
  const correo = field(form, 'correo');
  if (correo.length > MAX_LENGTH.correo || !EMAIL_PATTERN.test(correo)) {
    return reply(400, false, TEXT.notifyInvalid);
  }
  if (spamCheckOn(env) && !(await passesTurnstile(form, request, env))) {
    return reply(403, false, TEXT.robot);
  }

  try {
    await env.CONTACT_EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: 'Lista de la tienda' },
      replyTo: { email: correo },
      subject: `${env.CONTACT_SUBJECT_PREFIX || ''}Lista de la tienda: ${correo}`,
      text: [
        'Alguien quiere saber cuándo abre la tienda.',
        '',
        `Correo: ${correo}`,
        '',
        '--',
        `Enviado desde la página "Muy pronto" de ${url.host}.`,
        'Para ver a todos, busca "Lista de la tienda" en tu correo.'
      ].join('\n')
    });
  } catch (error) {
    console.error('shop sign-up: send failed', error.code || '', error.message);
    return reply(502, false, TEXT.notifyFailed);
  }
  return reply(200, true, TEXT.notifySent);
}

async function handleContact(request, env, url) {
  const reply = request.headers.get('Accept')?.includes('application/json') ? replyJson : replyPage;

  const form = await readGuardedForm(request, env, url, reply, TEXT);
  if (form instanceof Response) return form;

  // Hidden field that people never see (index.html); bots fill it in. Answer
  // as if it worked so they don't retry.
  if (field(form, 'sitio_web')) return reply(200, true, TEXT.sent);

  const nombre = oneLine(field(form, 'nombre'));
  const correo = field(form, 'correo');
  // Forms posted without JavaScript send line breaks as \r\n; count them
  // as one character, like the textarea's maxlength does.
  const mensaje = field(form, 'mensaje').replace(/\r\n?/g, '\n');
  if (nombre.length > MAX_LENGTH.nombre || correo.length > MAX_LENGTH.correo ||
      mensaje.length > MAX_LENGTH.mensaje) {
    return reply(400, false, TEXT.tooLong);
  }
  if (!nombre || !EMAIL_PATTERN.test(correo) || mensaje.length < MIN_MESSAGE) {
    return reply(400, false, TEXT.invalid);
  }
  if (spamCheckOn(env) && !(await passesTurnstile(form, request, env))) {
    return reply(403, false, TEXT.robot);
  }

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

function spamCheckOn(env) {
  return Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET);
}

/** Asks Turnstile whether the token js/main.js sent is real and unused.
    A form posted without JavaScript has none, so it fails. */
async function passesTurnstile(form, request, env) {
  const token = field(form, 'cf-turnstile-response');
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);
  try {
    const result = await (await fetch(SITEVERIFY_URL, { method: 'POST', body })).json();
    if (!result.success) console.log('contact form: Turnstile said no', result['error-codes']);
    return result.success === true;
  } catch (error) {
    console.error('contact form: Turnstile check failed', error.message);
    return false;
  }
}

/** Rate-limit key: the visitor's IP, or for IPv6 its /64, which one
    connection usually holds whole. */
function clientKey(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!ip.includes(':')) return ip;
  const [head, tail] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const zeros = tail === undefined ? [] : Array(8 - left.length - right.length).fill('0');
  return [...left, ...zeros, ...right].slice(0, 4).join(':');
}

/** Parses the posted form, reading at most MAX_BODY_BYTES (null if larger).
    Content-Length isn't enough: a chunked request doesn't send one. */
async function readForm(request) {
  const chunks = [];
  let size = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  }
  const body = new Blob(chunks);
  const type = request.headers.get('Content-Type') || '';
  return new Response(body, { headers: { 'Content-Type': type } }).formData();
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
function replyPage(status, ok, message, backLink = '/#contacto') {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${ok ? 'Mensaje enviado' : 'Mensaje no enviado'} — Edna Pedraza</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body style="padding-bottom: 0; background: var(--c-contact-page);">
  <main class="contact" style="min-height: 100vh; display: block;">
    <h1 class="contact__title">${ok ? '¡Gracias!' : 'Ups'}</h1>
    <p class="contact-form__status">${message}</p>
    <p class="contact__links"><a href="${backLink}">Volver al sitio</a></p>
  </main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
