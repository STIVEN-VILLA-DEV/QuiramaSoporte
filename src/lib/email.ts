import { Resend } from "resend";

// ============================================================
// EMAIL UTILITY — Resend
// Config via environment variables:
//   RESEND_API_KEY — API key from https://resend.com
//   RESEND_FROM   — verified sender email (default: onboading@resend.dev)
// ============================================================

const apiKey = process.env.RESEND_API_KEY || "";
const from = process.env.RESEND_FROM || "onboarding@resend.dev";

function isConfigured(): boolean {
  return Boolean(apiKey);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!isConfigured()) {
    console.warn(
      "[email] Resend not configured — set RESEND_API_KEY env var. Email NOT sent."
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    await resend.emails.send({
      from: `IT Manager <${from}>`,
      to: recipients,
      subject: options.subject,
      html: options.html,
    });

    return true;
  } catch (err) {
    console.error("[email] Failed to send via Resend:", err);
    return false;
  }
}

// ============================================================
// TICKET NOTIFICATION EMAIL — HTML template
// ============================================================

export function buildTicketEmailHtml(ticket: {
  id: string;
  employee_name: string;
  branch_name: string;
  department: string;
  category: string;
  subject: string;
  description: string;
  is_blocking: boolean;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ticketUrl = `${appUrl}/dashboard/tickets/${ticket.id}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 24px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6);">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Nuevo Ticket de Soporte</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">
          Se ha registrado un nuevo reporte en IT Manager
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Empleado</span>
              <p style="margin: 4px 0 0; font-size: 15px; color: #333; font-weight: 500;">${ticket.employee_name}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Sede / Departamento</span>
              <p style="margin: 4px 0 0; font-size: 15px; color: #333;">${ticket.branch_name} — ${ticket.department}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Categoria</span>
              <p style="margin: 4px 0 0; font-size: 15px; color: #333;">${ticket.category}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Asunto</span>
              <p style="margin: 4px 0 0; font-size: 15px; color: #333; font-weight: 500;">${ticket.subject}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Descripcion</span>
              <p style="margin: 4px 0 0; font-size: 14px; color: #555; line-height: 1.5; white-space: pre-wrap;">${ticket.description}</p>
            </td>
          </tr>
          ${ticket.is_blocking ? `
          <tr>
            <td style="padding-bottom: 16px;">
              <span style="display: inline-block; padding: 6px 14px; background: #fef2f2; color: #dc2626; border-radius: 999px; font-size: 13px; font-weight: 600;">
                BLOQUEA EL TRABAJO
              </span>
            </td>
          </tr>` : ""}
        </table>

        <a href="${ticketUrl}" style="display: inline-block; margin-top: 8px; padding: 12px 28px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Ver Ticket en IT Manager
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background: #f9fafb; border-top: 1px solid #eee;">
        <p style="margin: 0; font-size: 12px; color: #999;">
          IT Manager — Sistema de Gestion de Activos Tecnologicos
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
