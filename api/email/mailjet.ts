interface RequestLike {
  method?: string;
  body?: any;
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (data: unknown) => void;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME || "Sociapi Society ERP";

  if (!apiKey || !secretKey) {
    return res.status(500).json({
      error: "MAILJET_API_KEY and MAILJET_SECRET_KEY are missing on the server. Add them in deployment environment variables.",
    });
  }
  if (!fromEmail) {
    return res.status(500).json({
      error: "MAILJET_FROM_EMAIL is missing. Set it to a verified Mailjet sender email.",
    });
  }

  // Body may arrive as a raw string on some platforms.
  let payload: any = req.body || {};
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }

  const { to, subject, html } = payload;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "to, subject and html are required" });
  }

  const recipients = (Array.isArray(to) ? to : [to]).map((email: string) => ({ Email: email }));

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
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
      return res.status(response.status).json({
        ok: false,
        error: data?.ErrorMessage || data?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || "Mailjet send failed",
        details: data,
      });
    }

    return res.status(200).json({ ok: true, result: data });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email via Mailjet",
    });
  }
}
