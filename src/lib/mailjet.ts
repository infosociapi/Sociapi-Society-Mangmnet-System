export interface MailjetEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  scheduledAt?: string;
  from?: string;
  fromName?: string;
}

async function parseError(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.message || text;
  } catch {
    return text || `${response.status} ${response.statusText}`;
  }
}

async function postEmail(endpoint: string, payload: MailjetEmailPayload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<{ ok?: boolean; result?: unknown }>;
}

// Frontend-safe adapter. The real Mailjet keys must stay on the server (Vercel/Netlify).
export async function sendMailjetEmail(payload: MailjetEmailPayload) {
  const endpoints = ["/api/email/mailjet", "/.netlify/functions/send-email"];
  const errors: string[] = [];
  for (const endpoint of endpoints) {
    try {
      return await postEmail(endpoint, payload);
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  throw new Error(
    `Email backend failed. ${errors.join(" | ")} | Deploy on Vercel/Netlify and set MAILJET_API_KEY + MAILJET_SECRET_KEY + MAILJET_FROM_EMAIL.`
  );
}

export const emailTemplates = {
  welcome: "Welcome Email",
  taskReminder: "Task Reminder",
  warning: "Warning Notice",
  eventInvite: "Event Invitation",
  passwordReset: "Password Reset",
} as const;
