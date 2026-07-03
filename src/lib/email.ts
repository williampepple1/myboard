import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: {
  to: string | string[]
  subject: string
  htmlContent?: string
  textContent?: string
}) {
  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'notifications@myboard.space'

  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY is not set – skipping send.')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: `MyBoard <${senderEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: htmlContent || textContent,
      text: textContent || subject,
    })

    if (error) {
      console.error('[email] Failed to send:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[email] Error sending email:', err)
    return false
  }
}

function emailLayout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyBoard</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0C66E4;padding:28px 40px;text-align:left;">
              <span style="display:inline-flex;align-items:center;gap:10px;">
                <span style="display:inline-block;width:32px;height:32px;background:#fff;border-radius:6px;text-align:center;line-height:32px;font-weight:800;font-size:18px;color:#0C66E4;">M</span>
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">MyBoard</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #EBECF0;">
              <p style="margin:0;font-size:12px;color:#97A0AF;line-height:1.6;">
                You are receiving this email because an action was taken on your MyBoard account.<br/>
                &copy; ${new Date().getFullYear()} MyBoard. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  acceptUrl,
}: {
  to: string
  organizationName: string
  inviterName?: string
  acceptUrl: string
}) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#172B4D;">You've been invited!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#44546F;line-height:1.6;">
      ${inviterName ? `<strong>${inviterName}</strong> has` : 'Someone has'} invited you to join
      <strong>${organizationName}</strong> on MyBoard — a collaborative project management platform.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background:#0C66E4;border-radius:8px;">
          <a href="${acceptUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Accept Invitation &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:13px;color:#97A0AF;">Or copy this link into your browser:</p>
    <p style="margin:0;font-size:13px;color:#0C66E4;word-break:break-all;">${acceptUrl}</p>

    <div style="margin-top:32px;padding:16px;background:#F4F5F7;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#44546F;line-height:1.6;">
        <strong>What is MyBoard?</strong><br/>
        MyBoard is a Jira-style board for teams to track tasks, bugs, and projects — all in one place.
      </p>
    </div>
  `

  return sendEmail({
    to,
    subject: `You've been invited to join ${organizationName} on MyBoard`,
    htmlContent: emailLayout(body),
    textContent: `You've been invited to join ${organizationName} on MyBoard. Click here to accept: ${acceptUrl}`,
  })
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string
  name?: string
}) {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myboard.space'
  const greeting = name ? `Hi ${name}` : 'Welcome'

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#172B4D;">${greeting}, welcome to MyBoard!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#44546F;line-height:1.6;">
      Your account is ready. Start by creating an organization and your first project board.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background:#0C66E4;border-radius:8px;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
            Go to Dashboard &rarr;
          </a>
        </td>
      </tr>
    </table>

    <div style="margin-top:8px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#172B4D;">Get started in 3 steps:</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EBECF0;">
            <span style="font-size:14px;color:#44546F;"><strong>1.</strong> Create or join an organization</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EBECF0;">
            <span style="font-size:14px;color:#44546F;"><strong>2.</strong> Create your first project board</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EBECF0;">
            <span style="font-size:14px;color:#44546F;"><strong>3.</strong> Invite your teammates</span>
          </td>
        </tr>
      </table>
    </div>
  `

  return sendEmail({
    to,
    subject: 'Welcome to MyBoard',
    htmlContent: emailLayout(body),
    textContent: `${greeting}, welcome to MyBoard! Visit your dashboard: ${dashboardUrl}`,
  })
}
