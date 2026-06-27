import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME || "Sociapi Society ERP";

  if (!apiKey || !secretKey) {
    return res.status(500).json({
      error: "MAILJET_API_KEY and MAILJET_SECRET_KEY are missing on the server.",
    });
  }
  if (!fromEmail) {
    return res.status(500).json({
      error: "MAILJET_FROM_EMAIL is missing. Set it to a verified Mailjet sender email.",
    });
  }

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

    // Log full Mailjet response so it shows in Vercel logs.
    console.log("MAILJET_RESPONSE", JSON.stringify(data));
    console.log("MAILJET_FROM_USED", fromEmail);

    const msgStatus = data?.Messages?.[0]?.Status;
    if (!response.ok || msgStatus !== "success") {
      return res.status(response.ok ? 502 : response.status).json({
        ok: false,
        error:
          data?.ErrorMessage ||
          data?.Messages?.[0]?.Errors?.[0]?.ErrorMessage ||
          `Mailjet did not confirm send (status: ${msgStatus || "unknown"})`,
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
