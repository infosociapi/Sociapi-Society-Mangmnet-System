export interface ResendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  scheduledAt?: string;
  from?: string;
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

async function postEmail(endpoint: string, payload: ResendEmailPayload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{ ok?: boolean; id?: string; status?: "queued" | "sent"; result?: unknown }>;
}

// Frontend-safe adapter contract. The real Resend API key must remain on the server.
export async function sendResendEmail(payload: ResendEmailPayload) {
  const endpoints = ["/api/email/resend", "/.netlify/functions/send-email"];
  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      return await postEmail(endpoint, payload);
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  throw new Error(
    `Email backend failed. ${errors.join(" | ")} | Fix: deploy the serverless endpoint and set RESEND_API_KEY in server environment variables.`
  );
}

export const emailTemplates = {
  welcome: "Welcome Email",
  taskReminder: "Task Reminder",
  warning: "Warning Notice",
  eventInvite: "Event Invitation",
  passwordReset: "Password Reset",
} as const;