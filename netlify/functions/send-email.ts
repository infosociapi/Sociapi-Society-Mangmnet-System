export async function handler(event: { httpMethod: string; body: string | null }) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME || "Sociapi Society ERP";

  if (!apiKey || !secretKey || !fromEmail) {
    return json(500, {
      error: "Set MAILJET_API_KEY, MAILJET_SECRET_KEY and MAILJET_FROM_EMAIL in environment variables.",
    });
  }

  let payload: { to?: string | string[]; subject?: string; html?: string };
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { to, subject, html } = payload;
  if (!to || !subject || !html) {
    return json(400, { error: "to, subject and html are required" });
  }

  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ Email: email }));
  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: fromEmail, Name: fromName },
            To: recipients,
            Subject: subject,
            HTMLPart: html,
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { ok: false, error: data?.ErrorMessage || "Mailjet send failed", details: data });
    }
    return json(200, { ok: true, result: data });
  } catch (error) {
    return json(500, { ok: false, error: error instanceof Error ? error.message : "Failed to send email" });
  }
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
