import { Resend } from "resend";
import { assertSecret } from "@/lib/env";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    client = new Resend(assertSecret("RESEND_API_KEY", process.env.RESEND_API_KEY, 10));
  }
  return client;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const from = assertSecret("EMAIL_FROM", process.env.EMAIL_FROM, 5);
  const { error } = await getClient().emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
