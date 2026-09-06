// server/utils/brevoMailer.js
// Brevo (formerly Sendinblue) transactional email transport.
//
// Required environment variables:
//   BREVO_API_KEY   - Brevo API v3 key (xkeysib-...)
//   BUSINESS_EMAIL  - verified sender address on your Brevo account
//   BUSINESS_NAME   - (optional) sender display name
//
// Brevo is called over plain HTTPS, so no extra npm dependency is needed.

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export const isEmailConfigured = () => Boolean(process.env.BREVO_API_KEY);

const parseSender = () => {
  const raw = (process.env.BUSINESS_EMAIL || '').trim();
  if (!raw) {
    throw new Error('BUSINESS_EMAIL environment variable is missing');
  }

  // Supports both "sales@bekhal.com" and "Bekhal Feeds <sales@bekhal.com>"
  const match = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    return { name: match[1] || process.env.BUSINESS_NAME || 'Bekhal POS', email: match[2] };
  }

  return { name: process.env.BUSINESS_NAME || 'Bekhal POS', email: raw };
};

const toRecipients = (to) =>
  (Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((entry) =>
      typeof entry === 'string' ? { email: entry.trim() } : { email: entry.email, name: entry.name }
    )
    .filter((entry) => entry.email);

/**
 * Send a transactional email through Brevo.
 * @returns {Promise<{ success: boolean, messageId?: string, message?: string }>}
 */
export async function sendEmail({ to, subject, html, text, replyTo, attachments }) {
  if (!isEmailConfigured()) {
    throw new Error('Email service not configured - BREVO_API_KEY missing');
  }

  const recipients = toRecipients(to);
  if (recipients.length === 0) {
    throw new Error('No email recipients provided');
  }

  const payload = {
    sender: parseSender(),
    to: recipients,
    subject,
    htmlContent: html,
  };

  if (text) payload.textContent = text;
  if (replyTo) payload.replyTo = typeof replyTo === 'string' ? { email: replyTo } : replyTo;
  if (Array.isArray(attachments) && attachments.length > 0) payload.attachment = attachments;

  const response = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    console.error(`❌ Brevo request failed [${response.status}]: ${bodyText}`);
    throw new Error(`Brevo request failed [${response.status}]: ${bodyText}`);
  }

  let parsed = {};
  try {
    parsed = bodyText ? JSON.parse(bodyText) : {};
  } catch (_) {
    /* Brevo returned an empty/non-JSON success body */
  }

  return { success: true, messageId: parsed.messageId };
}

export default { sendEmail, isEmailConfigured };
