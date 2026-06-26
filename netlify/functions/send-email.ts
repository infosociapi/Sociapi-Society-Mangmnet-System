import { Resend } from "resend";

export async function handler(event: { httpMethod: string; body: string | null }) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return json(500, {
      error: "RESEND_API_KEY is missing on the server. Add it in Netlify/Vercel environment variables.",
    });
  }

  let payload: { to?: string | string[]; subject?: string; html?: string; from?: string };
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { to, subject, html, from = "onboarding@resend.dev" } = payload;
  if (!to || !subject || !html) {
    return json(400, { error: "to, subject and html are required" });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({ from, to, subject, html });
    return json(200, { ok: true, result });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    });
  }
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}