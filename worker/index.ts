interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
}

const CONTACT_EMAIL = "contato@calculoadicionalnoturno.com";
const MAX_BODY_BYTES = 24_000;
const HSTS_VALUE = "max-age=31536000; includeSubDomains";

function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", HSTS_VALUE);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function needsTrailingSlash(pathname: string) {
  if (pathname === "/" || pathname.endsWith("/") || pathname.startsWith("/api/")) return false;
  return !pathname.split("/").at(-1)?.includes(".");
}

function json(message: string, status = 200) {
  return Response.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": HSTS_VALUE
      }
    }
  );
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.trim().replace(/\r\n/g, "\n").slice(0, maxLength)
    : "";
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]!
  );
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 254;
}

async function sendEmail(
  env: Env,
  subject: string,
  html: string,
  replyTo?: string
) {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) {
    return { ok: false, configurationMissing: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [CONTACT_EMAIL],
      reply_to: replyTo,
      subject,
      html
    })
  });

  return { ok: response.ok, configurationMissing: false };
}

async function readBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return null;
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) return null;
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function handleContact(request: Request, env: Env) {
  const body = await readBody(request);
  if (!body) return json("Dados inválidos.", 400);
  if (clean(body.company, 100)) return json("Mensagem recebida.");

  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const subject = clean(body.subject, 140);
  const message = clean(body.message, 5_000);
  const accepted = body.acknowledgment === "on" || body.acknowledgment === true;

  if (name.length < 2 || !validEmail(email) || subject.length < 3 || message.length < 10 || !accepted) {
    return json("Revise os campos obrigatórios e tente novamente.", 400);
  }

  const result = await sendEmail(
    env,
    `[Contato do site] ${subject}`,
    `<h1>Nova mensagem pelo site</h1>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
      <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    email
  );

  if (result.configurationMissing) {
    return json("O envio está temporariamente indisponível. Escreva diretamente para nosso e-mail.", 503);
  }
  if (!result.ok) return json("Não foi possível enviar agora. Tente novamente mais tarde.", 502);
  return json("Mensagem enviada. Obrigado pelo contato!");
}

async function handleNewsletter(request: Request, env: Env) {
  const body = await readBody(request);
  if (!body) return json("Informe um e-mail válido.", 400);
  if (clean(body.company, 100)) return json("Inscrição recebida.");

  const email = clean(body.email, 254).toLowerCase();
  if (!validEmail(email)) return json("Informe um e-mail válido.", 400);
  if (!env.RESEND_API_KEY) {
    return json("A inscrição está temporariamente indisponível.", 503);
  }

  const contactResponse = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, unsubscribed: false })
  });

  if (!contactResponse.ok && contactResponse.status !== 409) {
    return json("Não foi possível concluir agora. Tente novamente.", 502);
  }

  await sendEmail(
    env,
    "[Newsletter] Nova inscrição",
    `<h1>Nova inscrição na newsletter</h1><p><strong>E-mail:</strong> ${escapeHtml(email)}</p>`,
    email
  );

  return json("Inscrição confirmada. Obrigado!");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if ((request.method === "GET" || request.method === "HEAD") && needsTrailingSlash(url.pathname)) {
      url.pathname = `${url.pathname}/`;
      return withSecurityHeaders(Response.redirect(url, 308));
    }

    if (request.method === "POST" && url.pathname === "/api/contact") {
      return handleContact(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/newsletter") {
      return handleNewsletter(request, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return json("Endpoint não encontrado.", 404);
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  }
};
