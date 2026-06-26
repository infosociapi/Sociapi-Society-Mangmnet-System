import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not configured. Email sending is disabled until the server env var is set.");
}

export const resend = new Resend(resendApiKey || "re_configure_in_server_env");

export async function sendWelcomeEmail(to = "sociapisociety@gmail.com") {
  if (!resendApiKey) {
    return { id: "dev-disabled", status: "skipped" as const };
  }

  return resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "Welcome to Sociapi Society ERP",
    html: "<p>Your Sociapi Society ERP account is ready.</p>",
  });
}

export async function sendCredentialsEmail(to: string, username: string, temporaryPassword: string) {
  if (!resendApiKey) {
    return { id: "dev-disabled", status: "skipped" as const };
  }

  return resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "Your Sociapi Society ERP credentials",
    html: `<p>Your account has been created.</p><p><strong>Username:</strong> ${username}</p><p><strong>Temporary Password:</strong> ${temporaryPassword}</p>`,
  });
}