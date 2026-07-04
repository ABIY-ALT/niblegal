import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// ─── Transport ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Base template wrapper ────────────────────────────────────────────────────
function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f4f6fb; margin:0; padding:0; }
    .container { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#1a2d7a,#0e1d50); padding:28px 32px; }
    .header h1 { color:#f5c842; font-size:22px; margin:0 0 4px; font-weight:700; }
    .header p  { color:rgba(255,255,255,0.6); font-size:12px; margin:0; letter-spacing:1px; text-transform:uppercase; }
    .body { padding:32px; }
    .body h2 { font-size:18px; color:#1a1d2e; margin:0 0 12px; }
    .body p  { font-size:14px; color:#4b5675; line-height:1.75; margin:0 0 16px; }
    .btn { display:inline-block; padding:12px 24px; background:#EAB308; color:#3B2718; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px; }
    .footer { background:#f8f9fc; padding:20px 32px; font-size:11px; color:#8891a8; border-top:1px solid #e8ecf4; }
    .divider { border:none; border-top:1px solid #e8ecf4; margin:20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NIB — Legal Management</h1>
      <p>Nib International Bank S.C. · Legal Services Department</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      This is an automated message from the NIB Legal Management System. Do not reply directly to this email.
      <br/>© 2026 Nib International Bank S.C. · Legal Services
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Templates ──────────────────────────────────────────────────────────
export const EmailTemplates = {
  contractAssigned: (data: { recipientName: string; contractNumber: string; contractTitle: string; actionUrl: string }) =>
    wrapTemplate(
      `Contract Assigned: ${data.contractNumber}`,
      `<p>Dear ${data.recipientName},</p>
       <p>A contract has been assigned to you for processing:</p>
       <p><strong>${data.contractTitle}</strong><br/>Reference: <code>${data.contractNumber}</code></p>
       <p>Please review and take the appropriate action within the SLA period.</p>
       <hr class="divider"/>
       <a href="${data.actionUrl}" class="btn">View Contract →</a>`
    ),

  approvalRequired: (data: { recipientName: string; itemTitle: string; itemNumber: string; module: string; actionUrl: string }) =>
    wrapTemplate(
      `Action Required: ${data.module} Approval`,
      `<p>Dear ${data.recipientName},</p>
       <p>Your approval is required for the following item:</p>
       <p><strong>${data.itemTitle}</strong><br/>Reference: <code>${data.itemNumber}</code></p>
       <p>Please log in to the Legal Management System and take action at your earliest convenience.</p>
       <hr class="divider"/>
       <a href="${data.actionUrl}" class="btn">Review & Approve →</a>`
    ),

  approvalCompleted: (data: { recipientName: string; itemTitle: string; decision: string; comments?: string; actionUrl: string }) =>
    wrapTemplate(
      `Approval Decision: ${data.decision}`,
      `<p>Dear ${data.recipientName},</p>
       <p>Your submission <strong>${data.itemTitle}</strong> has received a decision: <strong>${data.decision}</strong>.</p>
       ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
       <hr class="divider"/>
       <a href="${data.actionUrl}" class="btn">View Details →</a>`
    ),

  contractExpiry: (data: { recipientName: string; contractTitle: string; contractNumber: string; expiryDate: string; daysLeft: number; actionUrl: string }) =>
    wrapTemplate(
      `Contract Expiry Alert — ${data.daysLeft} Days Remaining`,
      `<p>Dear ${data.recipientName},</p>
       <p>The following contract is expiring soon and requires your attention:</p>
       <p><strong>${data.contractTitle}</strong><br/>
          Reference: <code>${data.contractNumber}</code><br/>
          Expiry Date: <strong>${data.expiryDate}</strong><br/>
          Days Remaining: <strong style="color:#ef4444">${data.daysLeft} days</strong></p>
       <p>Please initiate renewal, extension, or archiving as appropriate.</p>
       <hr class="divider"/>
       <a href="${data.actionUrl}" class="btn">Manage Contract →</a>`
    ),

  slaAlert: (data: { recipientName: string; itemTitle: string; itemNumber: string; deadline: string; actionUrl: string }) =>
    wrapTemplate(
      `⚠ SLA Alert — Immediate Action Required`,
      `<p>Dear ${data.recipientName},</p>
       <p>An SLA deadline is approaching or has been breached for:</p>
       <p><strong>${data.itemTitle}</strong><br/>Reference: <code>${data.itemNumber}</code><br/>Deadline: <strong>${data.deadline}</strong></p>
       <hr class="divider"/>
       <a href="${data.actionUrl}" class="btn">View Item →</a>`
    ),

  announcement: (data: { title: string; body: string; actionUrl?: string }) =>
    wrapTemplate(
      data.title,
      `<p>${data.body}</p>
       ${data.actionUrl ? `<hr class="divider"/><a href="${data.actionUrl}" class="btn">Learn More →</a>` : ''}`
    ),
};

// ─── Email Service ────────────────────────────────────────────────────────────
export const EmailService = {
  async send(opts: {
    to: string;
    subject: string;
    html: string;
    template: string;
    userId?: string;
  }) {
    let status = 'sent';
    let error: string | undefined;

    try {
      await transporter.sendMail({
        from: `"NIB Legal System" <${process.env.SMTP_FROM ?? 'noreply@nibbank.et'}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
    } catch (err: any) {
      status = 'failed';
      error = err?.message ?? 'Unknown error';
      console.error('[EmailService] Failed to send email:', err);
    }

    // Log regardless of outcome
    await prisma.emailLog.create({
      data: {
        to: opts.to,
        subject: opts.subject,
        template: opts.template,
        status,
        error,
        userId: opts.userId,
      },
    }).catch(console.error);

    return { status, error };
  },

  async sendContractAssigned(to: string, data: Parameters<typeof EmailTemplates.contractAssigned>[0] & { userId?: string }) {
    return this.send({
      to,
      subject: `[NIB Legal] Contract Assigned: ${data.contractNumber}`,
      html: EmailTemplates.contractAssigned(data),
      template: 'contractAssigned',
      userId: data.userId,
    });
  },

  async sendApprovalRequired(to: string, data: Parameters<typeof EmailTemplates.approvalRequired>[0] & { userId?: string }) {
    return this.send({
      to,
      subject: `[NIB Legal] Action Required: ${data.module} Approval — ${data.itemNumber}`,
      html: EmailTemplates.approvalRequired(data),
      template: 'approvalRequired',
      userId: data.userId,
    });
  },

  async sendApprovalCompleted(to: string, data: Parameters<typeof EmailTemplates.approvalCompleted>[0] & { userId?: string }) {
    return this.send({
      to,
      subject: `[NIB Legal] Approval Decision: ${data.decision} — ${data.itemTitle}`,
      html: EmailTemplates.approvalCompleted(data),
      template: 'approvalCompleted',
      userId: data.userId,
    });
  },

  async sendContractExpiry(to: string, data: Parameters<typeof EmailTemplates.contractExpiry>[0] & { userId?: string }) {
    return this.send({
      to,
      subject: `[NIB Legal] ⚠ Contract Expiry Alert — ${data.daysLeft} Days: ${data.contractNumber}`,
      html: EmailTemplates.contractExpiry(data),
      template: 'contractExpiry',
      userId: data.userId,
    });
  },

  async sendSlaAlert(to: string, data: Parameters<typeof EmailTemplates.slaAlert>[0] & { userId?: string }) {
    return this.send({
      to,
      subject: `[NIB Legal] ⚠ SLA Alert — ${data.itemNumber}`,
      html: EmailTemplates.slaAlert(data),
      template: 'slaAlert',
      userId: data.userId,
    });
  },

  async sendAnnouncement(to: string, data: Parameters<typeof EmailTemplates.announcement>[0] & { userId?: string }) {
    return this.send({
      to,
      subject: `[NIB Legal] Announcement: ${data.title}`,
      html: EmailTemplates.announcement(data),
      template: 'announcement',
      userId: data.userId,
    });
  },
};
