import { Resend } from "resend";

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

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      error: "RESEND_API_KEY is missing on the server. Add it in deployment environment variables.",
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Vercel may pass the body as a raw string; parse it safely.
  let payload: any = req.body || {};
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }
  const { to, subject, html, from = "onboarding@resend.dev" } = payload;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "to, subject and html are required" });
  }

  try {
    const result = await resend.emails.send({ from, to, subject, html });
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    });
  }
}